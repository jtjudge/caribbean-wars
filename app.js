
var express = require("express");
var app = express();
var serv = require("http").Server(app);
var io = require("socket.io")(serv, {});

var router = require("./server/router.js");
var server = require("./server/server.js");

var session = require("./server/session.js");
var maps = require("./server/maps.js");
var stats = require("./server/stats.js");
var accounts = require("./server/accounts.js");
var game = require("./server/game.js");
var chat = require("./server/chat.js");
var saves = require("./server/saves.js");

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/client/index.html");
});
app.use("/client", express.static(__dirname + "/client"));

serv.listen(2000);

server.init();

// Set up listeners
session.listen(router);
maps.listen(router);
stats.listen(router);
accounts.listen(router);
game.listen(router);
chat.listen(router);
saves.listen(router);

server.run(io);

// Update the game at 30 fps, update stats once per second
setInterval(game.update, 1000/30);
setInterval(game.updateStats, 1000);