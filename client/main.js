
require(["client", "router", "chat", "stats", "login", "render", "saves", "view", "users", "mapeditor","mapeditorfiles"], 
	function(client, router, chat, stats, login, render, saves, view, users, mapeditor, mapeditorfiles) {

var socket = io();
client.socket = socket;

client.listen(router);
chat.listen(router);
stats.listen(router);
render.listen(router);
saves.listen(router);
view.listen(router);
mapeditor.listen(router);
mapeditorfiles.listen(router);
login.listen(router);
users.listen(router);
	    
socket.on("message", function(message) {
	router.route(message);
});

});
