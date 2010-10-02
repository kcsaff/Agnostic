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
function _getPosition(e) {
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
document.getElementById("main").__transform = Matrix.Diagonal([2, 2]);
Mouse.getOffset = function(ev, rel) {
    if (!rel) {rel = document.getElementById("main");}
    if (!rel) {return Mouse.getCoords(ev);}
    var raw = Mouse.getCoords(ev).subtract(_getPosition(rel)); 
    if (!rel.__transform) {return raw;}
    return rel.__transform.x(raw);
}
Mouse._bwhich = [0, 'left', 'middle', 'right']; //most
Mouse._bbutton = ['left', 'left', 'right', 0, 'middle']; //IE
Mouse.getButton = function(event) {
    var wheel = -event.detail || event.wheelData;
    if (wheel) {return (wheel > 0) ? "scrollup" : "scrolldown";}
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
    return true;
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
document.onmousedown = Mouse.down;
document.onmousemove = Mouse.move;
document.onmouseup = Mouse.up;