/* 
# Copyright (C) 2010 by Kevin Saff

# This file is part of Agnostic.

# Agnostic is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Agnostic is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Agnostic.  If not, see <http://www.gnu.org/licenses/>.
*/

var objectsByOrder = new Array();
var objectsByName = new Object();

var safeAlertCount = 5;
function safeAlert(text) {
    if (safeAlertCount-- > 0) {
	alert(text);
    }
}

function debug(text, refresh) {
    if (document.getElementById("debug")) {
	if (refresh != undefined && refresh) {
	    document.getElementById("debug").innerHTML = text;
	} else {
	    document.getElementById("debug").innerHTML += '<br />' + text;
	}
    }
}

function Game() {
    this.objects = new Object();
    this.pending = new Object();
    this.transaction = 0;
}
Game.prototype = {
    incoming: function(key, data, maintain_pending) {
	if (!this.pending[key]) {
	    this.objects[key] = [this.transaction++, data];
	    if (this === Game.client) {
		handleIncoming(key, data);
	    }
	} else if (!maintain_pending && this.objects[key][1] == data) {
	    this.pending[key] = false;
	}
    },
    outgoing: function(key, data) {
	this.objects[key] = [this.transaction++, data];
	this.pending[key] = true;
    },
    join: function() {
	if (Game.client === Game.server) {return;}
	Game.changeClient(this, "you joined a game");
    },
    _join: function() {
	arr = new Array();
	for (var key in this.objects) {
	    arr.push([this.objects[key], key]);
	}
	arr.sort(function(a,b){return a[0][0]-b[0][0];});	
	for (var i in arr) {
	    this.incoming(arr[i][1], arr[i][0][1], true);
	}
    },
    generate: function(all) {
	var arr = new Array();
	for (var key in this.objects) {
	    //if (key == '') {safeAlert("" + this.pending[key] + " " + this.objects[key]);}
	    if (this.pending[key] || all) {
		arr.push([this.objects[key], key]);
	    }
	}
	arr.sort(function(a,b){return a[0][0]-b[0][0];});
	var result = new Array();
	if (all) {
	    result.push("..n");
	}
	for (var i in arr) {
	    result.push("..o" + arr[i][1] + "-" + arr[i][0][1]);
	}
	return result.join("");
    },
    upload: function() {
	changeServerGame(this, "you uploaded a different game");
	rsbp.raw_write(this.generate(true));
    },
    getId: function() {
	if (this.objects[''] && this.objects[''][1]) {
	    return this.objects[''][1].slice(4);
	} else {
	    return (new Date()).getTime() + "?";
	}
    },
    ensureSaved: function(reason) {
	if (!Game.backups[this.getId()]) {
	    Game.backups[this.getId()] = [reason, this.generate(true)];
	}
    }
}
Game.create = function() {
    var game = new Game();
    game.outgoing('', 'new ' + (new Date()).getTime() );
    return game;
}
Game.backups = new Object();
Game.server = null;
Game.client = null;
Game.ensureSaved = function(game, reason) {
    if (!game) {return;}
    game.ensureSaved(reason);
}
Game.changeServer = function(game, reason) {
    if (game === Game.server) {return;}
    Game.ensureSaved(Game.server, reason);
    if (Game.server === Game.client) {
	demandConnectionScreen();
    }
    Game.server = game;
}
Game.changeClient = function(game, reason) {
    if (game === Game.client) {return;}
    Game.ensureSaved(Game.client, reason);

    if (Game.client) {
	//alert("Clearing all client data!");
    }
    for (var i in objectsByName) {
	var obj = objectsByName[i];
	if (obj && obj.e && obj.e.parentNode) {
	    obj.e.parentNode.removeChild(obj.e);
	}
    }
    objectsByOrder = new Array();
    objectsByName = new Object();  

    Game.client = game;
    game._join();
}

function agnosticRSBP() {
    var rsbp = new Object();
    rsbp.last_transaction = undefined;
    rsbp.loop = false;
    rsbp.written = new Array();
    rsbp.minimum_wait = 100;
    rsbp.initial_timeout = 250; //ms
    rsbp.maximum_timeout = 10000;
    rsbp.server = null;
    rsbp.first_connection = null;
    rsbp.last_connection = null;
    rsbp.unsent_data = null;
    rsbp.isConnected = function() {
	return this.last_connection && (this.getDisconnectionTime() < 5.0);
    }
    rsbp.hasConnected = function() {
	return !!this.first_connection;
    }
    rsbp.getConnectionTime = function() {
	return ((new Date()).getTime() - this.first_connection) / 1e3;
    }
    rsbp.getDisconnectionTime = function() {
	return Math.round(((new Date()).getTime() - this.last_connection) / 1e3);
    }
    rsbp.apply = function(data) {
	if (data && data != '..t1o-') {
	    //debug('received: ' + data);
	    //safeAlert(data);
	}
	var parts = data.split("..");
	for (var i = 1;/*ignore before first separator*/ i < parts.length; ++i) {
	    var ds1 = parts[i].indexOf("-");
	    var meta = parts[i].slice(0, ds1);
	    var payload = parts[i].slice(ds1 + 1);
	    var ds2 = meta.indexOf("o");
	    var transaction = parseInt(meta.slice(1, ds2));
	    this.last_transaction = transaction;
	    var objectName = meta.slice(ds2 + 1);
	    if (Game.server && objectName) {
		if (!Game.client) {
		    Game.client = Game.server;
		}
		Game.server.incoming(objectName, payload);
	    } else if (payload.slice(0,3) == 'new') {
		if (!Game.server || Game.server.objects[''][1] != payload) {
		    Game.changeServer(new Game(), "someone else started a game");
		} 
		if (Game.server) {
		    Game.server.incoming(objectName, payload);
		}
	    } else if (!payload) {
		Game.changeServer(null, "the server rebooted");
	    }
	}
	if (this.after) {
	    this.after();
	}
	//alert(data);
    }
    rsbp.generate = function() {
	var result = this.written;
	this.written = new Array();
	if (Game.server) {
	    result.push(Game.server.generate(false));
	    if (this.last_transaction) {
		result.push("..t" + this.last_transaction);
	    } else {
		result.push("..r");
	    }
	} else {
	    result.push("..r");
	}
	result.push("\n");
	return result.join("");
    }
    rsbp.do_write = function(data) {
	var http = new XMLHttpRequest();
	var rsbp = this;
	//if (data && data != '..r') {debug('sent: ' + data);}
	data = data || this.unsent_data;
	this.unsent_data = data;
	http.open("POST", rsbp.server || "RSBP", true);
	http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	http.setRequestHeader("Content-length", data.length);
	http.setRequestHeader("Connection", "close");
	http.onreadystatechange = function() {
	    if (http.readyState == 4) {
		if (http.status == 200) {
		    rsbp.unsent_data = null;
		    rsbp.timeout = null;
		    rsbp.last_connection = (new Date()).getTime();
		    if (!rsbp.first_connection) {
			rsbp.first_connection = rsbp.last_connection;
		    }
		    //undemand("timeout");
		    rsbp.apply(http.responseText);
                    if (rsbp.loop) {
			rsbp.poll_forever();
		    }
		} else {
		    var self = rsbp;
		    if (!self.timeout) {
			self.timeout = self.initial_timeout;
		    }
		    else {
			self.timeout *= 2;
		    }
		    if (self.timeout > self.maximum_timeout) {
			self.timeout = self.maximum_timeout;
			//demand("timeout", 100, "Connection lost.");
		    }
		    if (false && self.loop) {
			setTimeout(function() {self.poll_forever();}, self.timeout);
		    }
		    else {
			setTimeout(function() {self.do_write();}, self.timeout);
		    }
		}
	    } 
	}
	http.send(data);
    }
    rsbp.poll = function() {
	this.do_write(this.generate(false));
    }
    rsbp.poll_forever = function() {
	this.loop = true;
	var self = this;
	setTimeout(function() {self.poll();}, this.minimum_wait);
    }
    return rsbp;
}

var rsbp = new agnosticRSBP();

function agImage(eltype) {
    this.e = document.createElement(eltype || "img");
    this.e.style.position = "absolute";
    this.e.style.zIndex = 1;
    this.baseZ = 0;
}
agImage.prototype = {
    finalize: function(id, desc) {
	agImage.registerObject(this, id);
	this.display();
	if (!id) {
	    Game.client.outgoing("c" + this.class + "." + this.name, desc);
	    this.serialize();
	}
    },
    getLeft: function() {
	return parseInt(this.e.style.left);
    },
    getRight: function() {
	return parseInt(this.e.style.left) + this.e.width;
    },
    getTop: function() {
        return parseInt(this.e.style.top);
    },
    getBottom: function() {
        return parseInt(this.e.style.top) + this.e.height;
    },
    getCenter: function() {
        return Vector.create([this.getLeft() + this.e.width / 2, 
                              this.getTop() + this.e.height / 2])
    },
    contains: function(vector) {
        vector = this.toLocalCoords(vector);
        return (Math.abs(vector.e(1)) <= this.e.width / 2)
	    && (Math.abs(vector.e(2)) <= this.e.height / 2);
    },
    recenter: function(center) {
        this.e.style.left = Math.round(center.e(1) - this.e.width / 2);
        this.e.style.top = Math.round(center.e(2) - this.e.height / 2); 
    },
    serialize:function() {
        var center = this.getCenter();
        Game.client.outgoing(this.name,
			    "" + Math.round(center.e(1)) + " " + Math.round(center.e(2)) + " " 
			    + Math.round(this.currentRotation || 0) + " "
			    + (this.image_index || 0));
    },
    throwRandomly: function() {
        this.recenter(randomLocation());
        this.setRotation(0, Math.random() * 360);
    },
    setRotation: function(radians, degrees) {
        this.currentRotation = cleanupDegrees((degrees || 0) 
				              + radiansToDegrees(radians));
        var transform = "rotate(" + this.currentRotation + "deg)";
        this.e.style.webkitTransform = transform;
        this.e.style.MozTransform = transform;
        this.currentTransformation = Matrix.Rotation(degreesToRadians(this.currentRotation));
    },
    getRotation: function() {
        return degreesToRadians(this.currentRotation || 0);
    },
    rotate: function(radians) {
        this.setRotation(radians, this.currentRotation || 0);
    },
    move: function(vector) {
        this.recenter(this.getCenter().add(vector));
    },
    moveToFront: function() {
        if (moveToEnd(objectsByOrder, this)) {
	    fixZOrder(objectsByOrder);
	} //else {safeAlert("huh?");}
    },
    incoming: function(data) {
        this.moveToFront();
	var nums = data.split(" ", 4);
	var center = Vector.create([parseFloat(nums[0]), parseFloat(nums[1])]);
	var degrees = parseFloat(nums[2]);
	this.image_index = parseInt(nums[3] || 0) % this.images.length;
	this.e.src = this.images[this.image_index];
	this.recenter(center);
	this.setRotation(0, degrees);
    },
    flip: function(amount) {
        this.image_index = (this.image_index || 0) + ((amount == undefined) ? 1 : amount);
        this.image_index %= this.images.length;
        if (this.image_index < 0) {
            this.image_index += this.images.length;
        }
	this.e.src = this.images[this.image_index];
    },
    setTransformation: function(m) {
    	var transform = "matrix(" + m.e(1,1) + ", " + m.e(2,1) + ", " 
                                  + m.e(1,2) + ", " + m.e(2,2) + ", 0, 0)";
        this.e.style.webkitTransform = transform;
        this.e.style.MozTransform = transform; 
        this.currentTransformation = m;
    },
    getTransformation: function() {
        return this.currentTransformation || Matrix.I(2);
    },
    toLocalCoords: function(globalCoords) {
        return this.getTransformation().inv().x(globalCoords.subtract(this.getCenter()));
    },
    toGlobalCoords: function(localCoords) {
        return this.getTransformation().x(localCoords).add(this.getCenter());
    },
    display: function() {
	document.body.appendChild(this.e);
    }
}
agImage._next_id = 1;
agImage.get_next_id = function() {
    return "i" + agImage._next_id++;
}
agImage.registerObject = function(obj, name) {
    obj.name = name || agImage.get_next_id();
    objectsByOrder.push(obj);
    objectsByName[obj.name] = obj;
}
var classRegistry = new Object();
function registerClass(class, name) {
    class.prototype.class = name;
    classRegistry[name] = class;
}


var betterAction = null;

function doNothing(ev) {
}

var Mouse = new Object();
Mouse.getCoords = function (ev) {
	if (ev.pageX || ev.pageY) {
		return Vector.create([ev.pageX, ev.pageY]);
	}
	return Vector.create([ev.clientX + document.body.scrollLeft - document.body.clientLeft,
	                      ev.clientY + document.body.scrollTop - document.body.clientTop]);
}
Mouse._bwhich = [0, 'left', 'middle', 'right']; //most
Mouse._bbutton = ['left', 'left', 'right', 0, 'middle']; //IE
Mouse.getButton = function(event) {
    if (event.which) {
        return Mouse._bwhich[event.which];
    } else {
        return Mouse._bbutton[event.button];
    }
}
Mouse.move = function(ev) {
	ev = ev || window.event;
	var mousePos = Mouse.getCoords(ev);
	if (betterAction && Mouse.getButton(ev)) {
	    var result = betterAction.move(mousePos);
	    if (betterAction.object) {
		betterAction.object.serialize();
	    }
	}
}
Mouse.down = function(ev) {
}
Mouse.up = function() {
    if (betterAction && betterAction.drop) {
	betterAction.drop();
    }
    if (betterAction && betterAction.object) {
	betterAction.object.serialize();  
    }
    betterAction = null;
    return false;
}
document.onmousemove = Mouse.move;
document.onmouseup = Mouse.up;

function moveToEnd(array, item) {
	if (array.length < 1) return false;
	if (array[array.length - 1] === item) return false;
	var found = -1;
	for (var i = 0; i < array.length; ++i) {
		if (array[i] === item) {
			found = i;
			break;
		}
	}
	if (found == -1) return false;
	for (var i = found; i < array.length - 1; ++i) {
		array[i] = array[i + 1];
	}
	array[array.length - 1] = item;
	return true;
}

function fixZOrder(array) {
    for (var i = 0; i < array.length; ++i) {
	array[i].e.style.zIndex = (array[i].baseZ || 0) + i;
    }
}

function getRotation(vector) {//in radians
	return Math.atan2(vector.e(2), vector.e(1));
}
function getAbsoluteRotation(center, point) { //in radians
    return getRotation(point.subtract(center));
}
function getRelativeRotation(center, first, last) { //in radians
    return getAbsoluteRotation(center, last) - getAbsoluteRotation(center, first);
}
function degreesToRadians(deg) {
	return Math.PI * 2 * deg / 360;
}
function radiansToDegrees(rad) {
	return rad * 360 / (Math.PI * 2);
}
function cleanupDegrees(deg) {
	deg = deg % 360;
	while (deg < 0) deg += 360;
        return deg;
}
function snapDegrees(deg, increment, closeness) {
    for (var snap=0; snap < 360 + increment; snap += increment) {
	if (Math.abs(deg - snap) < closeness) deg = snap;
    }
    return deg % 360;
}
function snapRotation(object, increment, closeness) {
    object.setRotation(0, snapDegrees(object.currentRotation || 0, 
						 increment, closeness));
}

function randomLocation() {
    return Vector.create([parseInt(Math.random() * (window.innerWidth - 200) + 100),
                          parseInt(Math.random() * (window.innerHeight - 200) + 100)]);
}

function handleIncoming(name, data) {
    if (name[0] == "i") {
	if (objectsByName[name]) {
	    objectsByName[name].incoming(data);
	} else {
	    alert(name + " not found!");
	}
    } else if (name[0] == "c") {
	var items = name.slice(1).split(".");
	var class = items[0]
	var id = items[1];
	if (classRegistry[class]) {
	    classRegistry[class].recreate(id, data);
	} else {
	    alert("Can't create: " + name + ", " + data);
	}
    }
    else {
	alert("Unhandled object: " + name + ", " + data);
    }
}

var _demands = new Object();
var _demandps = new Object();

function undemand(ref) {
    _demands[ref] = undefined;
    _demandps[ref] = undefined;
    _show_demands();
}

function demand(ref, priority, text) {
    _demands[ref] = text;
    _demandps[ref] = priority;
    _show_demands();
}

function _fade_demand() {
    if (document.getElementById("demand")) {
	var demand = document.getElementById("demand");
	var opacity = parseFloat(demand.style.opacity);
	opacity -= 0.03;
	if (opacity <= 0) {
	    document.body.removeChild(document.getElementById("demand"));
            if (document.getElementById("demandinner")) {
	        document.body.removeChild(document.getElementById("demandinner"));
            }
	} else {
	    demand.style.opacity = opacity;
	    setTimeout(_fade_demand, 40);
	}
    }
}

function _show_demands() {
    var text = null;
    var priority = -1;
    for (var i in _demands) {
	if ((_demandps[i] >= priority) && _demands[i]) {
	    text = _demands[i];
	    priority = _demandps[i];
	}
    }
    if (text && (text == _demands[""])) {
	return;
    }
    _demands[""] = text;
    if (document.getElementById("demandinner")) {
	document.body.removeChild(document.getElementById("demandinner"));
    }
    if (!text) {
	_fade_demand();
	return;
    }
    if (document.getElementById("demand")) {
	document.body.removeChild(document.getElementById("demand"));
    }
    var thing = document.createElement("div");
    thing.id = "demand";
    thing.style.position = "absolute";
    thing.style.background = "white";
    thing.style.opacity = 0.85;
    thing.style.zIndex = 10000;
    thing.style.left = 0;
    thing.style.top = 0;
    thing.width = window.innerWidth;
    thing.height = window.innerHeight;
    thing.style.minWidth = window.innerWidth;
    thing.style.minHeight = window.innerHeight;
    document.body.appendChild(thing);
    var inner = document.createElement("center");
    inner.id = "demandinner";
    inner.innerHTML = text;
    inner.style.position = "absolute";
    inner.style.zIndex = 10001;
    inner.width = window.innerWidth;
    inner.style.minWidth = window.innerWidth;
    inner.style.left = 0;
    document.body.appendChild(inner);
    inner.style.top = (window.innerHeight / 2 - inner.height / 2) + 'px';
    //document.body.appendChild(inner);
}

function startNewServerGame() {
    var wants = '\
Add some game elements to begin.\
<form id="questions" action="" method="GET" \
onSubmit="return createNewServerGame(this)">';
    for (var c in classRegistry) {
	wants += '<br />' + classRegistry[c].createForm() + '<br />';
    }
    wants += '<br /><input type="submit" value="Done." />';
    demand("create", 6, wants);
    undemand("connection");
}

function createNewServerGame(form) {
    Game.changeClient(Game.create(), "you started a new game");
    Game.changeServer(Game.client, "you started a new game");
    demand("creating", 7, "Please wait, building game...");
    undemand("create");
    for (var i in form.item) {
	if (form.item[i].checked) {
	    eval(form.item[i].value); //yikes!
	}
    }
    undemand("creating");
    return false;
}

function startNewSolitaireGame() {
    var wants = '\
Add some game elements to begin.\
<form id="questions" action="" method="GET" \
onSubmit="return createNewSolitaireGame(this)">';
    for (var c in classRegistry) {
	wants += '<br />' + classRegistry[c].createForm() + '<br />';
    }
    wants += '<br /><input type="submit" value="Done." />';
    demand("create", 6, wants);
    undemand("connection");
}

function createNewSolitaireGame(form) {
    Game.changeClient(Game.create(), "you started a new game");
    //Game.changeServer(Game.client);
    demand("creating", 7, "Please wait, building game...");
    undemand("create");
    for (var i in form.item) {
	if (form.item[i].checked) {
	    eval(form.item[i].value); //yikes!
	}
    }
    undemand("creating");
    return false;
}

function joinGameInProgress() {
    Game.server.join();
    undemand("connection"); //drop out of connection screen.
}

function continueGame() {
    undemand("connection"); //drop out of connection screen.
}

var count = 0;

function mainTimer() {
    debug(count++, true);
    debug(Game.server);
    debug(Game.client === Game.server);
    if (!rsbp.isConnected()) {
	demandConnectionScreen();
	//safeAlert("disconnected");
    }
    if (document.getElementById("connectionStatus")) {
	var connectionString = "";
	if (rsbp.isConnected()) {
	    connectionString += "Connected to " + (rsbp.server || "default server") + ".";
	    joinGameOption = true;
	} else if (rsbp.hasConnected()) {
	    connectionString += "Disconnected from " + (rsbp.server || "default server") 
		+ " for " + rsbp.getDisconnectionTime() + " seconds.";
	    connectionString += "(Timeout: " + rsbp.timeout + " mseconds)";
	} else {
	    connectionString += "Connecting to " + (rsbp.server || "default server") + "...";
	}
	document.getElementById("connectionStatus").innerHTML = connectionString;
    }
    if (document.getElementById("gameOptions")) {
	var optionString = "";
	if (rsbp.isConnected()) {
	    if (Game.server) {
		optionString += '\
<form>\
<input type="button" value="Join game in progress" onClick="joinGameInProgress()" />\
</form>\
';
	    } else {
		optionString += '<br />\
<form>\
<label for="startNew">No game in progress:</label>&nbsp;&nbsp;\
<input type="button" value="Start new game" id="startNew" onClick="startNewServerGame()" />\
</form>\
';
	    }
	}
	if (Game.client && Game.client !== Game.server) {
		optionString += '<br />\
<form>\
<input type="button" value="Continue solitaire" onClick="continueGame()" />\
</form>\
';
	} else {
		optionString += '<br />\
<form>\
<input type="button" value="Start new solitaire game" onClick="startNewSolitaireGame()" />\
</form>\
';
	}
	//optionString += 'Detailed game info:<br /><table>';
	if (Game.client) {
	    var id = Game.client.getId();
	    optionString += '<tr><td><a href="javascript:demandGameInfo(\'' + id + '\')">' 
		+ id + '</a></td><td>current game</td></tr>';
	}
	if (Game.server && Game.server !== Game.client) {
	    var id = Game.server.getId();
	    optionString += '<tr><td><a href="javascript:demandGameInfo(\'' + id + '\')">' 
		+ id + '</a></td><td>remote game</td></tr>';
	}
	for (var id in Game.backups) {
	    var reason = Game.backups[id][0];
	    var text = Game.backups[id][1];
	    optionString += '<tr><td><a href="javascript:demandGameInfo(\'' + id + '\')">' 
		+ id + '</a></td><td>lost when ' + reason + '</td></tr>';
	}
	optionString += '</table>';
	document.getElementById("gameOptions").innerHTML = optionString;
    }
}

setInterval(mainTimer, 1e3);

demandConnectionScreen = function() {
    demand("connection", 2, '\
<div id="connectionStatus">\
Please wait: determining connection status.\
</div>\
<div id="gameOptions"></div>\
');
}

demandGameInfo = function(id) {
    var reason = null;
    var text = null;
    if (Game.backups[id]) {
	reason = "lost when " + Game.backups[id][0];
	text = Game.backups[id][1];
    } else if (Game.client && Game.client.getId() == id) {
	reason = "current game";
	text = Game.client.generate(true);
    } else if (Game.server && Game.client.getId() == id) {
	reason = "remote game";
	text = Game.server.generate(true);
    } else {
	demand("gameinfo", 5, 'Game ' + id + ' not found in system.'
	       + 
'<form>\
<input type="button" value="OK :(" onClick="undemand(\'gameinfo\')" />\
</form>');
	return;
    }
    var response = new Array();
    response.push(id + '<br />');
    response.push(reason + '<br />');
    response.push('\
<form id="stateform" action="" method="GET" onSubmit="undemand(\'gameinfo\'); return false">\
<textarea name="gameinput" id="gameinput" rows="10" cols="80">'
+ text + '</textarea><br />\
<input type="submit" value="Restore" />\
</form>');
    demand("gameinfo", 5, response.join(""));
}