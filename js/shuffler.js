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

var Shuffler = Game.Class({
	id: 'Shuffler',
	subclass: 'agImage',
	__init__: function() {
	    agImage.apply(this, ['div']);
	    this.isFlippable = false;
	    this.e.className = 'Shuffler';
	    this.e.innerHTML = '?';
	    this.baseZ = 1000;
	    this.e.onmousedown = Delegate(this, Shuffler.onmousedown);
	    this.throwRandomly();
	    this.setRotation(0, 0);
	    this.display();
	},
	prototype: {
	    checkAll: function() {
		for (var i in agImage.byOrder) {
		    var obj = agImage.byOrder[i];
		    this.checkContains(obj.center, obj);
		}
	    },
	    checkContains: function(point, object) {
		var contains = !!this.contains(point);
		if (contains && Math.random() < 0.142857) {
		    object.image_index = 1; object.flip(0);
		    object.move(Vector.create([Math.round(Math.random() * 6 - 3),
					       Math.round(Math.random() * 6 - 3)]));
		    object.moveToFront();
		    this.moveToFront();
		}
	    },
	    cleanUp: function() {
		this.contents = null;
		Events.removeContainer(this);
		agImage.cleanUp.apply(this);
	    }
	}
});

Shuffler.construct = Game.Constructor({
	id: "Shuffler",
	category: "tool",
	priority: 1,
	html: '<div class="Shuffler">?</div>',
	action: function(game, owner) {
		game.create('Shuffler');
	}
});


Shuffler.dragMove = function(object, event) {
    var result = {};
    result.object = object;
    result.lastPos = Mouse.getCoords(event);
    result.move = function (mousePos) {
	this.object.move(mousePos.subtract(this.lastPos));
        this.object.checkAll();
	this.lastPos = mousePos;
        return false;
    }
    return result;
}

Shuffler.onmousedown = function(ev) {
    if (Mouse.getButton(ev) == 'left') {
	Mouse.action = Shuffler.dragMove(this, ev);
    } 
    if (Mouse.action) {
	this.moveToFront();
	Mouse.move(ev);
    }
    return false;
}

