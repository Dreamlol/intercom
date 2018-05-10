// Intercom agent

//var bodyParser = require('body-parser')
var http = require('http')
var exp = require('express');
var mqtt = require('mqtt')
var request = require('request')

var app = exp();
//app.use(bodyParser.urlencoded({ extended: true}));

var options = {
	host:"localhost",
	port:1883
}


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
        	agent.publish("bridge/intercom_call/value", body)
        }
        catch (err) {
        	console.log(err)
        }
})

// Send https request to switch door

client.subscribe('bridge/intercom_answer/command/set-value');
client.on("message", (topic, payload) => {
        const obj = JSON.parse(payload)
        console.log("Get message via wss: ", obj)
        request.get("http://192.168.0.105/api/switch/ctrl?switch=1&action=on",(err, res, body) => {
                console.log('statusCode:', res && res.statusCode)
                })
        client.end()
})
