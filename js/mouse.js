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

var Mouse = new Object();
Mouse.action = null;
Mouse.getCoords = function (event) {
        if (event.pageX || event.pageY) {
                return Vector.create([event.pageX, event.pageY]);
        }
        return Vector.create([event.clientX + document.body.scrollLeft - document.body.clientLeft,
                              event.clientY + document.body.scrollTop - document.body.clientTop]);
}
function getPosition(e) {
    var left = 0; 
    var top  = 0; 
    while (e.offsetParent){ 
	left += e.offsetLeft; 
	top  += e.offsetTop; 
	e     = e.offsetParent; 
    } 
	 
    left += e.offsetLeft; 
    top  += e.offsetTop; 

    return Vector.create([left, top]); 
}
function setPosition(e, vector) {
    movePosition(e, vector.subtract(getPosition(e)));
}
function movePosition(e, movement) {
    e.style.left = numerize(e.style.left || 0) + movement.e(1);
    e.style.top = numerize(e.style.top || 0) + movement.e(2);
}
function getWindowCenter() {
    return Vector.create([window.innerWidth / 2, window.innerHeight / 2]);
}
//document.getElementById("main").__transform = Matrix.Diagonal([2, 2]);
Mouse.getOffset = function(ev, rel) {
    if (!rel) {rel = document.getElementById("main");}
    if (!rel) {return Mouse.getCoords(ev);}
    var raw = Mouse.getCoords(ev).subtract(getPosition(rel)); 
    if (!rel.__transform) {return raw;}
    return rel.__transform.inv().x(raw);
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
        var mousePos = Mouse.getOffset(ev);
        if (Mouse.action && Mouse.getButton(ev)) {
            var result = Mouse.action.move(mousePos, ev);
            if (Mouse.action.object) {
                Mouse.action.object.serialize();
            }
        }
}
Mouse.down = function(ev) {
    var main = document.getElementById("main");
    if (!main || Mouse.action) {return true;}
    if (Mouse.getButton(ev) == "left") {
	Mouse.action = Motion.rawMove(main, ev);
    }
    return false;
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
Mouse.getWheel = function(event) {
    var wheel = -event.detail || event.wheelData;
    if (wheel) {return (wheel > 0) ? "wheelup" : "wheeldown";}
}
Mouse.wheel = function(event) {
    var what = Mouse.getWheel(event);
    var obj = document.getElementById("main");
    if (!obj) {return;}
    if (!obj.__zoom) {obj.__zoom = 1;}
    var oldVec = getPosition(obj).subtract(getWindowCenter()).x(1 / obj.__zoom);
    if (what == "wheelup") {
	obj.__zoom *= 1.6;
    } else if (what == "wheeldown") {
	obj.__zoom /= 1.6;
    }
    if (obj.__zoom > 1) {
	obj.__zoom = Math.round(obj.__zoom);
    }
    if (obj.__zoom > 10) {obj.__zoom = 10;}
    if (obj.__zoom < 0.1) {obj.__zoom = 0.1;}
    var newVec = oldVec.x(obj.__zoom);
    setPosition(obj, getWindowCenter().add(newVec));
    obj.__transform = Matrix.Diagonal([obj.__zoom, obj.__zoom]);
    obj.style.MozTransform = "scale(" + obj.__zoom + ", " + obj.__zoom + ")";
}

document.onmousedown = Mouse.down;
document.onmousemove = Mouse.move;
document.onmouseup = Mouse.up;
document.onmousewheel = Mouse.wheel;

if (document.addEventListener) {
    document.addEventListener('DOMMouseScroll', Mouse.wheel, false);
    document.addEventListener('mousewheel', Mouse.wheel, false);
}
