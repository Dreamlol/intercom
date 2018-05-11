// Intercom agent

//var bodyParser = require('body-parser')
var http = require('http');
var exp = require('express');
var mqtt = require('mqtt');
var request = require('request');

var app = exp();
//app.use(bodyParser.urlencoded({ extended: true}));

var options = {
	host:"localhost",
	port:1883
}
var url_options = {
        'url': 'http://192.168.0.105/api/camera/snapshot?width=640&height=480&source=internal',
        'auth': {
            'user': 'admin',
            'pass': 'admin',
            'sendImmediately': false
        }
    };

// Starting web server for listen POST request
var server = app.listen(8080, () => {
        var host = server.address().address
        var port = server.address().port
        console.log("Start listening at http://%s:%s", host, port)

})

// Connect to local mqtt broker
var client = mqtt.connect(options)
client.on("connect", () => {
	console.log("Succefully connected to mqtt bridge")
})

// Main function to handle GET request and call to client
app.get('/*', (req, res) => {
        const body = req.params['0']
//      console.log("GET request : ", body)
        console.log(body)
        res.send("OK")
        try {
        	client.publish("bridge/intercom_call/value", body)
        }
        catch (err) {
        	console.log(err)
        }
})

// Recieve message from client and send https request in order to switch door
// TODO add certificate security and login/pass autorisation
client.subscribe('bridge/intercom_answer/command/set-value');
client.on("message", (topic, payload) => {
        const obj = JSON.parse(payload)
        console.log("Get message via wss: ", obj)
        // add condition
        request.get("http://192.168.0.105/api/switch/ctrl?switch=1&action=on",(err, res, body) => {
                console.log('statusCode:', res && res.statusCode)
                })
})

// Snapshot from camera and sent to client as a picture

client.subscribe('bridge/intercom_snapshot/command/set-value');
client.on("message", (topic, payload) => {
        const obj = JSON.parse(payload)
        request.get(url_options, (err, res, body) => {
                console.log('statusCode:', res && res.statusCode)
                const buf = Buffer.from(body, "base64")
            //    console.log(buf)
                client.publish("bridge/intercom_snapshot/value", body)
                })      
})