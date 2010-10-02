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

Shuffler.onmousedown = function(ev) {
    if (Mouse.getButton(ev) == 'left') {
	Mouse.action = Motion.dragMove(this, ev);
    } 
    if (Mouse.action) {
	this.moveToFront();
	Mouse.move(ev);
    }
    return false;
}

var DiscardDeck = Game.Class({
	id: 'DiscardDeck',
	subclass: 'agImage',
	__init__: function() {
	    agImage.apply(this, ['div']);
	    //this.contents = new Array();
	    this.count = 0;
	    this.isFlippable = false;
	    this.e.className = 'DiscardDeck';
	    this.e.innerHTML = 'discard';
	    this.e.onmousedown = Delegate(this, Shuffler.onmousedown);	
	    this.baseZ = -1000;
	    this.f = new agImage('div');
	    this.f.e.className = 'DiscardDeckNum';
	    this.f.e.innerHTML = "0";
	    this.f.baseZ = 4000;
	    this.f.e.onmousedown = this.e.onmousedown;	
	    this.throwRandomly();
	    this.setRotation(0, 0);
	    Events.addContainer(this);
	    this.display();
	    this.f.display();
	},
	prototype: {
	    recenter: function(center) {
		agImage.prototype.recenter.apply(this, [center]);
		this.f.recenter(center);
	    },
	    checkContains: function(point, object, dropped) {
		if (!dropped || !this.contains(point)) {return;}
		object.image_index = 0; object.flip(0);
		object.recenter(this.center);
		object.setRotation(this.getRotation());
		this.adjustOnMouseDown(object);
		this.f.e.innerHTML = ++this.count;
	    },
	    cleanUp: function() {
		Events.removeContainer(this);
		agImage.cleanUp.apply(this);
	    },
	    removeItem: function(obj) {
		this.f.e.innerHTML = --this.count;
	    },
	    adjustOnMouseDown: function(object) {
		var onmousedown = object.e.onmousedown;
		var self = this;
		var obj = object;
		object.e.onmousedown = function() {
		    self.removeItem(obj);
		    this.onmousedown = onmousedown;
		    return onmousedown.apply(this, arguments);
		}
	    }
	}
});

DiscardDeck.construct = Game.Constructor({
	id: "DiscardDeck",
	category: "tool",
	priority: 1,
	html: '<div class="DiscardDeck">discard</div>',
	action: function(game, owner) {
		game.create('DiscardDeck');
	}
});

DiscardDeck.onmousedown = Shuffler.onmousedown;

