// Intercom agent

var bodyParser = require('body-parser')
var http = require('http')
var exp = require('express');
var mqtt = require('mqtt')

var app = exp();
app.use(bodyParser.urlencoded({ extended: false}));

var options = {
	host:"localhost",
	port:1883
}


// Starting web server for listen POST request
var server = app.listen(8080, () => {
        var host = server.address().address
        var port = server.address().port
        console.log("Example app listening at http://%s:%s", host, port)

})

// Connect to local mqtt broker
var agent = mqtt.connect(options)
agent.on("connect", () => {
	console.log("Succefully connected")
})
// Main function to handle POST
app.post('/api/', (req, res) => {
	const body = req.body
        console.log("Post request : ", body)
        res.send("OK")
        try {
        	agent.publish("634555/intercom_call/value","true")
        }
        catch (err) {
        	console.log(err)
        }
})

