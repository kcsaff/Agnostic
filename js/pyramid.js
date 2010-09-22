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


var Pyramid = extend
(agImage, 
 function(src, id) {
    agImage.apply(this);
    this.e.src = src;
    makeDraggable(this);
    this.images = [src];
    this.baseZ = 200; //show above all cards.
    this.throwRandomly();
    if (Math.random() < 0.33) {
    	this.flip();
    }
    this.finalize(id, src);
},
 {
 }
 );
Pyramid.recreate = function(id, desc) {
    return new Pyramid(desc, id);
}
registerClass(Pyramid, "Pyramid");

Pyramid.createStash = function(color) {
    for (var i = 0; i < 5; ++i) {
	new Pyramid("pyramid/" + color + "-pyramid.png");
	new Pyramid("pyramid/" + color + "-pyramid-medium.png");
	new Pyramid("pyramid/" + color + "-pyramid-small.png");
    }
}

Pyramid.createStashes = function(color) {
    var colors = "red yellow green blue".split(" ");
    for (var i in colors) {
	Pyramid.createStash(colors[i]);
    }
}
