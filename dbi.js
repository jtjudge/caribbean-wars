
var dbi = function () {};

var mysql = require("mysql");

var db = {};

dbi.prototype.connect = function() {
    db = mysql.createConnection({
	host:"mysql.cs.iastate.edu",
	user:"dbu309sr5",
	password:"NWI5ZTY0MzQw",
	database:"db309sr5"
    });
    db.connect(function(err) {
        if(err) {
	    console.log(err.stack);
	} else {
	    console.log("Connected to database.");
	}
    });
}

dbi.prototype.login = function(username, password, cb) {
    db.query("SELECT * FROM user_info", function(err, rows) {
	if(err) {
	    console.log(err.stack);
	    cb(false);
	}
	var i;
	for(i = 0; i < rows.length; i++) {
	    console.log(rows[i].username + " : " +
			rows[i].password);
	    if(rows[i].username == username &&
	       rows[i].password == password) {
		cb(true);
	    }
	}
	cb(false);
    });
}

dbi.prototype.signup = function(username, password, cb) {
    db.query("INSERT INTO user_info SET ?;",
        {username:username, password:password},
	function(err) {
	    if(err) {
		console.log(err.message);
		cb(false);
	    } else {
		cb(true);
	    }
	});
}

module.exports = new dbi();