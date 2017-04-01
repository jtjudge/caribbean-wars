
//========= SHIP OBJECT ==================

/**
* Object containing all information about a
* single ship's state
* @module server/Ship
*/
var Ship = function(player, name, x, y) {
    /**
     * Ship object
     * @memberof module:server/Ship
     */
    var ship = {
		name:name,
		box:{
			x:x, 
			y:y, 
			w:6, 
			h:3,
			dir:0,
			ddir:0,
			
			dx:0,
			dy:0,

			dx_max:1,
			dy_max:1,
			mass:20,
			
			hit:false,
			stuck:false,
			verts:[],
			collisions:[],
			name:name
		},
		diff:{
			distanceSailed:0,
			shotsFired:0,
			shipsSunk:0
		},
		prevX:x,
		prevY:y,
		
		numCannons:20,
		currentAmmo:20,
		reloadCount:0,
		firingCount:0,
		reloadRate:0.3,
		firingRate:1,
		firepower:1.5,
		projectiles:[],
		
		docked:false,
		active:true,
		health:100,
		alive:true,
		
		player:player
    }
	
	var x1 = ship.box.x - ship.box.w / 2,
	x2 = ship.box.x + ship.box.w / 2,
	y1 = ship.box.y - ship.box.h / 2,
	y2 = ship.box.y + ship.box.h / 2;
	
	ship.box.verts.push({ x:x1, y:y2 }); // bottom left
	ship.box.verts.push({ x:x2, y:y2 }); // bottom right
	ship.box.verts.push({ 
		x:ship.box.x + ship.box.w,		// point
		y:ship.box.y});
	ship.box.verts.push({ x:x2, y:y1 }); // top right
	ship.box.verts.push({ x:x1, y:y1 }); // top left
	
    return ship;
}

module.exports = Ship;