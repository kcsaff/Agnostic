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
		array[i].style.zIndex = i;
	}
}

var draggables = new Array();
var oneTime = 0;

function isPositionInBox(pos, obj) {
    pos = rotateAround(getObjectCenter(obj), pos, 
		       -degreesToRadians(obj.currentRotation))
    if (oneTime-- > 0) {
	    alert('x: ' + pos.x + ', y:' + pos.y +
		  ',\n l:' + obj.style.left + ', t:' + obj.style.top +
		  ',\n w:' + obj.width + ', h:' + obj.height +
		  ',\n tl:' + typeof obj.left + ', tt:' + typeof obj.top +
		  ',\n tw:' + typeof obj.width + ', th:' + typeof obj.height 
		  );
    }
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

function getRelativeRotation(center, first, last) { //in radians
    return Math.atan2(last.y  - center.y, last.x  - center.x) 
         - Math.atan2(first.y - center.y, first.x - center.x);
}

function getRelative(point1, point2) {
    return {x:point2.x - point1.x, 
	    y:point2.y - point1.y};
}

function applyRelative(point1, point2) {
    return {x:point2.x + point1.x, 
	    y:point2.y + point1.y};
}

function rotateAround(center, point, radians) {
    //alert("" + radians + " " + point);
    if (!radians) return point;
    //alert("hi");
    rel = getRelative(center, point);
    rotated_rel = {x:rel.x * Math.cos(radians) - rel.y * Math.sin(radians),
		   y:rel.x * Math.sin(radians) + rel.y * Math.cos(radians)};
    return applyRelative(center, rotated_rel);
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



function degreesToRadians(deg) {
	return Math.PI * 2 * deg / 360;
}

function radiansToDegrees(rad) {
	return rad * 360 / (Math.PI * 2);
}

function cleanupDegrees(deg) {
	deg = deg % 360;
	while (deg < 0) deg += 360;
	snapping = arguments[1] || 90;
	closeness = arguments[2] || 10;
	for (var snap=0; snap < 360; snap += snapping) {
		if (Math.abs(deg - snap) < closeness) deg = snap;
        }
        return deg;
}

function dragMove(object, event) {
    result = {};
    result.object = object;
    result.object.style.position = "absolute";
    result.mouseOffset = getMouseOffset(object, event);
    result.move = function (mousePos) {
        this.object.style.top = mousePos.y - this.mouseOffset.y;
        this.object.style.left = mousePos.x - this.mouseOffset.x;
        if (moveToEnd(draggables, this.object)) {
            fixZOrder(draggables);
        }
        return false;
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
        var shouldFlip = !isPositionInBox(mousePos, this.object);
        if (shouldFlip && !this.flipped && this.object.images) {
            ++this.object.image_index;
            this.object.image_index %= this.object.images.length;
            this.flipped = shouldFlip;
        }
        else if (false && !shouldFlip && this.flipped && this.object.images) {
            --this.object.image_index;
            this.object.image_index += this.object.images.length; //silly javascript    
            this.object.image_index %= this.object.images.length;
            this.flipped = shouldFlip;
        }
        this.object.src = this.object.images[this.object.image_index];
        return false; 
    }
    return result;
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
        this.object.currentRotation = cleanupDegrees(this.firstRotation 
                                                     + radiansToDegrees(newRotation));
        transform = "rotate(" + this.object.currentRotation + "deg)";
        this.object.style.webkitTransform = transform;
        this.object.style.MozTransform = transform;
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
	betterAction = null;
	return false;
}

function makeDraggable(item) {
	if (!item) return;
	item.onmousedown = function(ev) {
		if (getButton(ev) == 'left' && ev.shiftKey) {
			betterAction = dragArbitraryRotate(this, ev);
		} 
		else if (getButton(ev) == 'left' && ev.ctrlKey) {
			betterAction = dragFlip(this, ev);
		} 
		else if (getButton(ev) == 'left') {
			betterAction = dragMove(this, ev);
		} 
		if (betterAction) {
			mouseMove(ev);
		}
		return false;
	}
	draggables.push(item);
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
	card.src = front;
	document.getElementById("cards").appendChild(card);
	//document.getElementById("cards").onmousedown = mouseDown;
    return card;
}

