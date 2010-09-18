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
		vector = vector.rotate(-degreesToRadians(this.currentRotation || 0), 
							   this.getCenter());
		return !( vector.e(1) < this.getLeft()
				|| vector.e(1) > this.getRight()
				|| vector.e(2) < this.getTop()
				|| vector.e(2) > this.getBottom());
	}
	
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

var draggables = new Array();
var oneTime = 1;

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

function dragMove(object, event) {
    result = {};
    result.object = object;
    result.object.style.position = "absolute";
    result.mouseOffset = getMouseOffset(object, event);
    result.move = function (mousePos) {
        this.object.style.top = mousePos.e(2) - this.mouseOffset.e(2);
        this.object.style.left = mousePos.e(1) - this.mouseOffset.e(1);
        return false;
    }
    return result;
}

function dragMoveAndRotate(object, event) {
    result = {};
    result.object = object;
    result.object.style.position = "absolute";
    result.offset = mouseCoords(event).rotate(-degreesToRadians(object.currentRotation || 0),
    											object.getCenter()).subtract(object.getCenter());
    result.lastPos = mouseCoords(event);
    result.move = function (mousePos) {
	if (Math.abs(this.offset.e(1)) < this.object.width / 4
	        && Math.abs(this.offset.e(2)) < this.object.height / 4) {//move only
	    applyRelativePosition(this.object, mousePos.subtract(this.lastPos));
	} else {
	    var oldCenter = this.object.getCenter();
    	var oldRotation = getAbsoluteRotation(Vector.Zero(2), this.offset)
    	var amount = mousePos.distanceFrom(oldCenter) / this.offset.modulus();
	    var newRotation = getAbsoluteRotation(oldCenter, mousePos);
	    if (amount >= 1) {
		    applyAbsoluteRotation(this.object, newRotation - oldRotation);
		    var newRelativePoint = this.offset.rotate(newRotation - oldRotation,
		    										   Vector.Zero(2)); 
		    newCenter = mousePos.subtract(newRelativePoint);
		    applyAbsoluteCenter(this.object, newCenter);
	    } else {
	    	//need a transformation that keeps the center fixed, but takes the 
	    	// offset point to mousePos along the center-mousePos axis.
	    	//after applying this rotation, offset will be pointing right. x+
	    	// so compress the x direction
	    	//then rotate to current rotation.

	    	//Again: first put offset on x axis
	    	var m = Matrix.Rotation(-oldRotation)
	    	//Then: compress x axis.
	    	m = Matrix.Diagonal([amount, 1]).multiply(m);
	    	//Finally: rotate to current position.
	    	m = Matrix.Rotation(newRotation).multiply(m);

	    	var transform = "matrix(" + m.e(1,1) + ", " + m.e(2,1) + ", " + m.e(1,2) + ", " + m.e(2,2) + ", 0, 0)";
	        this.object.style.webkitTransform = transform;
	        this.object.style.MozTransform = transform; 
	        this.object.currentRotation = radiansToDegrees(newRotation - oldRotation);
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
        var shouldFlip = !this.object.contains(mousePos);
        if (shouldFlip && !this.flipped && this.object.images) {
            doFlip(this.object, +1);
	    this.flipped = true;
        }
        else if (!shouldFlip && this.flipped && this.object.images) {
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
    object.style.left = point.e(1) - object.width / 2;
    object.style.top = point.e(2) - object.height / 2; 
}

function applyRelativePosition(object, vector) {
    var left = parseInt(object.style.left);
    var top = parseInt(object.style.top);
    object.style.left = left + vector.e(1);
    object.style.top = top + vector.e(2);
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
        applyAbsoluteRotation(this.object, newRotation, this.firstRotation);
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
    return Vector.create([parseInt(Math.random() * (window.innerWidth - 200) + 100),
                          parseInt(Math.random() * (window.innerHeight - 200) + 100)]);
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
    card = agnosticImage(card);
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
    pyramid = agnosticImage(pyramid);
    pyramid.baseZ = 200;
    throwRandomly(pyramid);
    document.getElementById("cards").appendChild(pyramid);
    return pyramid;
}

