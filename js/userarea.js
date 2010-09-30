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

var UserArea = Game.Class({
	id: 'UserArea',
	subclass: 'agImage',
	__init__: function(owner) {
		debug('userarea', owner);
		if (owner) {
		    var username = Game.User.decode(owner);
			agImage.apply(this, ["div"]);
			this.isFlippable = false;
			this.isClaimed = false;
		    this.e.style.minWidth = 300;
		    this.e.style.minHeight = 100;
		    if (this.game.player && username == this.game.player.username) {
			this.claim();
		    } else {
			this.e.style.background = "gray";
			this.e.style.opacity = 0.6;
		    }
		    this.e.style.top = 100;
		    this.e.style.left = 100;
		    this.e.style.borderStyle = 'dashed';
		    this.e.style.borderWidth = 'thick';
		    this.e.style.borderColor = 'black';
		    this.e.style.fontSize = '24pt';
		    this.e.style.fontFamily = 'monospace';
		    this.e.style.fontWeight = 'bold';
		    this.e.style.overflow = 'hidden';
		    this.e.innerHTML = username;
		    makeDraggable(this);
		    this.throwRandomly();
		    this.display();
		    this.game.users[username]['UserArea'] = this;
		} else {
			this.game.peruser['UserArea'] = ['username'];
			Events.put({type: 'peruser', cls: 'UserArea', args: ['username']});
			this.serialize = function() {};
		}
	},
	prototype: {
	    claim: function() {
		this.e.style.background = "yellow";
		this.e.style.opacity = 0.4;
		Events.addContainer(this);
		this.isClaimed = true;
	    },
	    recenter: function(center) {
		agImage.prototype.recenter.apply(this, [center]);
		if (!this.isClaimed) {return;}
		for (var i in agImage.byOrder) {
		    var obj = agImage.byOrder[i];
		    this.checkContains(obj.center, obj);
		}
	    },
	    checkContains: function(point, object) {
		var contains = !!this.contains(point);
		//only handle changes.
		if (contains == !!object.__fliphack) {return;}
		object.__fliphack = contains;
		object.images && object.images.reverse();
		object.flip(0);
	    },
	    cleanUp: function() {
		this.contents = null;
		Events.removeContainer(this);
		agImage.cleanUp.apply(this);
	    }
	}
});

UserArea.construct = Game.Constructor({
	id: "userArea",
	category: "user",
	priority: 1,
	html: 'USER AREA',
	action: function(game, owner) {
		game.create('UserArea', owner);
	}
});

