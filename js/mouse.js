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