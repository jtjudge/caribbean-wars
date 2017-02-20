
/*================= CONTENTS ================================
  1) Modules
  2) Server Initialization
  3) Socket listeners
  4) Login screen listeners
  5) Game screen listeners
  6) Game logic
  7) To do													*/

//=============== 1) MODULES ================================

var express = require("express");
var app = express();
var serv = require("http").Server(app);
var dbi = require("./dbi.js");
var files = require("./files.js");
var player = require('./player.js');
var io = require("socket.io")(serv, {});

//================= 2) SERVER INITIALIZATION =============================

// Track all current clients
var CLIENT_LIST = [];

// Server startup
app.get("/", function(req, res) {
    res.sendFile(__dirname + "/client/index.html");
});
app.use("/client", express.static(__dirname + "/client"));
serv.listen(2000);
console.log("Server started");

// Connect to database
dbi.connect.call(this);

//==================== 3) SOCKET LISTENERS =====================================

// When a client connects to the server
io.sockets.on("connection", function(socket) {

    // Create object for this client
    var client = {socket:socket, player:null};
    // Add it to client list
    CLIENT_LIST.push(client);
    
    // Client closed the window, network issue, etc.
    socket.on("disconnect", function() {
	// Set client's player (if any) to offline
	if(client.player !== null) {
	    dbi.setUserOnlineStatus(client.player.username, false);
	}
	socket.emit("collapseMenus");
	// Remove from client list
	var index = CLIENT_LIST.indexOf(client);
	if(index > -1) CLIENT_LIST.splice(index, 1);
    });
    
    //===================== 4) LOGIN SCREEN LISTENERS ==============================

    // Client clicked login button
    socket.on("login", function(data) {
	// Check info with the database
	dbi.login(data.username, data.password, 
		  function(resp) {
		      if(resp) {
			  // If login info is valid, give the client a player
			  client.player = player.Player(data.username);
			  // Make the player online
			  dbi.setUserOnlineStatus(client.player.username, true);
			  socket.emit("loginResponse", {success:true,
							username:data.username});
			  socket.emit("collapseMenus");
		      } else {
			  // If login info is denied
			  socket.emit("loginResponse", {success:false});
		      }
		  });
    });

    socket.on("signup", function(data) {
	// Create new record in database
	dbi.signup(data.username, data.password, function(resp) {
	    if(resp) {
		// If info is valid, give the client a player
		client.player = player.Player(data.username);
		dbi.setUserOnlineStatus(client.player.username, true);
		socket.emit("loginResponse", {success:true,
					      username:data.username});
		socket.emit("collapseMenus");
	    } else {
		// If duplicate username, etc.
		socket.emit("loginResponse", {success:false});
	    }
	});
    });
    
    // Client clicked list users
    socket.on("userListRequest", function() {
	// Send back the whole table from the database
	dbi.getAllUserInfo(function(data) {
	    socket.emit("userListResponse", data);
	});
    });

    //===================== 5) GAME SCREEN LISTENERS ===============================

    // Clicked logout
    socket.on("logout", function() {
	// Set player to offline
	dbi.setUserOnlineStatus(client.player.username, false);
	// Remove the client's player, but don't remove the client
	client.player = null;
	socket.emit("logoutResponse");
	socket.emit("collapseMenus");
    });

	// Clicked delete account
	socket.on("deleteAccount", function() {
		dbi.removeUser(client.player.username, function(resp) {
			if(!resp) console.log("Could not delete account.")
		});
		client.player = null;
		socket.emit("logoutResponse");
		socket.emit("collapseMenus");
	});
	
    // Recieved game input
    socket.on("keyPress", function(data) {
	// If the client is in control of a player
	if(client.player !== null) {
	    // Assign booleans for each direction
	    if(data.inputId === "left")
		client.player.pressingLeft = data.state;
	    else if(data.inputId === "right")
		client.player.pressingRight = data.state;
	    else if(data.inputId === "up")
		client.player.pressingUp = data.state;
	    else if(data.inputId === "down")
		client.player.pressingDown = data.state;
	}
    });

	//================ CHAT LISTENERS ==============================
	
	// Recieved a chat post
    socket.on("chatPost", function(data) {
	// Notify all clients to add post
	if(client.player !== null) {
		for(var i in CLIENT_LIST) {
			CLIENT_LIST[i].socket.emit("addToChat",
						   client.player.username + ": " + data);
		}
	}
    });

    // Debug command sent through chat
    socket.on("evalExpression", function(data) {
	var res = eval(data);
	socket.emit("evalAnswer", res);
    });

    //================== 7) TO DO =======================================

    socket.on("saveGameRequest", function(data,resp) {
	       dbi.saveGameFilename(data, function(resp) {
	       socket.emit("saveGameResponse", resp);
		  });
	});
    
    socket.on("savedGamesListRequest", function() {
		  dbi.getSavedGamesList(function(data) {
		      socket.emit("savedGamesListResponse", data);
		  });
    });

    socket.on("removeSavedGame", function(data) {
	dbi.removeSavedGame(data, function(resp) {
	    socket.emit("removeSavedGameResponse",resp);
	});
    });
	
    
});

//============== 6) GAME LOGIC ================================================

// Main game loop runs at 40 fps
setInterval(function() {
    var pack = [];
    // Generate object with all player positions
    for(var i in CLIENT_LIST) {
	var player = CLIENT_LIST[i].player;
	if(player !== null) {
	    player.updatePosition();
	    pack.push({
		x:player.x,
		y:player.y,
		number:player.number
	    });
	}
    }
    // Send the packet to each client
    for(var i in CLIENT_LIST) {
	var socket = CLIENT_LIST[i].socket;
	socket.emit("newPositions", pack);
    }
}, 1000/25);