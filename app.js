/**
 * Created by artiom on 09/12/15.
 */

var express = require("express"),
	app = express(),
	bodyParser  = require("body-parser"),
	methodOverride = require("method-override"),
	redis = require("redis"),
	//mysql = require('mysql'),
	config = require("./config");

//var connection = mysql.createConnection(config.database);
var redisClient = redis.createClient(config.redis.port, config.redis.host);

redisClient.on('connect', function(){
	console.log('connected to redis');
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());

//require("./routes/accounts.js")(app, connection);
require("./routes/listManager.js")(app, redisClient);

var router = express.Router();

router.get('/', function(req, res) {
	res.send("¡Hola Mundo!");
});

app.use(router);

app.listen(3000, function() {
	console.log("Node server running on http://localhost:3000");
});
