// Namespace creation
var dbi = function () {};

//============== MODULES ==============================
var mysql = require("mysql");

//============== DATABASE INTERFACE ======================

// MySQL database object
var db = {};

// Creates initial connection to db
dbi.prototype.connect = function() {
    db = mysql.createConnection({
	host:"mysql.cs.iastate.edu",	
	user:"dbu309sr5",
	password:"NWI5ZTY0MzQw",
	database:"db309sr5"
    });
    db.connect(function(err) {
        if(err) {
	    console.log(err.message);
	} else {
	    console.log("Connected to database.");
	}
    });
}

// Compares given username and password string to the user_info table
// Callback true if the info is valid, false if not or if errors occur
dbi.prototype.login = function(username, password, cb) {
    var sql = "SELECT * FROM ?? WHERE ??=? AND ??=?;";
    var inserts = ["user_info", "username", username, "password", password];
    db.query(mysql.format(sql, inserts), function(err, rows) {
	if(err) {
	    console.log(err.message);
	    cb(false);
	}
	if(rows.length > 0) cb(true);
	cb(false);
    });
}

// Inserts given username and password set into user_info
// Callback true if username is not taken, false if it is or if errors occur
dbi.prototype.signup = function(username, password, cb) {
    db.query("INSERT INTO user_info SET ?;",
             {username:username, password:password, online:false},
	function(err) {
	    if(err) {
		console.log(err.message);
		cb(false);
	    } else {
		cb(true);
	    }
	});
}

// Sets the online status of the given username to the given boolean value
dbi.prototype.setUserOnlineStatus = function(username, val) {
    var boolStr = "" + (val ? 1 : 0);
    var sql = "UPDATE user_info SET online=? WHERE username=?";
    var inserts = [boolStr, username];
    db.query(mysql.format(sql, inserts), function(err) {
	if(err) console.log(err.message);
    });
}

// Retrieves all the table data, and passes it to the callback as an array of rows
dbi.prototype.getAllUserInfo = function(cb) {
    db.query("SELECT * FROM user_info;", function(err, rows) {
	if(err) {
	    console.log(err.message);
	    cb({});
	} else {
	    cb(rows);
	}
    });
}

//============================= TO DO ===================================
/**/
dbi.prototype.saveGameFilename = function(filename, cb) {
    var ngames = 0;
    db.query("SELECT COUNT(*) AS numstoredgames FROM storedgames_info",
	     function(err,numstoredgames) {
		 if (err) {
		     console.log(err.message);
		     cb(null);
		 } else {
		     ngames = numstoredgames;
		 }
	     });
    
    var id = ngames + 1;	     
    db.query("INSERT INTO storedgames_info SET ?;",
	     {id:id, filename:filename},
	     function(err) {
		 if(err) {
		     console.log(err.message);
		     cb(false);
		 } else {
		     cb(true);
		 }
		});
}

dbi.prototype.getSavedGamesList = function(cb) {
    db.query("SELECT * FROM storedgames_info;", function(err, rows) {
	if(err) {
	    console.log(err.message);
	    cb(null);
	} else {
	    cb(rows);
	}
    });
}

module.exports = new dbi();
