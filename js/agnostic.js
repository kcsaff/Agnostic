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

/*function include(filename)
{
	var head = document.getElementsByTagName('head')[0];
	
	script = document.createElement('script');
	script.src = filename;
	script.type = 'text/javascript';
	
	head.appendChild(script)
}

include('sylvester.src.js');*/

document.onmousemove = mouseMove;
document.onmouseup = mouseUp;
//document.contextmenu = doNothing;

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

var oldGames = new Array();
var serverGame = null;
var clientGame = null;

function GameRecord() {
    this.objects = new Object();
    this.pending = new Object();
    this.transaction = 0;
}
GameRecord.prototype = {
    incoming: function(key, data, maintain_pending) {
	//debug('handling ' + key + '-' + data);
	if (!this.pending[key]) {
	    this.objects[key] = [this.transaction++, data];
	    if (this === clientGame) {
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
	if (clientGame === serverGame) {return;}
	changeClientGame(this);
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
	    result.push("..n..o-new");
	}
	for (var i in arr) {
	    result.push("..o" + arr[i][1] + "-" + arr[i][0][1]);
	}
	return result.join("");
    },
    upload: function() {
	changeServerGame(this);
	rsbp.raw_write(this.generate(true));
    }
}
GameRecord.create = function() {
    var game = new GameRecord();
    game.outgoing('', 'new');
    return game;
}

function ensureGameSaved(game) {
    if (!game) {return;}
    var text = game.generate(true);
    var found = false;
    for (var i in oldGames) {
	if (oldGames[i] == text) {
	    found = true;
	}
    }
    if (!found) {
	oldGames.push(text);
    }
}

function changeServerGame(game) {
    if (game === serverGame) {return;}
    ensureGameSaved(serverGame);
    serverGame = game;
}

function changeClientGame(game) {
    if (game === clientGame) {return;}
    ensureGameSaved(clientGame);

    if (clientGame) {
	alert("Clearing all client data!");
    }
    for (var i in objectsByName) {
	var obj = objectsByName[i];
	if (obj && obj.e && obj.e.parentNode) {
	    obj.e.parentNode.removeChild(obj.e);
	}
    }
    objectsByOrder = new Array();
    objectsByName = new Object();  

    clientGame = game;
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
	    if (serverGame && objectName) {
		if (!clientGame) {
		    clientGame = serverGame;
		}
		serverGame.incoming(objectName, payload);
	    } else if (payload == 'new') {
		changeServerGame(new GameRecord());
	    } else if (!payload) {
		changeServerGame(null);
	    }
	}
	if (this.after) {
	    this.after();
	}
	//alert(data);
    }
    /*rsbp.refresh = function() {
	this.last_transaction = undefined;
	this.raw_write("..r");
	}*/
    rsbp.generate = function() {
	var result = this.written;
	this.written = new Array();
	if (serverGame) {
	    result.push(serverGame.generate(false));
	    if (this.last_transaction) {
		result.push("..t" + this.last_transaction);
	    } else {
		result.push("..r");
	    }
	} else {
	    result.push("..r");
	}
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
    rsbp.request_all = function() {
	return;
    }
    rsbp.poll = function() {
	this.do_write(this.generate(false));
    }
    rsbp.poll_forever = function() {
	this.loop = true;
	var self = this;
	setTimeout(function() {self.poll();}, this.minimum_wait);
    }
    /*rsbp.write = function(name, payload) {
	this.written.push("..o" + name + "-" + payload);
    }
    rsbp.raw_write = function(data) {
	this.written.push(data);
	}*/
    return rsbp;
}

var rsbp = new agnosticRSBP();

function agImage(element) {
    this.e = element;
    this.e.style.position = "absolute";
}
agImage.prototype = {
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
        clientGame.outgoing(this.name,
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
    }
}



var betterAction = null;

function doNothing(ev) {
}

function mouseCoords(ev) {
	if (ev.pageX || ev.pageY) {
		return Vector.create([ev.pageX, ev.pageY]);
	}
	return Vector.create([ev.clientX + document.body.scrollLeft - document.body.clientLeft,
	                      ev.clientY + document.body.scrollTop - document.body.clientTop]);

}

var whichButton = [0, 'left', 'middle', 'right']; //most
var buttonButton = ['left', 'left', 'right', 0, 'middle']; //IE

function getButton(event) {
    if (event.which) {
        return whichButton[event.which];
    }
    else {
        return buttonButton[event.button];
    }
}

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

//alert("" + getRotation($V([1,0])) + " " + getRotation($V([0,1])) + " " + getRotation($V([-1,0])))

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

function dragMoveAndRotate(object, event) {
    result = {};
    result.object = object;
    result.offset = object.toLocalCoords(mouseCoords(event));
    result.lastPos = mouseCoords(event);
    result.move = function (mousePos) {
        var thisTime = (new Date()).getTime();
	if (Math.abs(this.offset.e(1)) < this.object.e.width / 4
	        && Math.abs(this.offset.e(2)) < this.object.e.height / 4) {//move only
	    this.object.move(mousePos.subtract(this.lastPos));
	} else {
            this.velocity = mousePos.subtract(this.lastPos).x(1 / (thisTime - this.lastTime))
              || Vector.Zero(2);
            var inVelocity = (this.lastPos.distanceFrom(this.object.getCenter()) 
			      - mousePos.distanceFrom(this.object.getCenter())) 
                              / (thisTime - this.lastTime) || 0;
	    var oldCenter = this.object.getCenter();
    	    var oldRotation = getAbsoluteRotation(Vector.Zero(2), this.offset)
    	    var amount = mousePos.distanceFrom(oldCenter) / this.offset.modulus();
	    var newRotation = getAbsoluteRotation(oldCenter, mousePos);
	    if (amount >= 1 || (!this.x && inVelocity < 0.25)) {
		    this.object.setRotation(newRotation - oldRotation);
		    var newRelativePoint = this.offset.rotate(newRotation - oldRotation, Vector.Zero(2)); 
		    newCenter = mousePos.subtract(newRelativePoint);
		    this.object.recenter(newCenter);
                    this.x = null; this.y = null;
	    } else if (true) {
		//First create temporary information needed for flipping.
		if (!this.x || !this.y) {
		    this.x = Vector.create([Math.cos(this.object.getRotation()),
					    Math.sin(this.object.getRotation()), 0]);
		    this.y = Vector.create([-Math.sin(this.object.getRotation()),
					     Math.cos(this.object.getRotation()), 0]);
		}
		if (!this.object.points) {
		    this.object.points = new Array();
		    this.object.points.push(Vector.create([-this.object.e.width / 2,
						           -this.object.e.height / 2]));
		    this.object.points.push(Vector.create([+this.object.e.width / 2,
						           -this.object.e.height / 2]));
		    this.object.points.push(Vector.create([-this.object.e.width / 2,
						           +this.object.e.height / 2]));
		    this.object.points.push(Vector.create([+this.object.e.width / 2,
						           +this.object.e.height / 2]));
		}
		/*
		  First determine which point we want to rotate around.  This should
		  be biased towards the card's lowest point (most negative z), but
		  if the card is fairly level we want it to be the center.  So we
		  perform an average weighted by -z.
		 */
		var tot = 0;
		var cor = Vector.Zero(2); //center of rotation	  
		for (var i = 0; i < this.object.points.length; ++i) {
		    var z = this.x.x(this.object.points[i].e(1)).add(
                            this.y.x(this.object.points[i].e(2))    ).e(3);
		    var weight = Math.exp(-z / 30.0); // 30.0 found experimentally decent.
		    cor = cor.add(this.object.points[i].x(weight));
		    tot += weight;
		}
		cor = cor.x(1.0 / tot); //Finally have center of rotation in relative coords.
		//cor = this.object.points[3];
		/*
		  Now figure out both old and new 3D vectors of the grabbed point with respect
		  to the point to rotate around.  This is easily done.  We know the total distance,
		  and the x and y offsets, so we only need to calculate the z.  We know the z is
                  positive since it is higher.
		 */
                var absCor = this.object.toGlobalCoords(cor);
		var old2D = this.lastPos.subtract(absCor);
		var new2D = mousePos.subtract(absCor);
		var distance = cor.distanceFrom(this.offset);
		var old3D = Vector.create([old2D.e(1), old2D.e(2),
                                           Math.sqrt(distance * distance
                                                     -old2D.modulus() * old2D.modulus()) || 0]);
		var new3D = Vector.create([new2D.e(1), new2D.e(2),
                                           Math.sqrt(distance * distance
                                                     -new2D.modulus() * new2D.modulus()) || 0]);
                /*
                  The cross product of these is the axis of rotation.  Rotate the "x" and "y"
                  vectors around it in the specified angle (arcsin of the length).
                 */
                old3D = old3D.toUnitVector();
                new3D = new3D.toUnitVector();
                var cp = old3D.cross(new3D);
                var angle = Math.asin(cp.modulus());
                var axis = Line.create([0,0], cp);
                if (axis) {//axis usually ok, might be invalid for some math reasons
                    this.x = this.x.rotate(angle, axis);
                    this.y = this.y.rotate(angle, axis);
                }
                /*
                  Then recalculate center based on new rotation so stuck point doesn't move.
                 */
                var m = Matrix.create([[this.x.e(1), this.y.e(1)],
                                       [this.x.e(2), this.y.e(2)]]);
                if (m.determinant() < 0) {
                    this.x = this.x.x(-1);
                    this.offset = Vector.create([-this.offset.e(1), this.offset.e(2)]);
                    m = Matrix.create([[this.x.e(1), this.y.e(1)],
                                       [this.x.e(2), this.y.e(2)]]);
                    this.object.flip();
                }
                this.object.currentRotation = radiansToDegrees(newRotation - oldRotation);
                this.object.setTransformation(m);
                var newPos = this.object.toGlobalCoords(this.offset);
		this.object.move(mousePos.subtract(newPos));
	    }
	  }
	this.lastTime = thisTime;
      this.lastPos = mousePos;
      return false;
    }
    result.drop = function () {
	snapRotation(this.object, 90, 12);
    }
    return result;
}


function dragFlip(object, event) {
    result = {};
    result.object = object;
    result.object.image_index = result.object.image_index || 0;
    result.flipped = false;
    result.move = function (mousePos) {
        var shouldFlip = !this.object.contains(mousePos);
        if (shouldFlip && !this.flipped && this.object.images) {
            this.object.flip(+1);
	    this.flipped = true;
        }
        else if (false && !shouldFlip && this.flipped && this.object.images) {
            this.object.flip(-1);
	    this.flipped = false;
        }
        return false; 
    }
    return result;
}

function snapRotation(object, increment, closeness) {
    object.setRotation(0, snapDegrees(object.currentRotation || 0, 
						 increment, closeness));
}

function dragArbitraryRotate(object, event) {
    result = {};
    result.object = object;
    result.mouseFirstPos = mouseCoords(event);
    result.firstRotation = object.currentRotation || 0;
    result.move = function (mousePos) {
        newRotation = getRelativeRotation(this.object.getCenter(),
                                          this.mouseFirstPos,
                                          mousePos);
        this.object.setRotation(newRotation, this.firstRotation);
        //snapRotation(this.object, 90, 10);
        return false;
    }
    return result;
}

function mouseMove(ev) {
	ev = ev || window.event;
	var mousePos = mouseCoords(ev);
	if (betterAction && getButton(ev)) {
	    var result = betterAction.move(mousePos);
	    if (betterAction.object) {
		betterAction.object.serialize();
	    }
	}
}

function mouseDown(ev) {
}

function mouseUp() {
    if (betterAction && betterAction.drop) {
	betterAction.drop();
    }
    if (betterAction && betterAction.object) {
	betterAction.object.serialize();  
    }
    betterAction = null;
    return false;
}

function makeDraggable(item) {
	if (!item) return;
        var self = item;
	self.e.onmousedown = function(ev) {//TODO: circular reference.
	    if (getButton(ev) == 'middle' 
		|| (getButton(ev) == 'left' && ev.shiftKey)) {
			betterAction = dragFlip(self, ev);
		} 
		else if (getButton(ev) == 'left') {
			betterAction = dragMoveAndRotate(self, ev);
		} else {
			alert("" + self.getCenter().e(1) + " " + self.getCenter().e(2))
			//alert("" + mouseCoords(ev).e(1) + " " + mouseCoords(ev).e(2));
		}
		if (betterAction) {
		    self.moveToFront();
		    mouseMove(ev);
		}
		return false;
	}
}

function randomLocation() {
    return Vector.create([parseInt(Math.random() * (window.innerWidth - 200) + 100),
                          parseInt(Math.random() * (window.innerHeight - 200) + 100)]);
}

var _next_id = 1;
function get_next_id() {
    return "i" + _next_id++;
}

function registerObject(name, obj) {
    obj.name = name;
    objectsByOrder.push(obj);
    objectsByName[obj.name] = obj;
}

function createCard(front, back, id) {
    var card = document.createElement("img");
    card.src = front;
    card.style.zIndex = 1;
    card = new agImage(card);
    makeDraggable(card);
    card.images = [front, back];
    card.baseZ = 0;
    registerObject(id || get_next_id(), card);
    card.throwRandomly();
    if (Math.random() < 0.33) {
    	card.flip();
    }
    document.body.appendChild(card.e);
    if (!id) {
	clientGame.outgoing("cc" + card.name, front + " " + back);
	//alert(rsbp.written);
	card.serialize();
    }
    return card;
}

function createPyramid(src, size, id) {
    if (id) {
	//debug('creating pyramid ' + id);
    }
    var pyramid = document.createElement("img");
    pyramid.src = src;
    pyramid.style.zIndex = 200;
    pyramid.onload = function() {
      if (this.width) {
        this.width *= size;
        this.points = new Array();
        this.points.push(Vector.create([0, -this.height / 2]));
        this.points.push(Vector.create([-this.width / 2,
				        +this.height / 2]));
        this.points.push(Vector.create([+this.width / 2,
				        +this.height / 2]));
      }
    };
    pyramid = new agImage(pyramid);
    makeDraggable(pyramid);
    pyramid.images = [src];
    pyramid.baseZ = 200;
    registerObject(id || get_next_id(), pyramid);
    pyramid.throwRandomly();
    document.body.appendChild(pyramid.e);
    if (!id) {
	clientGame.outgoing("cp" + pyramid.name, src + " " + size);
	pyramid.serialize();
    }
    return pyramid;
}


function handleIncoming(name, data) {
    if (name[0] == "i") {
	if (objectsByName[name]) {
	    objectsByName[name].incoming(data);
	} else {
	    alert(name + " not found!");
	}
    } else if (name[0] == "c") {
	var realname = name.slice(2);
	if (name[1] == "c") {
	    if (!objectsByName[realname]) {
		var info = data.split(" ");
		createCard(info[0], info[1], realname);
	    } else {
		//alert("Already created: " + name + ", " + data);
	    }
	}
	else if (name[1] == "p") {
	    if (!objectsByName[realname]) {
		var info = data.split(" ");
		createPyramid(info[0], info[1], realname);
	    } else {
		//alert("Already created: " + name + ", " + data);
	    }
	}
	else {
	    alert("Can't create: " + name + ", " + data);
	}
    }
    else {
	alert("Unhandled object: " + name + ", " + data);
    }
}

function createStandardDeck() {
    var suits = "clubs diamonds hearts spades".split(" ");
    var ranks = "a 2 3 4 5 6 7 8 9 10 j q k".split(" ");
    for (var suit in suits) {
	for (var rank in ranks) {
	    createCard("card/" + suits[suit] + "-" + ranks[rank] + "-75.png",
		       "card/back-blue-75-1.png");
	}
    }
    createCard("card/joker-r-75.png", "card/back-blue-75-1.png");
    createCard("card/joker-b-75.png", "card/back-blue-75-1.png");
}

function createTarotDeck() {
    var suits = "wa sw cu pe".split(" ");
    var ranks = "ac 02 03 04 05 06 07 08 09 10 pa kn qu ki".split(" ");
    for (var suit in suits) {
	for (var rank in ranks) {
	    createCard("tarot/" + suits[suit] + ranks[rank] + ".png",
		       "tarot/back.png");
	}
    }

    for (var i = 0; i < 22; ++i) {
	var s = "" + i;
	if (s.length < 2) {
	    s = "0" + s;
	}
	createCard("tarot/ar" + s + ".png", "tarot/back.png");
    }
}

function createPyramidStash(color) {
    for (var i = 0; i < 5; ++i) {
	createPyramid("pyramid/" + color + "-pyramid.png", 1.00);
	createPyramid("pyramid/" + color + "-pyramid-medium.png", 1.00);
	createPyramid("pyramid/" + color + "-pyramid-small.png", 1.00);
    }
}

function createPyramidStashes(color) {
    var colors = "red yellow green blue".split(" ");
    for (var i in colors) {
	createPyramidStash(colors[i]);
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

function wantCards() {
    return '\
<br /><label for="wantStandardDeck"><img src="card/spades-a-75.png" /></label><br />\
<input type="checkbox" name="item" id="wantStandardDeck" value="createStandardDeck()">\
Add a deck of standard playing cards.</input><br />\
';
}

function wantTarot() {
    return '\
<br /><label for="wantTarotDeck"><img src="tarot/ar00.png" /></label><br />\
<input type="checkbox" name="item" id="wantTarotDeck" value="createTarotDeck()">\
Add a deck of tarot cards.</input><br />\
';
}

function wantPyramids() {
    return '\
<table><tr align="center">\
<td><label for="wantRedPyr"><img src="pyramid/red-pyramid.png" /></label></td>\
<td><label for="wantGreenPyr"><img src="pyramid/green-pyramid.png" /></label></td>\
<td><label for="wantBluePyr"><img src="pyramid/blue-pyramid.png" /></label></td>\
<td><label for="wantYellowPyr"><img src="pyramid/yellow-pyramid.png" /></label></td>\
</tr><tr align="center">\
<td><input type="checkbox" name="item" id="wantRedPyr" value="createPyramidStash(\'red\')">\
</input></td>\
<td><input type="checkbox" name="item" id="wantGreenPyr" value="createPyramidStash(\'green\')">\
</input></td>\
<td><input type="checkbox" name="item" id="wantBluePyr" value="createPyramidStash(\'blue\')">\
</input></td>\
<td><input type="checkbox" name="item" id="wantYellowPyr" value="createPyramidStash(\'yellow\')">\
</input></td>\
</tr></table>\
Add some pyramid stashes.<br />\
';
}

function startNewServerGame() {
    var wants = '\
Add some game elements to begin.\
<form id="questions" action="" method="GET" \
onSubmit="return createNewServerGame(this)">';
    wants += wantCards();
    wants += wantTarot();
    wants += wantPyramids();
    wants += '<br /><input type="submit" value="Done." />';
    demand("create", 1, wants);
    undemand("connection");
}

function createNewServerGame(form) {
    changeClientGame(GameRecord.create());
    changeServerGame(clientGame);
    demand("creating", 1, "Please wait, building game...");
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
    serverGame.join();
    undemand("connection"); //drop out of connection screen.
}

var count = 0;

function mainTimer() {
    /*debug(count++, true);
    debug(serverGame);
    debug(clientGame);*/
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
	    if (serverGame) {
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
