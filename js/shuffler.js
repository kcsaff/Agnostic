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
	    this.e.className = 'Shuffler';
	    this.e.innerHTML = '?';
	    this.baseZ = 1000;
	    this.throwRandomly();
	    this.setRotation(0, 0);
	    this.display();
	},
	prototype: {
	    responseToLeftMouse: Motion.dragMove,
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

var DiscardDeck = Game.Class({
	id: 'DiscardDeck',
	subclass: 'agImage',
	__init__: function(image_index) {
	    agImage.apply(this, ['div']);
	    this.image_index = parseInt(image_index) || 0;
	    this.contents = new Array();
	    this.showCount();
	    this.e.className = 'DiscardDeck';
	    this.throwRandomly();
	    this.setRotation(0, 0);
	    Events.addContainer(this);
	    this.display();
	},
	prototype: {
	    responseToLeftMouse: Motion.dragMove,
	    recenter: function(center) {
		for (var i in this.contents) {
		    var obj = this.game.objects[this.contents[i]];
		    obj.recenter(center);
		    obj.moveToFront();
		}
		agImage.prototype.recenter.apply(this, [center]);
	    },
	    serializeContents: function() {
	        this.game.outgoing(this.id + '.contents', this.contents.join(" "));
	    },
	    showCount: function() {
		if (this.contents.length) {
		    this.e.innerHTML = this.contents.length;
		} else {
		    this.e.innerHTML = this.image_index ? 'draw' : 'discard';
		}
	    },
	    pullIn: function(object) {
		object.image_index = this.image_index; object.flip(0);
		object.recenter(this.center);
		object.setRotation(this.getRotation());
		object.moveToFront();
		this.adjustOnMouseDown(object);
		this.contents.push(object.id);
		this.showCount();
	    },
	    checkContains: function(point, object, dropped) {
		if (!dropped || !this.contains(point)) {return;}
		this.pullIn(object);
		this.serializeContents();
	    },
	    cleanUp: function() {
		this.contents = null;
		Events.removeContainer(this);
		agImage.cleanUp.apply(this);
	    },
	    removeItem: function(obj) {
		removeFrom(this.contents, obj.id);
		this.showCount();
		this.serializeContents();
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
	    },
	    remote: {
		move: agImage.prototype.remote.move,
		contents: function(/*arguments*/) {
		    this.contents = new Array();
		    for (var i = 0; i < arguments.length; ++i) {
			arguments[i] && this.pullIn(this.game.objects[arguments[i]]);
		    }
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

DiscardDeck.drawDeck = Game.Constructor({
	id: "DrawDeck",
	category: "tool",
	priority: 1,
	html: '<div class="DiscardDeck">draw</div>',
	action: function(game, owner) {
		game.create('DiscardDeck 1');
	}
});

