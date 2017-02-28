
var debug = require("./debug.js").server;
var log = require("./debug.js").log;

//=============== MODULES ================================

var router = require("./router.js");
var dbi = require("./dbi.js");
var files = require("./files.js");
var player = require('./player.js');
var session = require("./session.js");
var maps = require("./maps.js");
var stats = require("./stats.js");
var accounts = require("./accounts.js");
var game = require("./game.js");
var chat = require("./chat.js");
var saves = require("./saves.js");

//========================================================

var Server = function() {}

// Server initialization
Server.prototype.init = function() {
	// Connect to database
	dbi.connect();
	
	// Set up listeners
	session.listen(router);
	maps.listen(router);
	stats.listen(router);
	accounts.listen(router);
	game.listen(router);
	chat.listen(router);
	saves.listen(router);
}

Server.prototype.run = function(io) {
	// Begin handling connections
	io.sockets.on("connection", function(socket) {
	    socket.on("message", function(message) {
		if (debug) log("server.js: Routing " + message.name);
		var param = {socket:socket, name:message.name, data:message.data};
		router.route(param);
	    });
	});
	// Update the game at 30 fps, update stats once per second
	setInterval(game.update, 1000/30);
	setInterval(game.updateStats, 1000);
}

module.exports = new Server();
