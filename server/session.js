
var debug = require("./debug.js").session;
var log = require("./debug.js").log;

var server = require("./server.js");
var dbi = require("./dbi.js");

var Session = function() {};

Session.prototype.listen = function(sox) {
    if(debug) log("server/session.js: listen()");
    sox.listen("endGameSession", this.endGameSession);
    sox.listen("exitGameSession", this.exitGameSession);
    sox.listen("enterGameSession", this.enterGameSession);
}

var GAME_SESSION = {host:null, map:"", players:[]};

Session.prototype.endGameSession = function(data) {
    if(debug) log("server/session.js: endGameSession()");
    // Reset the object
    GAME_SESSION.host = null;
    GAME_SESSION.map = "";
    // Set everyone offline
    for(i in GAME_SESSION.players) {
	dbi.setUserOnlineStatus(GAME_SESSION.players[i].username, false);
    }
    // Null out the player list
    GAME_SESSION.players = [];
    // Log everyone out
    var CLIENT_LIST = data.clients;
    for(i in CLIENT_LIST) {
		CLIENT_LIST[i].player = null;
		server.emit(CLIENT_LIST[i].socket, "logoutResponse", null);
		server.emit(CLIENT_LIST[i].socket, "collapseMenus", null);
    }
}

Session.prototype.exitGameSession = function (data) {
    if(debug) log("server/session.js: exitGameSession()");
    // Remove the player from the game session list
    index = GAME_SESSION.players.indexOf(data);
    if(index > -1) GAME_SESSION.players.splice(index, 1);
    // Turn the player offline in the database
    dbi.setUserOnlineStatus(data.username, false);
    // If the host leaves, it's game over for everyone
    if(data === GAME_SESSION.host) this.endGameSession(data);
}

Session.prototype.enterGameSession = function(data) {
    if(debug) log("server/session.js: enterGameSession()");
    // If no one is online, the player becomes host
    if(GAME_SESSION.players.length == 0) {
	GAME_SESSION.host = data;
    }
    // Add player to game session list
    GAME_SESSION.players.push(data);
    // Turn the player online in the database
    dbi.setUserOnlineStatus(data.username, true);
}

module.exports = new Session();
module.exports.GAME_SESSION = GAME_SESSION;
