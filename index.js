// Intercom agent


var http = require('http')
var exp = require('express');
var app = exp();
var mqtt = require('mqtt')



var server = app.listen(8080, () => {
        var host = server.address().address
        var port = server.address().port
        console.log("Example app listening at http://%s:%s", host, port)

})

var options = {
	host:"localhost",
	port:1883
}

var agent = mqtt.connect(options)

agent.on("connect", () => {
	console.log("Succefully connected")
})

app.post('/api/', (req, res) => {
        console.log("Post method")
        res.send("OK")
        try {
        	agent.publish("634555/intercom_call/value","true")
        }
        catch (err) {
        	console.log(err)
        }	
        	        

})