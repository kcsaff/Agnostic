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

function agnosticRSBP() {
    rsbp = new Object();
    rsbp.last_transaction = null;
    rsbp.loop = false;
    rsbp.written = "";
    rsbp.minimum_wait = 100;
    rsbp.initial_timeout = 250; //ms
    rsbp.maximum_timeout = 10000;
    rsbp.apply = function(data) {
	var parts = data.split("..");
	for (var i = 1;/*ignore before first separator*/ i < parts.length; ++i) {
	    var ds1 = parts[i].indexOf("-");
	    var meta = parts[i].slice(0, ds1);
	    var payload = parts[i].slice(ds1 + 1);
	    var ds2 = meta.indexOf("o");
	    this.last_transaction = meta.slice(1, ds2);
	    var objectName = meta.slice(ds2 + 1);
	    if (objectName) {
		handleIncoming(objectName, payload);
	    }
	}
	//alert(data);
    }
    rsbp.generate = function() {
	var result = this.written || "";
	this.written = "";
	for (var i = 0; i < objectsByOrder.length; ++i) {
	    if (objectsByOrder[i].outgoing) {
		result += "..o" + objectsByOrder[i].name + "-" + objectsByOrder[i].outgoing;
	    }
	}
	if (this.last_transaction == null) {
	    return result + "..r";
	} else {
	    return result + "..t" + this.last_transaction;
	}
    }
    rsbp.do_write = function(data) {
	var http = new XMLHttpRequest();
	http.open("POST", "RSBP", true);
	http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	http.setRequestHeader("Content-length", data.length);
	http.setRequestHeader("Connection", "close");
	http.onreadystatechange = function() {
	    if (http.readyState == 4) {
		if (http.status == 200) {
		    rsbp.timeout = null;
		    undemand("timeout");
		    rsbp.apply(http.responseText);
                    if (rsbp.loop) {
			rsbp.poll_forever();
		    }
		} else {
		    var self = rsbp;
		    var data = data;
		    if (!self.timeout) {
			self.timeout = self.initial_timeout;
		    }
		    else {
			self.timeout *= 2;
		    }
		    if (self.timeout > self.maximum_timeout) {
			self.timeout = self.maximum_timeout;
			demand("timeout", 100, "Connection lost.");
		    }
		    if (self.loop) {
			setTimeout(function() {self.poll_forever();}, self.timeout);
		    }
		    else {
			setTimeout(function() {self.do_write(data);}, self.timeout);
		    }
		}
	    } 
	}
	http.send(data);
    }
    rsbp.request_all = function() {
	return;
    }
    rsbp.do_poll_forever = function() {
	this.loop = true;
	this.do_write(this.generate());
    }
    rsbp.poll_forever = function() {
	var self = this;
	setTimeout(function() {self.do_poll_forever();}, this.minimum_wait);
    }
    rsbp.write = function(name, payload) {
	this.written += "..o" + name + "-" + payload;
    }
    return rsbp;
}

var rsbp = new agnosticRSBP();

function agnosticImage(image) {
	image.getLeft = function() {
		return parseInt(this.style.left);
	}
	image.getRight = function() {
		return parseInt(this.style.left) + this.width;
	}
	image.getTop = function() {
		return parseInt(this.style.top);
	}
	image.getBottom = function() {
		return parseInt(this.style.top) + this.height;
	}
	image.getCenter = function() {
		return Vector.create([this.getLeft() + this.width / 2, 
                               this.getTop() + this.height / 2])
	}
	image.contains = function(vector) {
		vector = this.toLocalCoords(vector);
		return (Math.abs(vector.e(1)) <= this.width / 2)
			&& (Math.abs(vector.e(2)) <= this.height / 2);
	}
	image.recenter = function(center) {
	    this.style.left = Math.round(center.e(1) - this.width / 2);
	    this.style.top = Math.round(center.e(2) - this.height / 2); 
	}
	image.serialize = function() {
	    var center = this.getCenter();
	    this.outgoing = "" + center.e(1) + " " + center.e(2) + " " 
	        + (this.currentRotation || 0) + " "
	        + (this.image_index || 0);
	}
	image.throwRandomly = function() {
	    this.recenter(randomLocation());
	    this.setRotation(0, Math.random() * 360);
	}
	image.setRotation = function(radians, degrees) {
		this.currentRotation = cleanupDegrees((degrees || 0) 
				              + radiansToDegrees(radians));
		var transform = "rotate(" + this.currentRotation + "deg)";
	    this.style.webkitTransform = transform;
	    this.style.MozTransform = transform;
	    this.currentTransformation = Matrix.Rotation(degreesToRadians(this.currentRotation));
	}
	image.getRotation = function() {
		return degreesToRadians(this.currentRotation || 0);
	}
	image.rotate = function(radians) {
		this.setRotation(radians, this.currentRotation || 0);
	}
	image.move = function(vector) {
		this.recenter(this.getCenter().add(vector));
	}
	image.incoming = function(data) {
	    if (data == this.outgoing) {
		this.outgoing = null;
		return;
	    } else if (this.outgoing) {
		return;
	    }
	    var nums = data.split(" ", 4);
	    var center = Vector.create([parseFloat(nums[0]), parseFloat(nums[1])]);
	    var degrees = parseFloat(nums[2]);
	    this.image_index = parseInt(nums[3] || 0) % this.images.length;
	    this.src = this.images[this.image_index];
	    this.recenter(center);
	    this.setRotation(0, degrees);
	}
	image.flip = function(amount) {
	    this.image_index = (this.image_index || 0) + ((amount == undefined) ? 1 : amount);
	    this.image_index %= this.images.length;
	    if (this.image_index < 0) {
	    	this.image_index += this.images.length;
	    }
	    this.src = this.images[this.image_index];
	}
	image.setTransformation = function(m) {
    	var transform = "matrix(" + m.e(1,1) + ", " + m.e(2,1) + ", " + m.e(1,2) + ", " + m.e(2,2) + ", 0, 0)";
        this.style.webkitTransform = transform;
        this.style.MozTransform = transform; 
        this.currentTransformation = m;
	}
	image.getTransformation = function() {
		return this.currentTransformation || Matrix.I(2);
	}
	image.toLocalCoords = function(globalCoords) {
		return this.getTransformation().inv().x(globalCoords.subtract(this.getCenter()));
	}
	image.toGlobalCoords = function(localCoords) {
		return this.getTransformation().x(localCoords).add(this.getCenter());
	}
	/*image.getCurrent3dOffset = function(offset, pos) {
		//Get 3D vector representing location of offset with respect to the center
		// if it is currently at screen position "pos".
		var oldLength = offset.modulus();
		var res2d = pos.subtract(this.getCenter());
		var newLength = res2d.modulus();
		return Vector.create([res2d.e(1), res2d.e(2), 
		                      Math.sqrt(oldLength * oldLength - newLength * newLength)]);
		
	}
	image.do3dRotate = function(offset, lastpos, pos, stuck) {
		//Apply a 3d rotation corresponding to moving the relative point offset
		// on the object, from the absolute screen location lastpos to pos,
		// assuming the object is currently stuck at "stuck" (abs. screen location)
		
	}
	image.complexRotate = function(offset, lastpos, pos) {
		//Transform image so that the part corresponding to offset ends up at
		// pos.
		
	}*/
	image.normal = Vector.create([0,0,1])
	return image
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

function getMouseOffset(target, ev) {
	ev = ev || window.event;
	return mouseCoords(ev).subtract(getPosition(target));
}

function getPosition(e) {
	var left = 0;
	var top = 0;
	
	while (e.offsetParent) {
		left += e.offsetLeft;
		top += e.offsetTop;
		e = e.offsetParent;
	}
	left += e.offsetLeft;
	top += e.offsetTop;
	
	return Vector.create([left, top]);
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
	array[i].style.zIndex = (array[i].baseZ || 0) + i;
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
    result.object.style.position = "absolute";
    result.offset = object.toLocalCoords(mouseCoords(event));
    result.lastPos = mouseCoords(event);
    result.move = function (mousePos) {
        var thisTime = (new Date()).getTime();
	if (Math.abs(this.offset.e(1)) < this.object.width / 4
	        && Math.abs(this.offset.e(2)) < this.object.height / 4) {//move only
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
		    this.object.points.push(Vector.create([-this.object.width / 2,
						           -this.object.height / 2]));
		    this.object.points.push(Vector.create([+this.object.width / 2,
						           -this.object.height / 2]));
		    this.object.points.push(Vector.create([-this.object.width / 2,
						           +this.object.height / 2]));
		    this.object.points.push(Vector.create([+this.object.width / 2,
						           +this.object.height / 2]));
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
    result.object.style.position = "absolute";
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
    result.object.style.position = "absolute";
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
	    return betterAction.move(mousePos);
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
	item.onmousedown = function(ev) {
	    if (getButton(ev) == 'middle' 
		|| (getButton(ev) == 'left' && ev.shiftKey)) {
			betterAction = dragFlip(this, ev);
		} 
		else if (getButton(ev) == 'left') {
			betterAction = dragMoveAndRotate(this, ev);
		} else {
			alert("" + this.getCenter().e(1) + " " + this.getCenter().e(2))
			//alert("" + mouseCoords(ev).e(1) + " " + mouseCoords(ev).e(2));
		}
		if (betterAction) {
		    if (moveToEnd(objectsByOrder, this)) {
			fixZOrder(objectsByOrder);
		    }
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
    card.images = [front, back];
    makeDraggable(card);
    card.style.position = "absolute";
    card.style.top = 100;
    card.style.left = 100;
    card.style.zIndex = 1;
    card = agnosticImage(card);
    card.baseZ = 0;
    registerObject(id || get_next_id(), card);
    card.throwRandomly();
    if (Math.random() < 0.33) {
    	card.flip();
    }
    document.body.appendChild(card);
    if (!id) {
	rsbp.write("cc" + card.name, front + " " + back);
    }
    return card;
}

function createPyramid(src, size, id) {
    var pyramid = document.createElement("img");
    pyramid.src = src;
    pyramid.images = [src];
    makeDraggable(pyramid);
    pyramid.style.position = "absolute";
    pyramid.style.top = 100;
    pyramid.style.left = 100;
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
    pyramid = agnosticImage(pyramid);
    pyramid.baseZ = 200;
    registerObject(id || get_next_id(), pyramid);
    pyramid.throwRandomly();
    document.body.appendChild(pyramid);
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
	if (_demandps[i] >= priority && _demands[i]) {
	    text = _demands[i];
	    priority = _demandps[i];
	}
    }
    if (document.getElementById("demandinner")) {
	document.body.removeChild(document.getElementById("demandinner"));
    }
    if (!text) {
	_fade_demand();
	return;
	if (document.getElementById("demand")) {
	    document.body.removeChild(document.getElementById("demand"));
	}
	return;
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
    inner.style.top = window.innerHeight / 2 - 150;
    document.body.appendChild(inner);
}