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

var Pyramid = Game.Class({
	id: 'Pyramid',
	subclass: 'agImage',
	__init__: function(src) {
		agImage.apply(this);
	    this.e.src = src;
	    makeDraggable(this);
	    this.images = [src];
		this.baseZ = 200; //show above all cards.
	    this.throwRandomly();
	    this.display();
	}
});

Pyramid.createStash = new Array();
Pyramid.colors = "red green blue yellow purple orange".split(" ");
for (var c in Pyramid.colors) {
    var color = Pyramid.colors[c];
    Pyramid.createStash[color] = Game.Constructor({
	id: color + "Stash",
	category: "pyramids",
	priority: 1,
	html: '<img src="pyramid/'+color+'-pyramid.png" />',
	'color': color,
	action: function(game) {
	    for (var i = 0; i < 5; ++i) {
		game.create("Pyramid pyramid/"+this.color+"-pyramid.png");
		game.create("Pyramid pyramid/"+this.color+"-pyramid-medium.png");
		game.create("Pyramid pyramid/"+this.color+"-pyramid-small.png");
	    }
	}
    });
}


