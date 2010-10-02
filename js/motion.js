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

function Motion() {}

Motion._dragMove = function(mousePos) {
    this.object.move(mousePos.subtract(this.lastPos));
    this.object.afterMove && this.object.afterMove();
    this.lastPos = mousePos;
    return false;
}
Motion.dragMove = function(object, event) {
    return {
	'object': object,
	'lastPos': Mouse.getCoords(event),
	'move': Motion._dragMove
    };
}
