define(["debug", "dom", "client", "alerts"], function(debug, dom, client, alerts) {

	var Lobby = function() {}
	
	Lobby.prototype.listen = function(router) {
		router.listen("joinSessionClick", this.joinSessionClick);
		router.listen("newSessionClick", this.newSessionClick);
		router.listen("sessionListResponse", this.displaySessionList);
		
		router.listen("invitation", this.inviteResponse);
		router.listen("inviteClick", this.inviteClick);
		router.listen("kickClick", this.kickClick);
		router.listen("promoteClick", this.promoteClick);
		
		router.listen("newGameClick", this.newGameClick);
		router.listen("resumeGameClick", this.resumeGameClick);
		router.listen("endSessionClick", this.endSessionClick);
		router.listen("leaveSessionClick", this.leaveSessionClick);
		router.listen("joinInProgressClick", this.joinInProgressClick);
		
		router.listen("mapSelectClick", this.selectMapClick);
		
		router.listen("updateLobby", this.updateLobby);
	}

	Lobby.prototype.joinSessionClick = function(data) {
		debug.log("[Lobby] joinGameClick");
		alerts.showPrompt("Which game session?", function(resp) {
			if(resp) client.emit("enterGameSession", resp);
		});
	}

	Lobby.prototype.newSessionClick = function(data) {
		debug.log("[Lobby] newSessionClick");
		client.emit("newGameSession", null);
	}

	Lobby.prototype.displaySessionList = function(data) {
		debug.log("[Lobby] displaySessionList");
		if(data.length === 0) {
			dom.sessionList.innerHTML = "No sessions";
			return;
		}
		var html = "<table>" +
		"<tr>" +
		"<th>ID</th>" +
		"<th>Host</th>" +
		"<th>In Game</th>" +
		"<th>Invite Only</th>" +
		"<th>Players</th>" +
		"</tr>";
		for(var i in data) {
			html += "<tr>" + 
			"<td>" + i + "</td>" +
			"<td>" + data[i].host + "</td>" +
			"<td>" + data[i].running + "</td>" + 
			"<td>" + data[i].inviteOnly + "</td>" +
			"<td>";
			for(var j in data[i].users) {
				html += data[i].users[j];
				if(j < data[i].users.length - 1) {
					html += ", ";
				}
			}
			html += "</td>" +
			"</tr>";
		}
		html += "</table>"
		dom.sessionList.innerHTML = html;
	}
	
	Lobby.prototype.inviteResponse = function(data) {
		var text = data.username + 
		" has invited you to lobby " + 
		data.id + ". Accept?";
		alerts.confirm(text, function(resp) {
			if(resp) {
				client.emit("exitGameSession", null);
				client.emit("enterGameSession", data.id);
			}
		});
	}
	
	Lobby.prototype.newGameClick = function(data) {
		debug.log("[Lobby] newGameClick");
		client.emit("startGame", null);
	}
	
	Lobby.prototype.selectMapClick = function(data) {
		alerts.showPrompt("Which map?", function(resp) {
			client.emit("loadGameMap", resp);
		});
	}
	
	Lobby.prototype.resumeGameClick = function(data) {
		debug.log("[Lobby] resumeGameClick");
		alerts.showPrompt("Use which save?", function(resp) {
			if(resp) client.emit("resumeGame", resp);
		});
	}

	Lobby.prototype.endSessionClick = function(data) {
		debug.log("[Lobby] endSessionClick");
		client.emit("deleteGameSession", null);
	}

	Lobby.prototype.leaveSessionClick = function(data) {
		debug.log("[Lobby] leaveSessionClick");
		client.emit("exitGameSession", null);
	}
	
	Lobby.prototype.joinInProgressClick = function(data) {
		debug.log("[Lobby] joinInProgressClick");
		client.emit("enterGame", null);
	}
	
	
	Lobby.prototype.updateLobby = function(data) {
		debug.log("[Lobby] updateLobby");
		var html = "<ul>";
		for(var i in data) {
			html += "<li data-name=\"" + data[i] + "\" class=\"user\">" + data[i] + "</li>";
		}
		html += "<li data-name=\"+\" class=\"add-user\"> + </li>";
		html += "</ul>";
		dom.lobbyPlayerList.innerHTML = html;
	}
	
	return new Lobby();
	
});