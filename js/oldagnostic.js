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

function agImage(eltype) {
    this.e = document.createElement(eltype || "img");
    this.e.style.position = "absolute";
    this.e.style.zIndex = 1;
    this.baseZ = 0;
}
agImage.byName = new Object();
agImage.byOrder = new Array();
agImage.prototype = {
    finalize: function(id, desc) {
        agImage.registerObject(this, id);
        this.display();
        if (!id) {
            Game.client.outgoing("c" + this.class + "." + this.id, desc);
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
        Game.client.outgoing(this.id,
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
        if (moveToEnd(agImage.byOrder, this)) {
            fixZOrder(agImage.byOrder);
        } 
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
    flip: function(/*optional*/ amount) {
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
    },
    generateId: function() {
	return "i" + agImage._next_id++;
    }
}
agImage._next_id = 1;
agImage.registerObject = function(obj, id) {
    obj.id = id || obj.generateId();
    if (obj.e) {
    	agImage.byOrder.push(obj);
    }
    agImage.byName[obj.id] = obj;
}
var classRegistry = new Object();
function registerClass(class, name) {
    class.prototype.class = name;
    classRegistry[name] = class;
}
function handleIncoming(name, data) {
    if (name[0] == "i" || name[0] == "u") {
        if (agImage.byName[name]) {
            agImage.byName[name].incoming(data);
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


var User = extend
(agImage, 
 function(name, /*optional*/id) {
    agImage.apply(this);
    this.name = name;
    delete this.e;
    this.isPlayer = !id; //is current player if no ID was predefined.
    this.options = new Object();
    this.finalize(id, name);
    this.active = true;
},
 {
    display: function() {},
    serialize: function() {
	this.active = this.isPlayer; safeAlert("Set " + this.name + " " + this.active + this.isPlayer);
	Game.client.outgoing(this.id, this.isPlayer ? this.name : '');
    },
    incoming: function(data) {
	if (this.isPlayer && data == '') {
	    safeAlert(this.name + " still alive");
	    this.serialize(); //yes, I'm still alive.
	} else if (this.isPlayer && data != this.name) {
	    alert("Someone stole your position!"); //shouldn't happen... right?
	} else if (data != '') {
	    //safeAlert(data);
	    this.active = true;
	}
    },
    generateId: function() {
        return User.generateId(this.name);
    },
    setOption: function(opt, value) {
	if (!this.options[opt] || this.options[opt] != value) {
	    this.options[opt] = value;
	    Game.client.outgoing("cUser." + this.id + "." + opt, value);
	} 
    }
 }
 );
User.generateId = function(name) {
    return "u" + encodeURIComponent(name);
}
User.recreate = function(id, data) {
    if (!id) {//Request to everyone to create user objects.
	if (!Game.client.player || Game.client.player.creator != data) {
	    demandPlayer(data.split(" "));
	} 
    } else if (id.indexOf(".") == -1) {//Foreign user object. Data == name
	return new User(data, id);
    } else {//Data about user
	var uid = id.split(".", 1)[0];
	var opt = id.split(".", 2)[1];
	agImage.byName[uid].options[opt] = data;
    }
}
User.startUp = function() {
    if (User.required.length) {
	Game.client.outgoing("cUser.", User.required.join(" "));
	demandPlayer(User.required);
	User.required = new Array();
    }
}
User.required = new Array();
User.require = function(what) {
    User.required.push(what);
}
User.checkNames = function() {
    for (var id in agImage.byName) {
	if (id[0] == "u") {//is a user ID.
	    agImage.byName[id].serialize(); //advertise whether exists or no.
	}
    }
}
User.isNameInUse = function(name) {//should have called checkNames sometime previous.
    var id = User.generateId(name);
    return agImage.byName[id] && agImage.byName[id].active;
}
registerClass(User, "User");


//////////// MOUSE

var Mouse = new Object();
Mouse.action = null;
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
        if (Mouse.action && Mouse.getButton(ev)) {
            var result = Mouse.action.move(mousePos);
            if (Mouse.action.object) {
                Mouse.action.object.serialize();
            }
        }
}
Mouse.down = function(ev) {
}
Mouse.up = function() {
    if (Mouse.action && Mouse.action.drop) {
        Mouse.action.drop();
    }
    if (Mouse.action && Mouse.action.object) {
        Mouse.action.object.serialize();  
    }
    Mouse.action = null;
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
    for (var i in array) {
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

var _demands = new Object();
var _demandps = new Object();

function undemand(ref) {
    delete _demands[ref];
    delete _demandps[ref];
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
}

function satisfyPlayer(form, data) {
    var data = data.split(" ");
    var errors = new Array();
    var name = form.username.value;
    if (!name || name == "") {
	errors.push("(Please enter a user name.)");
    } else if (User.isNameInUse(name)) {
	errors.push('(Somebody is already using the name "' + name + '".)');
    }
    for (var c in data) {
    	if (classRegistry[data[c]].verifyPlayerForm) {
    	    var error = classRegistry[data[c]].verifyPlayerForm(form);
	    if (error != "") {
		errors.push(error);
	    }
    	}	
    }
    if (errors.length && document.getElementById("errors")) {
	document.getElementById("errors").innerHTML = errors.join("<br />");
    } else {
	if (agImage.byName[User.generateId(name)]) {
	    agImage.byName[User.generateId(name)].isPlayer = true;
	} else {
	    new User(name);
	}
	undemand("player");
    }
    return false;
}

function demandPlayer(data) {
    User.checkNames();
    var wants = '\
<div>Just answer a question or two and you can enter the game.</div>\
<br /><form id="questions" action="" method="GET" \
onSubmit="return satisfyPlayer(this, \'' + data.join(" ") + '\')">';
    wants += '\
<label for="wantUsername">What would you like to be called?&nbsp;&nbsp;</label>\
<input type="text" id="wantUsername" name="username" />';
    for (var c in data) {
    	if (classRegistry[data[c]].playerForm) {
    	    wants += '<br />' + classRegistry[data[c]].playerForm() + '<br />';
    	}
    }
    wants += '<br /><input type="submit" value="Done." /></form>\
<div id="errors"></div>';
    demand("player", 2, wants);
    //undemand("connection");
}

function startNewGame(isServer) {
    var wants = '\
Add some game elements to begin.\
<form id="questions" action="" method="GET" \
onSubmit="return createNewGame(this, ' + isServer + ')">';
    for (var c in classRegistry) {
    	if (classRegistry[c].createForm) {
    		wants += '<br />' + classRegistry[c].createForm() + '<br />';
    	}
    }
    wants += '<br /><input type="submit" value="Done." /></form>';
    demand("create", 6, wants);
    undemand("connection");
}

function createNewGame(form, isServer) {
    Game.changeClient(Game.create(), "you started a new game");
    if (isServer) {
    	rsbp.write('..d-' + rsbp.id);
        Game.changeServer(Game.client, "you started a new game");
    }
    demand("creating", 7, "Please wait, building game...");
    undemand("create");
    for (var i in form.item) {
        if (form.item[i].checked) {
            eval(form.item[i].value); //yikes!
        }
    }
    User.startUp();
    undemand("creating");
    return false;
}

function joinGameInProgress() {
    Game.server.join();
    User.checkNames();
    undemand("connection"); //drop out of connection screen.
}

function continueGame() {
    undemand("connection"); //drop out of connection screen.
}

var count = 0;

function mainTimer() {
    //debug(count++, true);
    //debug(Game.server);
    //debug(Game.client === Game.server);
    if (!rsbp.isConnected()) {
        demandConnectionScreen();
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
<input type="button" value="Start new game" id="startNew" onClick="startNewGame(true)" />\
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
<input type="button" value="Start new solitaire game" onClick="startNewGame(false)" />\
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
    demand("connection", 3, '\
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