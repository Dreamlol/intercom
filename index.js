// Intercom agent

//var bodyParser = require('body-parser')
//var auth = require('http-auth');
var http = require('http');
var exp = require('express');
var mqtt = require('mqtt');
var request = require('request');
var _ = require('lodash');
const { exec } = require("child_process");

var app = exp();

//app.use(auth.connect(digest));

var mqtt_options = {
	host:"localhost",
    port:1883,
	topic:{
		"open":"bridge/intercom_call/command/open"
	}
};

var intercom_auth = {
	'url': null,
	'user': 'admin',
	'pass': 'admin',
	'sendImmediately': false
};

// URL for get picture from camera
var url_options_snapshot = {
        'url': 'http://192.168.0.105/api/camera/snapshot?width=640&height=480&source=internal',
        'auth': null
    };
// URL for activate relay(open door)
var url_options_open_door = {
        'url': 'http://192.168.0.105/api/switch/ctrl?switch=1&action=on',
        'auth': null
	};
// URL fot stop ringing in answer or timeout call
var url_options_stop_ringing = {
    'url': 'http://192.168.0.105/enu/trigger/stop_ringing',
    'auth': null
};

// Starting web server for listen POST request
var server = app.listen(8080, () => {
        var host = server.address().address
        var port = server.address().port
        console.log("Start listening at http://%s:%s", host, port)

})

// Connect to local mqtt broker
var client = mqtt.connect(mqtt_options)
	client.on("connect", () => {
        client.subscribe(Object.values(mqtt_options.topic), (err, granted) => {
		console.log(`Subcribed on next topic: ${JSON.stringify(granted)}`)
	});
        console.log("Succefully connected to mqtt bridge");
})

// Main function to handle GET request and call to client
// TODO : TODO add certificate security and login/pass authentification
app.get('/*', (req, res) => {
//        const body = JSON.stringify({"apartment":req.params['0']});
        const body = req.params['0'];
        console.log("Somebody wants call to apartaments :", body.toString());
        res.send("OK");
	console.log(body);
        // TODO add condition and security
	if (body.toString() === "stopring"){
		StopRinging();
	}
	else {
        	try {
			StartRinging();
			const apartment = JSON.stringify({"apartment":req.params['0']});
        		client.publish("bridge/intercom_call/value", apartment.toString());
        	}
        	catch (err) {
        		console.log(err);
       		}
	}
})
// Recieve message from client and send https request in order to switch door and goint to stream video/audio
//
client.on("message", (topic, payload) => {
        if (topic === mqtt_options.topic["open"]) {
                const str = JSON.parse(payload)
                console.log(str);
        	console.log("Get message via wss: %s from topic %s", str, topic);
		switch(str.body.call || str.body.codec || str.body.switch){
			case "264" : {
				CreateStream("634555", 264);
				StopRinging();
				break;
			}
			case "8" : {
				CreateStream("634555", 8);
				StopRinging();
				break;
			}
			case "open" : {
				url_options_open_door.auth = intercom_auth;
                		request.get(url_options_open_door, (err, res, body) => {
				        console.log('statusCode:', res && res.statusCode, "The door was open");
				});
				StopRinging();
				break;
			}
			case "reject" : {
				StopRinging();
			}
	}
}
});


// Snapshot from camera and sent to client as a picture
function SendSnapshot(){
	url_options_snapshot.auth = intercom_auth;
        request.get(url_options_snapshot, (err, res, body) => {
                console.log('statusCode:', res && res.statusCode)
                const buf = Buffer.from(body, "base64")
                client.publish("bridge/intercom_snapshot/value", body)
                console.log("Snapshot is sending");
        })
}
//Add get request to stop ringing if client answered
async function StopRinging(){
	const stop = await exec(`killall gst-launch-1.0`);
	console.log("Call rejected");
}

async function CreateStream(peer_id, codec){
        if(codec === 264){
                const webrtc_bin = await exec(`./webrtc-sendrecv_g722 --peer-id=${peer_id}`);

                webrtc_bin.stdout.on( 'data', data => {
                console.log( `stdout: ${data}` );
                 });

                webrtc_bin.stderr.on( 'data', data => {
                console.log( `stderr: ${data}` );
                });

                webrtc_bin.on('close', code => {
                    console.log( `child process exited with code ${code}`);
                });
                }
        else if(codec === 8){
                const webrtc_bin = await exec(`./webrtc-sendrecv_vp8 --peer-id=${peer_id}`);

                webrtc_bin.stdout.on( 'data', data => {
                    console.log( `stdout: ${data}` );
                });

                webrtc_bin.stderr.on( 'data', data => {
                    console.log( `stderr: ${data}` );
                });

                webrtc_bin.on('close', code => {
                console.log( `child process exited with code ${code}`);
        });
        }
}

async function StartRinging(){
    const ring = await exec(`gst-launch-1.0 -v filesrc location=./drake_in_my_feelings.wav ! wavparse ! audioconvert ! audioresample ! avenc_g722 ! rtpg722pay  ! udpsink host=192.168.0.105 port=5000`);

    ring.stdout.on( 'data', data => {
        console.log( `stdout: ${data}` );
    });

    ring.stderr.on( 'data', data => {
        console.log( `stderr: ${data}` );
    });

    ring.on('close', code => {
        console.log( `child process exited with code ${code}`);
    });
}

