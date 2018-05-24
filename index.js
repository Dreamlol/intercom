// Intercom agent

//var bodyParser = require('body-parser')
var auth = require('http-auth');
var http = require('http');
var exp = require('express');
var mqtt = require('mqtt');
var request = require('request');
var _ = require('lodash');
const { exec } = require("child_process");

var app = exp();

app.use(auth.connect(digest));

var mqtt_options = {
	host:"localhost",
    port:1883,
	topic:{ "answer":"bridge/intercom_answer/command/set-value", 
		"snapshot":"bridge/intercom_snapshot/command/set-value",
		"switch":"bridge/intercom_switch/command/set-value" 
	}
};
var digest = auth.digest({
	user : 'admin',
	pass: 'admin'
});
//var intercom_url = {
//	"stop_ringing": "http://192.168.0.105/enu/trigger/stop_ringing" ,
//	"open_door":"http://192.168.0.105/api/switch/ctrl?switch=1&action=on",
//	"get_snapshot":"http://192.168.0.105/api/camera/snapshot?width=640&height=480&source=internal"
//}

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
        const body = req.params['0']
        console.log("Somebody wants call to apartaments :", body)
        res.send("OK")
        // TODO add condition and security
        try {
        	client.publish("bridge/intercom_call/value", body)
        }
        catch (err) {
        	console.log(err)
        }
})

// Recieve message from client and send https request in order to switch door and goint to stream video/audio
// 
client.on("message", (topic, payload) => {
        const obj = JSON.parse(payload)
        console.log("Get message via wss: %s from topic %s", obj, topic)
        if (topic === mqtt_options.topic["switch"] && obj === 1) {
				url_options_open_door.auth = intercom_auth;
                		request.get(url_options_open_door, (err, res, body) => {
				console.log('statusCode:', res && res.statusCode, "The door was open")
				StopRinging()
                })  
		}
		//Begin streaming
		else if(topic === mqtt_options.topic["answer"] && obj === 1){
			console.log("Client answered successfuly")
			CreateStream("634555")
		}
		//
		else if(topic === mqtt_options.topic["answer"] && obj === 2){
			console.log("call rejected")
			StopRinging()
		}
       		else if(topic === mqtt_options.topic["snapshot"]){
			SendSnapshot();
		}

		//Add get request to stop ringing if client answered
})      

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

function StopRinging(){
		url_options_stop_ringing.auth = intercom_auth;
		request.get(url_options_stop_ringing, (err, res) => {
			console.log('statusCode:', res && res.statusCode, "Stop ringing")
		})
}

function CreateStream(peer_id){

        const webrtc_bin = exec(`./webrtc-sendrecv_g722 --peer-id=${peer_id}`);

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

