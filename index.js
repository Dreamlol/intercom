// Intercom agent

//var bodyParser = require('body-parser')
var http = require('http');
var exp = require('express');
var mqtt = require('mqtt');
var request = require('request');
var _ = require('lodash');

var app = exp();
//app.use(bodyParser.urlencoded({ extended: true}));
//var sub_topics = {"answer":"bridge/intercom_answer/command/set-value", "snapshot":"bridge/intercom_snapshot/command/set-value"}
var mqtt_options = {
	host:"localhost",
        port:1883,
        topic:{"answer":"bridge/intercom_answer/command/set-value", "snapshot":"bridge/intercom_snapshot/command/set-value"}

};

var intercom_url = {
	"stop_ringing": "http://192.168.0.105/enu/trigger/stop_ringing" ,
	"open_door":"http://192.168.0.105/api/switch/ctrl?switch=1&action=on",
	"get_snapshot":"http://192.168.0.105/api/camera/snapshot?width=640&height=480&source=internal"
}
var intercom_request = {
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
        client.subscribe(mqtt_options.topic["answer"]);
        client.subscribe(mqtt_options.topic["snapshot"]);
        console.log("Succefully connected to mqtt bridge");
})

// Main function to handle GET request and call to client
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
// TODO add certificate security and login/pass autorisation
client.on("message", (topic, payload) => {
        const obj = JSON.parse(payload)
        console.log("Get message via wss: %s from topic %s", obj, topic)
        if (topic === mqtt_options.topic["answer"] && obj === 1) {
				url_options_open_door.auth = auth;
                request.get(url_options_open_door, (err, res, body) => {
                        console.log('statusCode:', res && res.statusCode, "The door was open")
                })  
		}
		else if(topic === mqtt_options.topic["answer"] && obj === 2){
			console.log("Client answered successfuly")
			StopRinging()
		}
        else if(topic === mqtt_options.topic["snapshot"]){
		//  SendSnapshot();
			intercom_req.url = intercom_url.get_snapshot;
			sendRequest(intercom_req)
			console.log("Snapshot is sending")
		}
		//Add get request to stop ringing if client answered
})      

// Snapshot from camera and sent to client as a picture
function SendSnapshot(){
		intercom_req.url = intercom_url.get_snapshot;
        request.get(intercom_req, (err, res, body) => {
                console.log('statusCode:', res && res.statusCode)
                const buf = Buffer.from(body, "base64")
                client.publish("bridge/intercom_snapshot/value", body)
                console.log("Snapshot is sending");
        })      
}

function StopRinging(){
		url_options_stop_ringing.auth = auth;
		request.get(url_options_stop_ringing, (err, res) => {
			console.log('statusCode:', res && res.statusCode)
		})
}

//function CreateStream("path to binary file"){
//
//}

function sendRequest(ref) {
	request.get(ref, (req, res, body) => {
		console.log('statusCode:', res && res.statusCode)
	})
}