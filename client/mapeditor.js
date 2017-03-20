
define(["debug", "dom", "client", "mapeditorfiles"], function(debug, dom, client, mapeditorfiles) {
       
    /**
     * Map editor class
     * 
     * Provides html event handling logic to edit/create maps.
     * 
     * @module client/MapEditor
     */
    var MapEditor = function () {};

	// Undo/redo stacks
    var mapUndoStack=[];
	var mapRedoStack=[];
	
    var paintMove = false;
    var paintingSand = false;
    var paintingWater = false;
    var paintingPort = false;
    var paintingGrass = false;

    var brushSize = 1;
	
    /**
     * 
     * @memberof client/MapEditor
     */
    MapEditor.prototype.listen = function(router) {

	router.listen("mapEditorPaintSandIconClick",this.lowerSandIcon);
	router.listen("mapEditorPaintSandIconClick",this.raiseWaterIcon);
	router.listen("mapEditorPaintSandIconClick",this.raisePortIcon);
	router.listen("mapEditorPaintSandIconClick",this.raiseGrassIcon);
	
	router.listen("mapEditorPaintWaterIconClick",this.raiseSandIcon);
	router.listen("mapEditorPaintWaterIconClick",this.lowerWaterIcon);
	router.listen("mapEditorPaintWaterIconClick",this.raisePortIcon);
	router.listen("mapEditorPaintWaterIconClick",this.raiseGrassIcon);

	router.listen("mapEditorPaintPortIconClick",this.raiseSandIcon);
	router.listen("mapEditorPaintPortIconClick",this.raiseWaterIcon);
	router.listen("mapEditorPaintPortIconClick",this.lowerPortIcon);
	router.listen("mapEditorPaintPortIconClick",this.raiseGrassIcon);

	router.listen("mapEditorPaintGrassIconClick",this.raiseSandIcon);
	router.listen("mapEditorPaintGrassIconClick",this.raiseWaterIcon);
	router.listen("mapEditorPaintGrassIconClick",this.raisePortIcon);
	router.listen("mapEditorPaintGrassIconClick",this.lowerGrassIcon);

	router.listen("mapEditorCanvasMouseDown",this.onCanvasMouseDown);
	router.listen("mapEditorCanvasMouseMove",this.onCanvasMouseMove);
	router.listen("mapEditorCanvasMouseUp",this.onCanvasMouseUp);
	router.listen("mapEditorCanvasMouseLeave",this.onCanvasMouseLeave);
	
	router.listen("keyPressed",this.onKeyPress);
	router.listen("refreshEditScreen",this.drawEditScreen);
	router.listen("getEditMapResponse",this.loadNewEditMap);
	router.listen("mapEditorLogoutButtonClick",this.mapEditorLogoutButtonClick);
	router.listen("mapEditorLoadMapButtonClick",this.mapEditorLoadMapButtonClick);
	router.listen("mapEditorSavedMapsListButtonClick",this.mapEditorSavedMapsListButtonClick);
	router.listen("mapEditorResizeButtonClick",this.mapEditorResizeButtonClick);
	router.listen("mapEditorResizeSubmitButtonClick",this.mapEditorResizeSubmitButtonClick);
	router.listen("mapEditorSaveMapButtonClick",this.mapEditorSaveMapButtonClick);
	router.listen("mapEditorZoomButtonClick",this.mapEditorZoomButtonClick);
	router.listen("mapEditorZoomSubmitButtonClick",this.mapEditorZoomSubmitButtonClick);
	router.listen("mapEditorClearMapButtonClick",this.clearMapButtonClick);

	router.listen("mapEditorUndoChangeButtonClick",this.backtrack);
	router.listen("mapEditorRedoChangeButtonClick",this.timewarp);
	
	
	router.listen("mapEditorBrush20Click", this.mapEditorSwitchBrush20Click);
	router.listen("mapEditorBrush18Click", this.mapEditorSwitchBrush18Click);
	router.listen("mapEditorBrush16Click", this.mapEditorSwitchBrush16Click);
	router.listen("mapEditorBrush14Click", this.mapEditorSwitchBrush14Click);
	router.listen("mapEditorBrush12Click", this.mapEditorSwitchBrush12Click);
	router.listen("mapEditorBrush10Click", this.mapEditorSwitchBrush10Click);
	router.listen("mapEditorBrush08Click", this.mapEditorSwitchBrush08Click);
	router.listen("mapEditorBrush06Click", this.mapEditorSwitchBrush06Click);
	router.listen("mapEditorBrush04Click", this.mapEditorSwitchBrush04Click);
	router.listen("mapEditorBrush02Click", this.mapEditorSwitchBrush02Click);
	router.listen("mapEditorBrush01Click", this.mapEditorSwitchBrush01Click);
	
    }

    /**
     * Prompts the user for a file name and requests to save                                      
     * the current game (currently just the map, not an entire       
     * game object) under this file name on the server, with                                      
     * the requesting user listed as its author.
     * @memberof client/MapEditor
     */
    MapEditor.prototype.mapEditorSaveMapButtonClick = function() {
		var filename = window.prompt("Save as: ","filename");
		if(filename) {
		    client.emit("saveMapRequest",
				{filename:filename, map:client.map});
		}
    }
	
    function copyOfMap(oldmap) {
		// deep copy
		return JSON.parse(JSON.stringify(oldmap));
    }
    
    /**
     * 
     * @memberof client/MapEditor
     */
    MapEditor.prototype.loadNewEditMap = function(event) {
		mapUndoStack=[];
		mapRedoStack=[];
		// Set to max zoom
		client.camera.zoom = 20 / client.map.width;
		if(client.camera.zoom > 20 / client.map.height) {
			client.camera.zoom = 20 / client.map.height;
		}
		mapUndoStack.push(copyOfMap(client.map));
    }

    /**
     * 
     * @memberof client/MapEditor
     */
    MapEditor.prototype.clearMapButtonClick = function(event) {
		if (debug.mapeditor) debug.log("client/mapeditor.js:ClearMapButtonClick");
		mapUndoStack.push(copyOfMap(client.map));
		// Zero out the data of the new map
		var line = "";
		while(line.length < client.map.width) {
			line += "0";	
		}
		client.map.data = [];
		while(client.map.data.length < client.map.height) {
			client.map.data.push(line);
		}
    }
    
    /**
     * 
     * @memberof client/MapEditor
     */
    MapEditor.prototype.drawEditScreen = function(event) {
		if(debug.mapeditor) debug.log("client/mapeditor.js: drawEditScreen");
		if(!client.map) return;
		
		var map = client.map.data;
	
		// camera position in cells
		var cam_x = client.camera.x;
		var cam_y = client.camera.y; 
	
		// camera dimensions in cells
		var cam_w = 20 / client.camera.zoom;
		var cam_h = 20 / client.camera.zoom;
	
		// camera dimensions in pixels
		var width = 500;
		var height = 500;
	
		// cell dimensions in pixels
		var cell_w = width / cam_w; 
		var cell_h = height / cam_h;
	
		// Draw camera
		for(var i = 0; i < cam_h; i++) {
			var line = map[i + cam_y];
			for(var j = 0; j < cam_w; j++) {
				var ch, color;
				if(line) ch = line.charAt(j + cam_x);
			    switch(ch) {
			    	case "0": 
						color = "#42C5F4";
						break;
			    	case "1": 
						color = "#C19E70";
						break;
			    	case "2":
						color = "#2A8C23";
						break;
			    	default: 
						color = "#000000";
			    }
			    dom.mapEditorCanvasContext.fillStyle = color;
			    dom.mapEditorCanvasContext.fillRect(j * cell_w, i * cell_h, cell_w, cell_h);
			}
		}
	
		// In the upper left corner, draw camera's position in world map
		dom.mapEditorCanvasContext.clearRect(500, 0, 100, 500);
		dom.mapEditorCanvasContext.strokeStyle = "#000000"; // Black
		dom.mapEditorCanvasContext.strokeRect(500, 0, 100, 100);
		var rel_x = Math.floor(100 * cam_x / client.map.width);
		var rel_y = Math.floor(100 * cam_y / client.map.height);
		var rel_w = Math.floor(100 * cam_w / client.map.width);
		var rel_h = Math.floor(100 * cam_h / client.map.height);
		dom.mapEditorCanvasContext.strokeStyle = "#ff0000"; // Red
		dom.mapEditorCanvasContext.strokeRect(500 + rel_x, 0 + rel_y, rel_w, rel_h);
		
    }
    
    ////////////////////
    // Sand icon functionality
    ////////////////////
    var sandicondownimg = "client/imgs/mapeditorsandicondown.png";
    var sandiconupimg = "client/imgs/mapeditorsandiconup.png";
    /**
     *
     * @memberof client/MapEditor
     * @memberof client/MapEditor
     */
    MapEditor.prototype.lowerSandIcon = function() {
	dom.mapEditorPaintSandIcon.src = sandicondownimg;
	paintingSand = true;
    }
    /**
     *
     * @memberof client/MapEditor
     */
    MapEditor.prototype.raiseSandIcon = function() {
	dom.mapEditorPaintSandIcon.src = sandiconupimg;
	paintingSand = false;
    }

    ////////////////////
    // Water icon functionality
    ////////////////////
    var watericondownimg = "client/imgs/mapeditorwatericondown.png";
    var watericonupimg = "client/imgs/mapeditorwatericonup.png";
    /**
     *
     * @memberof client/MapEditor
     */
    MapEditor.prototype.lowerWaterIcon = function() {
	dom.mapEditorPaintWaterIcon.src = watericondownimg;
	paintingWater = true;
    }
    /**
     *
     * @memberof client/MapEditor
     */
    MapEditor.prototype.raiseWaterIcon = function() {
	dom.mapEditorPaintWaterIcon.src = watericonupimg;
	paintingWater = false;
    }

    ////////////////////
    // Grass icon functionality
    ////////////////////
    var grassicondownimg = "client/imgs/mapeditorgrassicondown.png";
    var grassiconupimg = "client/imgs/mapeditorgrassiconup.png";
    /**
     *
     * @memberof client/MapEditor
     */
    MapEditor.prototype.lowerGrassIcon = function() {
	dom.mapEditorPaintGrassIcon.src = grassicondownimg;
	paintingGrass = true;
    }
    /**
     *
     * @memberof client/MapEditor
     */
    MapEditor.prototype.raiseGrassIcon = function() {
	dom.mapEditorPaintGrassIcon.src = grassiconupimg;
	paintingGrass = false;
    }

    
    ////////////////////
    // Port icon functionality
    ////////////////////
    var porticondownimg = "client/imgs/mapeditorporticondown.png";
    var porticonupimg = "client/imgs/mapeditorporticonup.png";
    /**
     *
     * @memberof client/MapEditor
     */
    MapEditor.prototype.lowerPortIcon = function() {
	dom.mapEditorPaintPortIcon.src = porticondownimg;
	paintingPort = true;
    }
    /**
     *
     * @memberof client/MapEditor
     */
    MapEditor.prototype.raisePortIcon = function() {
	dom.mapEditorPaintPortIcon.src = porticonupimg;
	paintingPort = false;
    }


    
    /**
     *
     * @memberof client/MapEditor
     */
    MapEditor.prototype.onKeyPress = function (event) {
		var keycode = event.which || event.keyCode;
		if (keycode === 90 && event.ctrlKey) {
		    // Ctrl-Z; backtrack
		    MapEditor.prototype.backtrack();
		}
    }
    
    /** 
     * Revert to previous map version in stack
     * @memberof client/MapEditor
     */
    MapEditor.prototype.backtrack = function () {
		if(debug.mapeditor) debug.log("client/mapeditor.js: backtrack()");
		if(mapUndoStack.length > 0) {
			mapRedoStack.push(copyOfMap(client.map));
			client.map = mapUndoStack.pop();
		} else {
			alert("Undo limit reached");
		}
    };


    /** 
     * 
     * @memberof client/MapEditor
     */
    MapEditor.prototype.timewarp = function () {
		if (debug.mapeditor) debug.log("client/mapeditor.js: timewarp()");
		if(mapRedoStack.length > 0) {
			mapUndoStack.push(copyOfMap(client.map));
		    client.map = mapRedoStack.pop();
		} else {
			alert("Redo limit reached");
		}
    };

    
    /**
     * 
     * @memberof client/MapEditor
     */
    MapEditor.prototype.zoom = function () {
		if (debug.mapeditor) debug.log("client/mapeditor.js: zoom()");
    };
    
    /**
     * Loads initial map editor view into index.html.
     *
     * Default map: All water.
     * @memberof client/MapEditor
     */
    MapEditor.prototype.load = function () {
		if (debug.mapeditor) debug.log("client/mapeditor.js: load()");
		this.clear();
    };
    

    /*
    function clearMapEditorMessageBox() {
	if (debug.mapeditor) debug.log("client/mapeditor.js: clearMapEditorMessageBox()");
	//dom.mapEditorTextboxMessage.innerHTML = "";
	dom.mapEditorTextboxResizeForm.style.display = "none";
    }
*/

    /**
     *
     * @param event
     * @memberof client/MapEditor
     */
    MapEditor.prototype.mapEditorZoomButtonClick = function(event) {
		dom.mapEditorTextboxMessage.innerHTML = "";
		dom.mapEditorTextboxResizeForm.style.display = "none";
		dom.mapEditorTextboxZoomForm.style.display="inline-block";
    };
    /**
     *
     * @param event
     * @memberof client/MapEditor
     */
    MapEditor.prototype.mapEditorZoomSubmitButtonClick = function(event) {
		if (debug.mapeditor) debug.log("client/mapeditor.js: mapEditorZoomSubmitButtonClick()");
		var val = dom.mapEditorNewZoom.value;
		if (val.length > 0 && val > 0.1 && val < 4.0) {
			client.camera.zoom = val;
		}
		dom.mapEditorNewZoom.value = "";
    };
    
    
    /**
     *
     * @param event
     * @memberof client/MapEditor
     */
    MapEditor.prototype.mapEditorResizeButtonClick = function (event) {
		if (debug.mapeditor) debug.log("client/mapeditor.js: mapEditorResizeButtonClick()");
		dom.mapEditorTextboxMessage.innerHTML = "";
		dom.mapEditorTextboxResizeForm.style.display="inline-block";
		dom.mapEditorTextboxZoomForm.style.display="none";
    }

    /**
     *
     * @param event
     * @memberof client/MapEditor
     */
    MapEditor.prototype.mapEditorResizeSubmitButtonClick = function(event) {
		if (debug.mapeditor) debug.log("client/mapeditor.js: mapEditorResizeSubmitButtonClick()");
		var lx = dom.mapEditorResizedLX.value;
		var ly = dom.mapEditorResizedLY.value;
	
		if (lx.length == 0 && ly.length == 0 && lx < 2 && ly < 2) {
		    dom.mapEditorTextboxResizeForm.style.display="none";
		    dom.mapEditorTextboxMessage.innerHTML = "<p style=\"font:12px Arial\">invalid map size</p>";	
			return;
		}
		
	    mapUndoStack.push(copyOfMap(client.map));
		mapRedoStack = [];
		var newMap = copyOfMap(client.map);
		
		var extra_x = lx - newMap.width;
		var extra_y = ly - newMap.height;
		
		// Pad any extra width with water
		if(extra_x > 0) {
		    var line = "";
		    while(line.length < extra_x) line += "0";
			for(var i in newMap.data) {
				newMap.data[i] += line;
			}
		}

		// Slice off width if lx is smaller
		newMap.width = lx;
		for(var i in newMap.data) {
			newMap.data[i] = newMap.data[i].substring(0, lx);
		}

		newMap.height = ly;
		// Pad any extra height with water
		if(extra_y > 0) {
			var line = "";
			while(line.length < newMap.width) line += "0";
			for(var i = 0; i < extra_y; i++) {
				newMap.data.push(line);
			}
		} else {
			// Slice off if ly is smaller
			for(var i = 0; i > extra_y; i--) {
				newMap.data.pop();
			}
		}
		
		client.map = newMap;
		
		// // reset zoom to max
		// client.camera.zoom = 20 / newMap.width;
		// if(client.camera.zoom > 20 / newMap.height) {
		// 	client.camera.zoom = 20 / newMap.height;
		// }
		
	    //post-processing
	    dom.mapEditorTextboxMessage.innerHTML = "<p style=\"font:12px Arial\">Map edit mode</p>";
	    dom.mapEditorTextboxResizeForm.style.display="none";
    }
    
    /*
      CANVAS EVENT HANDLERS
    */

    /**
     *
     * @param event
     * @memberof client/MapEditor
     */
    MapEditor.prototype.onCanvasMouseDown = function (event) {
		paintMove = true;
	    mapUndoStack.push(copyOfMap(client.map));
		mapRedoStack = [];
		MapEditor.prototype.onCanvasMouseMove(event);
    };

    /**
     *
     * @param event
     * @memberof client/MapEditor
     */
    MapEditor.prototype.onCanvasMouseUp = function (event) {
		if(paintMove) paintMove = false;
    }

    /**
     *
     * @memberof client/MapEditor
     */
    MapEditor.prototype.onCanvasMouseLeave = function (event) {
		if(paintMove) paintMove = false;
    }
    
    
    /**
     *
     * @memberof client/MapEditor
     */
    MapEditor.prototype.onCanvasMouseMove = function (event) {
		if(!client.map) return;
		if (paintMove) {
		    if (debug.mapeditor) debug.log("client/mapeditor.js: onCanvasMouseMove()");
		    var rect = event.target.getBoundingClientRect();
		    var a = Math.floor(client.map.height * (event.clientX - rect.left) / rect.height);
		    var b = Math.floor(client.map.width * (event.clientY - rect.top) / rect.width);
		    var change = false;
		    var ch;
		    if (paintingWater) { ch = "0"; change = true; }
		    if (paintingSand) { ch = "1"; change = true; }
		    if (paintingGrass) { ch = "2"; change = true; }
		    if (paintingPort) { ch = "3"; change = true; }

			 if (debug.mapeditor) debug.log("client/mapeditor.js: ch: " + ch);

		    var bsq = brushSize * brushSize / 4;
		    var lim = Math.floor(brushSize / 2) + 1;

		    var pmin = a - lim;
		    if (pmin < 0) pmin = 0;
		    var pmax = a + lim;
		    if (pmax >= client.map.width) 
				pmax = client.map.width;

		    var qmin = b - lim;
		    if (qmin < 0) qmin = 0;
		    var qmax = b + lim;
		    if (qmax >= client.map.height) 
				qmax = client.map.height;

		    if (change) {
				var p,q;
				for (p = pmin; p < pmax; p++) {
					for (q = qmin; q < qmax; q++) {
					    if ((p-a)*(p-a)+(q-b)*(q-b) < bsq) {
							var line = client.map.data[q];
							line = line.substring(0, p) + ch + 
									line.substring(p + 1);
							client.map.data[q] = line;
					    }
					}
				}
		    }
		}
    };          

    //////////////
    //  Map file menu event handlers
    //////////////
    /**
     * 
     * @memberof client/MapEditor
     */
    MapEditor.prototype.mapEditorSavedMapsListButtonClick = function () {
		if (debug.mapeditor) 
			debug.log("client/mapeditorfiles.js: " + 
			"mapEditorSavedMapsListButtonClick()");
		mapeditorfiles.toggleSavedMapsList();
    };

    /**
     * Logout
     * @memberof client/MapEditor
     */
    MapEditor.prototype.mapEditorLogoutButtonClick = function() {
		dom.mapEditorScreen.style.display="none";
		dom.mapEditorSavedMapsList.style.display="none";
		dom.mapEditorSavedMapsListHidden = true;
		client.emit("logout",null);
    };

    /**
     *
     * @memberof client/MapEditor
     */
    MapEditor.prototype.mapEditorLoadMapButtonClick = function() {
		var filename = window.prompt("Load file: ","filename");
		if (filename) {
		    client.emit("getEditMap",{username:client.username,
					      usertype:client.usertype,
					      filename:filename});
		}
    };


    function flipAllBrushButtonsUp() {
	dom.mapEditorBrush20.src="client/imgs/mapeditorbrush20up.png";
	dom.mapEditorBrush18.src="client/imgs/mapeditorbrush18up.png";
	dom.mapEditorBrush16.src="client/imgs/mapeditorbrush16up.png";
	dom.mapEditorBrush14.src="client/imgs/mapeditorbrush14up.png";
	dom.mapEditorBrush12.src="client/imgs/mapeditorbrush12up.png";
	dom.mapEditorBrush10.src="client/imgs/mapeditorbrush10up.png";
	dom.mapEditorBrush08.src="client/imgs/mapeditorbrush08up.png";
	dom.mapEditorBrush06.src="client/imgs/mapeditorbrush06up.png";
	dom.mapEditorBrush04.src="client/imgs/mapeditorbrush04up.png";
	dom.mapEditorBrush02.src="client/imgs/mapeditorbrush02up.png";
	dom.mapEditorBrush01.src="client/imgs/mapeditorbrush01up.png";	
    }

    
    MapEditor.prototype.mapEditorSwitchBrush20Click = function (event) {
	flipAllBrushButtonsUp();
	dom.mapEditorBrush20.src="client/imgs/mapeditorbrush20down.png";
	brushSize = 20;
    }

    MapEditor.prototype.mapEditorSwitchBrush18Click = function (event) {
	flipAllBrushButtonsUp();
	dom.mapEditorBrush18.src="client/imgs/mapeditorbrush18down.png";
	brushSize = 18;
    }
    
    MapEditor.prototype.mapEditorSwitchBrush16Click = function (event) {
	flipAllBrushButtonsUp();
	dom.mapEditorBrush16.src="client/imgs/mapeditorbrush16down.png";
	brushSize = 16;
    }
    
    MapEditor.prototype.mapEditorSwitchBrush14Click = function (event) {
	flipAllBrushButtonsUp();
	dom.mapEditorBrush14.src="client/imgs/mapeditorbrush14down.png";
	brushSize = 14;
    }
    MapEditor.prototype.mapEditorSwitchBrush12Click = function (event) {
	flipAllBrushButtonsUp();
	dom.mapEditorBrush12.src="client/imgs/mapeditorbrush12down.png";
	brushSize = 12;
    }
    MapEditor.prototype.mapEditorSwitchBrush10Click = function (event) {
	flipAllBrushButtonsUp();
	dom.mapEditorBrush10.src="client/imgs/mapeditorbrush10down.png";
	brushSize = 10;
    }
    MapEditor.prototype.mapEditorSwitchBrush08Click = function (event) {
	flipAllBrushButtonsUp();
	dom.mapEditorBrush08.src="client/imgs/mapeditorbrush08down.png";
	brushSize = 8;
    }
    MapEditor.prototype.mapEditorSwitchBrush06Click = function (event) {
	flipAllBrushButtonsUp();
	dom.mapEditorBrush06.src="client/imgs/mapeditorbrush06down.png";
	brushSize = 6;
    }
    MapEditor.prototype.mapEditorSwitchBrush04Click = function (event) {
	flipAllBrushButtonsUp();
	dom.mapEditorBrush04.src="client/imgs/mapeditorbrush04down.png";
	brushSize = 4;
    }
    MapEditor.prototype.mapEditorSwitchBrush02Click = function (event) {
	flipAllBrushButtonsUp();
	dom.mapEditorBrush02.src="client/imgs/mapeditorbrush02down.png";
	brushSize = 2;
    }
    MapEditor.prototype.mapEditorSwitchBrush01Click = function (event) {
	flipAllBrushButtonsUp();
	dom.mapEditorBrush01.src="client/imgs/mapeditorbrush01down.png";
	brushSize = 1;
    }
    
    return new MapEditor();

});
