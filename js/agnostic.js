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

document.onmousemove = mouseMove;
document.onmouseup = mouseUp;
//document.contextmenu = doNothing;

var betterAction = null;

function doNothing(ev) {
}

function mouseCoords(ev) {
	if (ev.pageX || ev.pageY) {
		return {x:ev.pageX, y:ev.pageY};
	}
	return {
		x:ev.clientX + document.body.scrollLeft - document.body.clientLeft,
		y:ev.clientY + document.body.scrollTop - document.body.clientTop
	};
}

function getMouseOffset(target, ev) {
	ev = ev || window.event;
	var docPos = getPosition(target);
	var mousePos = mouseCoords(ev);
	return {x:mousePos.x - docPos.x, y:mousePos.y - docPos.y};
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
	
	return {x:left, y:top};
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

var draggables = new Array();
var oneTime = 1;

function isPositionInBox(pos, obj) {
    pos = rotateAround(getObjectCenter(obj), pos, 
		       -degreesToRadians(obj.currentRotation))
    var left = parseInt(obj.style.left);
    var top = parseInt(obj.style.top);
    if (pos.x < left) {
	return false;
    }
    if (pos.x > left + obj.width) {
	return false;
    }
    if (pos.y < top) {
	return false;
    }
    if (pos.y > top + obj.height) {
	return false;
    }
    return true;
}

function getObjectCenter(obj) {
	var left = parseInt(obj.style.left);
	var top = parseInt(obj.style.top);
	return {x: left + obj.width / 2, y: top + obj.height / 2};
}

function getAbsoluteRotation(center, point) { //in radians
    return Math.atan2(point.y  - center.y, point.x  - center.x);
}

function getRelativeRotation(center, first, last) { //in radians
    return getAbsoluteRotation(center, last) - getAbsoluteRotation(center, first);
}

function getRelative(point1, point2) {
    return {x:point2.x - point1.x, 
	    y:point2.y - point1.y};
}

function getRelative3(point1, point2) {
    return {x:point2.x - point1.x, 
	    y:point2.y - point1.y,
	    z:point2.z - point1.z};
}

function applyRelative(point1, point2) {
    return {x:point2.x + point1.x, 
	    y:point2.y + point1.y};
}

function vectorLength(rel) {
    return Math.sqrt(rel.x * rel.x + rel.y * rel.y);
}

function vectorLength3(rel) {
    return Math.sqrt(rel.x * rel.x + rel.y * rel.y + rel.z * rel.z);
}

function vectorMultiply(v, amount) {
    return {x:v.x * amount,
	    y:v.y * amount};
}

function distance(point1, point2) {
    return vectorLength(getRelative(point1, point2));
}

function distance3(point1, point2) {
    return vectorLength3(getRelative3(point1, point2));
}

function rotateAround(center, point, radians) {
    if (!radians) return point;
    return applyRelative(center, rotateVector(getRelative(center, point), radians));
}

function rotateVector(rel, radians) {
    return {x:rel.x * Math.cos(radians) - rel.y * Math.sin(radians),
	    y:rel.x * Math.sin(radians) + rel.y * Math.cos(radians)};
}

function getRelativePosition(pos, obj) {
    pos = rotateAround(getObjectCenter(obj), pos, 
		       -degreesToRadians(obj.currentRotation))
    var left = parseInt(obj.style.left);
    var top = parseInt(obj.style.top);
    var result = "in";
    var badness = 0;
    var bad = [left - pos.x, pos.x - (left + obj.width),
	       top - pos.y, pos.y - (top + obj.height)];
    var names = ["left", "right", "up", "down"];
    for (var i=0; i < 4; ++i) {
        if (bad[i] > badness) {
	    badness = bad[i];
	    result = names[i];
	}
    }
    
    return result;
}

function normalVector(newRel, oldRel) {
    var newLength = vectorLength(newRel);
    var oldLength = vectorLength(oldRel);
    var relLength = newLength / oldLength;
    if (relLength == 0) {
	return {x: -oldRel.x / oldLength, y: -oldRel.y / oldLength, z: 0};
    }
    var relHeight = Math.sqrt(1 - relLength * relLength);
    return {x: -newRel.x * relHeight / relLength, y: -newRel.y * relHeight / relLength, z: relLength};
}

function conjugate(vec) {
    return {x: -vec.x, y: vec.y};
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

function dragMove(object, event) {
    result = {};
    result.object = object;
    result.object.style.position = "absolute";
    result.mouseOffset = getMouseOffset(object, event);
    result.move = function (mousePos) {
        this.object.style.top = mousePos.y - this.mouseOffset.y;
        this.object.style.left = mousePos.x - this.mouseOffset.x;
        return false;
    }
    return result;
}

function dragMoveAndRotate(object, event) {
    result = {};
    result.object = object;
    result.object.style.position = "absolute";
    result.offset = rotateVector(getRelative(getObjectCenter(object), 
                                             mouseCoords(event)),
				    -degreesToRadians(object.currentRotation || 0));
    result.lastPos = mouseCoords(event);
    result.move = function (mousePos) {
	if (Math.abs(this.offset.x) < this.object.width / 4
	        && Math.abs(this.offset.y) < this.object.height / 4) {//move only
	    applyRelativePosition(this.object, getRelative(this.lastPos, mousePos));
	} else {
	    var oldCenter = getObjectCenter(this.object);
	    var oldRotation = getAbsoluteRotation({x:0, y:0}, this.offset)
	    var amount = distance(oldCenter, mousePos) / vectorLength(this.offset);
	    var newRotation = getAbsoluteRotation(oldCenter, mousePos);
	    if (amount >= 0) {
		    applyAbsoluteRotation(this.object, newRotation - oldRotation);
		    var newRelativePoint = rotateVector(this.offset, newRotation - oldRotation); 
		    newCenter = applyRelative(mousePos, vectorMultiply(newRelativePoint, -1.0));
		    applyAbsoluteCenter(this.object, newCenter);
	    } else if (true || amount >= 0.5) {
		//try out flip possibilities.
		var oldNormal = normalVector(getRelative(oldCenter, 
							 this.lastPos), this.offset);
		var newNormal = normalVector(getRelative(oldCenter,
							 mousePos), this.offset);
		var altNormal = {x: -newNormal.x, y: -newNormal.y, z: -newNormal.z};

		if (distance3(oldNormal, altNormal) < distance3(oldNormal, newNormal)) {
		    this.offset = conjugate(this.offset);
		    doFlip(this.object);
		    oldRotation = getAbsoluteRotation({x:0, y:0}, this.offset)
		}

	    	//need a transformation that keeps the center fixed, but takes the 
	    	// offset point to mousePos along the center-mousePos axis.
	    	//after applying this rotation, offset will be pointing right. x+
	    	// so compress the x direction
	    	//then rotate to current rotation.

	    	//Again: first put offset on x axis
	    	var xx1 = Math.cos(-oldRotation);
	    	var yx1 = -Math.sin(-oldRotation);
	    	var xy1 = -yx1;
	    	var yy1 = xx1;

	    	//Then: compress x axis.
	    	xx1 *= amount;
	    	yx1 *= amount;

	    	//Finally: rotate to current position.
	    	var xx2 = Math.cos(newRotation);
	    	var yx2 = -Math.sin(newRotation);
	    	var xy2 = -yx2;
	    	var yy2 = xx2;
	    	
	    	var xx = xx1 * xx2 + xy1 * yx2;
	    	var yx = yx1 * xx2 + yy1 * yx2;
	    	var xy = xx1 * xy2 + xy1 * yy2;
	    	var yy = yy1 * yy2 + yx1 * xy2;
	    	
	    	var transform = "matrix(" + xx + ", " + xy + ", " + yx + ", " + yy + ", 0, 0)";
	        this.object.style.webkitTransform = transform;
	        this.object.style.MozTransform = transform; 
	        this.object.currentRotation = radiansToDegrees(newRotation - oldRotation);
	    } else {
		//try out flip possibilities.
		var oldNormal = normalVector(getRelative(oldCenter, 
							 this.lastPos), this.offset);
		var newNormal = normalVector(getRelative(oldCenter,
							 mousePos), this.offset);
		var altNormal = {x: -newNormal.x, y: -newNormal.y, z: -newNormal.z};

		if (distance3(oldNormal, altNormal) < distance3(oldNormal, newNormal)) {
		    this.offset = conjugate(this.offset);
		    doFlip(this.object);
		    oldRotation = getAbsoluteRotation({x:0, y:0}, this.offset);
		    alert("flip!");
		}
		newRotation = degreesToRadians(this.object.currentRotation || 0) + oldRotation;

	    	//need a transformation that keeps the center fixed, but takes the 
	    	// offset point to mousePos along the center-mousePos axis.
	    	//after applying this rotation, offset will be pointing right. x+
	    	// so compress the x direction
	    	//then rotate to current rotation.

	    	//Again: first put offset on x axis
	    	var xx1 = Math.cos(-oldRotation);
	    	var yx1 = -Math.sin(-oldRotation);
	    	var xy1 = -yx1;
	    	var yy1 = xx1;

	    	//Then: compress x axis.
	    	xx1 *= amount;
	    	yx1 *= amount;

	    	//Finally: rotate to current position.
	    	var xx2 = Math.cos(newRotation);
	    	var yx2 = -Math.sin(newRotation);
	    	var xy2 = -yx2;
	    	var yy2 = xx2;
	    	
	    	var xx = xx1 * xx2 + xy1 * yx2;
	    	var yx = yx1 * xx2 + yy1 * yx2;
	    	var xy = xx1 * xy2 + xy1 * yy2;
	    	var yy = yy1 * yy2 + yx1 * xy2;
	    	
	    	var transform = "matrix(" + xx + ", " + xy + ", " + yx + ", " + yy + ", 0, 0)";
	        this.object.style.webkitTransform = transform;
	        this.object.style.MozTransform = transform; 
	        //this.object.currentRotation = radiansToDegrees(newRotation - oldRotation);
	    }
	  }
	  this.lastPos = mousePos;
      return false;
    }
    result.drop = function () {
	    snapRotation(this.object, 90, 12);
    }
    return result;
}

function doFlip(object, amount) {
    object.image_index = (object.image_index || 0) + ((amount == undefined) ? 1 : amount);
    object.image_index %= object.images.length;
    if (object.image_index < 0) {
	object.image_index += object.images.length;
    }
    object.src = object.images[object.image_index];
}

function dragFlip(object, event) {
    result = {};
    result.object = object;
    result.object.style.position = "absolute";
    result.object.image_index = result.object.image_index || 0;
    result.flipped = false;
    result.move = function (mousePos) {
        var shouldFlip = !isPositionInBox(mousePos, this.object);
        if (shouldFlip && !this.flipped && this.object.images) {
            doFlip(this.object, +1);
	    this.flipped = true;
        }
        else if (false && !shouldFlip && this.flipped && this.object.images) {
            doFlip(this.object, -1);
	    this.flipped = false;
        }
        return false; 
    }
    return result;
}

function snapRotation(object, increment, closeness) {
    applyAbsoluteRotation(object, 0, snapDegrees(object.currentRotation || 0, 
						 increment, closeness));
}

function applyAbsoluteRotation(object, radians, degrees) {
    object.currentRotation = cleanupDegrees((degrees || 0) 
					    + radiansToDegrees(radians));
    transform = "rotate(" + object.currentRotation + "deg)";
    object.style.webkitTransform = transform;
    object.style.MozTransform = transform;
}

function applyRelativeRotation(object, radians) {
    applyAbsoluteRotation(object, radians, object.currentRotation || 0);
}

function applyAbsoluteCenter(object, point) {
    object.style.left = point.x - object.width / 2;
    object.style.top = point.y - object.height / 2; 
}

function applyRelativePosition(object, vector) {
    var left = parseInt(object.style.left);
    var top = parseInt(object.style.top);
    object.style.left = left + vector.x;
    object.style.top = top + vector.y;
}

function dragArbitraryRotate(object, event) {
    result = {};
    result.object = object;
    result.object.style.position = "absolute";
    result.mouseFirstPos = mouseCoords(event);
    result.firstRotation = object.currentRotation || 0;
    result.move = function (mousePos) {
        newRotation = getRelativeRotation(getObjectCenter(this.object),
                                          this.mouseFirstPos,
                                          mousePos);
	applyAbsoluteRotation(this.object, newRotation, this.firstRotation);
	snapRotation(this.object, 90, 10);
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
		} 
		if (betterAction) {
		    if (moveToEnd(draggables, this)) {
			fixZOrder(draggables);
		    }
		    mouseMove(ev);
		}
		return false;
	}
	draggables.push(item);
}

function randomLocation() {
    return {x:parseInt(Math.random() * (window.innerWidth - 200) + 100),
	    y:parseInt(Math.random() * (window.innerHeight - 200) + 100)};
}

function throwRandomly(object) {
    applyAbsoluteCenter(object, randomLocation());
    applyAbsoluteRotation(object, 0, Math.random() * 360);
}

function createCard(front, back) {
    card = document.createElement("img");
    card.src = front;
    card.images = [front, back];
    makeDraggable(card);
    card.style.position = "absolute";
    card.style.top = 100;
    card.style.left = 100;
    card.style.zIndex = 1;
    card.baseZ = 0;
    throwRandomly(card);
    if (Math.random() < 0.33) {
	doFlip(card, 1);
    }
    document.getElementById("cards").appendChild(card);
    return card;
}

function createPyramid(src, size) {
    pyramid = document.createElement("img");
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
      }
      /*if (pyramid.style.width) {
        pyramid.style.width = parseInt(pyramid.style.width) * size;
      }*/
    };
    //pyramid.width *= size;
    pyramid.baseZ = 200;
    throwRandomly(pyramid);
    document.getElementById("cards").appendChild(pyramid);
    return pyramid;
}

