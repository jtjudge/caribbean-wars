var socket = io();

/* User */
var loginScreen = document.getElementById("login-screen");
var loginUsername = document.getElementById("login-username");
var loginPassword = document.getElementById("login-password");
var loginButton = document.getElementById("login-btn");
var logoutButton = document.getElementById("logout-btn");
var signupButton = document.getElementById("signup-btn");
var userListButton = document.getElementById("user-list-btn");
var userList = document.getElementById("user-list");
var usernameLabel = document.getElementById("username-label");
var saveGameButton = document.getElementById("saveGame-btn");
var savedGamesListButton = document.getElementById("savedGamesList-btn");


var listHidden = true;
var savedGamesListHidden = true;

/* Chat */
var chatText = document.getElementById("chat-text");
var chatInput = document.getElementById("chat-input");
var chatForm = document.getElementById("chat-form");

/* Game */
var gameScreen = document.getElementById("game-screen");

loginButton.onclick = function() {
    socket.emit("login", {username:loginUsername.value,
			  password:loginPassword.value});
}

logoutButton.onclick = function() {
    socket.emit("logout");
}

signupButton.onclick = function() {
    socket.emit("signup", {username:loginUsername.value,
			   password:loginPassword.value});
}

saveGameButton.onclick = function() {
    socket.emit("saveGame",filename);
}
savedGamesListButton.onclick = function() {
    socket.emit("saveGameRequest",filename);
}

var toggleList = function() {
    if(listHidden) {
	socket.emit("userListRequest");
	userListButton.innerHTML = "Hide users";
	listHidden = false;
    } else {
	userList.style.display = "none"	
	userListButton.innerHTML = "List users";
	listHidden = true;
    }
}

var toggleSavedGamesList = function() {
    if(savedGamesListHidden) {
	socket.emit("savedGamesListRequest");
	savedGamesListButton.innerHTML = "Hide game list";
	savedGamesListHidden = false;
    } else {
	savedGamesList.style.display = "none";
	savedGamesListButton.innerHTML = "Saved games list";
	savedGamesListHidden = true;
    }
}

savedGamesListButton.onclick = function() {
    toggleSavedGamesList();
}

userListButton.onclick = function() {
    toggleList();
}

socket.on("saveGameResponse", function(data) {
/* To do */
}); 

socket.on("savedGamesListResponse", function(data) {
    var i;
    userList.style.display = "table";
    var html = "<table><tr>" +
	"<th>Saved game<th></tr>";
    for(i = 0; i < data.length; i++) {	
	html += "<tr>" +
	    "<td>"+ data[i].filename + "</td></tr>";
    }
    html += "</table>";
    savedGamesList.innerHTML = html;
}
	  

socket.on("loginResponse", function(data) {
    if(data.success === true) {
	loginScreen.style.display = "none";
	gameScreen.style.display = "inline-block";
	usernameLabel.innerHTML = data.username;
	if(!listHidden) toggleList();
    }
});

socket.on("logoutResponse", function() {
    loginScreen.style.display = "inline-block";
    gameScreen.style.display = "none";
    usernameLabel.innerHTML = "";
});

socket.on("userListResponse", function(data) {
    var i;
    userList.style.display = "table";
    var html = "<table><tr>" +
	"<th>Username</th>" +
	"<th>Password</th>" +
	"<th>Online</th></tr>";
    for(i = 0; i < data.length; i++) {	
	html += "<tr>" +
	    "<td>"+ data[i].username + "</td>" +
	    "<td>" + data[i].password + "</td>" +
	    "<td>" + data[i].online + "</td>" +
	    "</tr>";
    }
    html += "</table>";
    userList.innerHTML = html;
});

var canvas = document.getElementById("canvas").getContext("2d");
canvas.font = "30px Arial";

socket.on("newPositions", function(data) {
    canvas.clearRect(0, 0, 500, 500);
    for(var i = 0; i < data.length; i++) {
	canvas.fillText(data[i].number, data[i].x, data[i].y);
    }
});

socket.on("addToChat", function(data) {
    chatText.innerHTML += "<div>" + data + "<\div>";
});

socket.on("evalAnswer", function(data) {
    console.log(data);
});

chatForm.onsubmit = function(e) {
    e.preventDefault();
    if(chatInput.value[0] === "/")
	socket.emit("evalServer", chatInput.value.slice(1));
    else
	socket.emit("sendMsgToServer", chatInput.value);
    chatInput.value = "";
}

document.onkeydown = function(event) {
    if(event.keyCode === 68)
	socket.emit("keyPress", { inputId:"right", state:true});	
    else if(event.keyCode === 83)
	socket.emit("keyPress", { inputId:"down", state:true});
    else if(event.keyCode === 65)
	socket.emit("keyPress", { inputId:"left", state:true});
    else if(event.keyCode === 87)
	socket.emit("keyPress", { inputId:"up", state:true});
}

document.onkeyup = function(event) {
    if(event.keyCode === 68)
	socket.emit("keyPress", { inputId:"right", state:false});	
    else if(event.keyCode === 83)
	socket.emit("keyPress", { inputId:"down", state:false});
    else if(event.keyCode === 65)
	socket.emit("keyPress", { inputId:"left", state:false});
    else if(event.keyCode === 87)
	socket.emit("keyPress", { inputId:"up", state:false});
}
