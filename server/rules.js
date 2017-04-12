var debug = require("./debug.js").rules;
var log = require("./debug.js").log;

var dbi = require("./dbi.js");
var server = require("./server.js");

var Rules = function() {}
	
Rules.prototype.listen = function(router) {
	router.listen("saveRuleSet", this.saveRuleSet);
	router.listen("loadRuleSet", this.loadRuleSet);
	router.listen("deleteRuleSet", this.deleteRuleSet);
}
	
// Returns default ruleset object
Rules.prototype.getDefault = function() {
	var ruleset = {
		gameCapacity:8,  	// Number of players allowed in one game
		lobbyCapacity:8, 	// Number of clients allowed in this session
		
		shipHealth:100,  		// Health points for a new ship
		shipAmmo:20,			// Num cannonballs provided to a new ship
		shipCannons:20,  		// Default number of cannons on ship
		shipFirepower:1.5,		// Default ship firepower
		shipReloadRate:0.3,		// Default ship reload rate
		shipFiringRate:1,		// Default ship rate of fire
		
		projectileRange:20, 	// Distance a live projectile will travel
		
		resourceHealth:1,		// Health points for new resource barrel
		resourceAmount:10		// Amount of resource in each barrel
		
	};
	
	return ruleset;
};

Rules.prototype.saveRuleSet = function(param) {
	var author = param.client.username;
	var filename = param.data.filename;
	var data = param.data.ruleset;
	dbi.addRuleSet(filename, author, data, function(resp) {
		if(resp) {
			server.emit(param.client.socket, "alert", "Saved " + filename);
		} else {
			server.emit(param.client.socket, "alert", "Could not save " + filename);
		}
	});
}

Rules.prototype.loadRuleSet = function(param) {
	var filename = param.data;
	dbi.getRuleSet(filename, function(data) {
		if(data) {
			server.emit(param.client.socket, "ruleSetResponse", data);
			server.emit(param.client.socket, "alert", "Loaded " + filename);
		} else {
			server.emit(param.client.socket, "alert", "Could not load " + filename);
		}
	});
}

Rules.prototype.deleteRuleSet = function(param) {
	var filename = param.data;
	var author = param.client.username;
	dbi.removeRuleSet(filename, author, function(resp) {
		if(resp) {
			server.emit(param.client.socket, "alert", "Deleted " + filename);
		} else {
			server.emit(param.client.socket, "alert", "Could not delete " + filename);
		}
	});
}

module.exports = new Rules();