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
			this.e.className = 'UserArea';
		    if (this.game.player && username == this.game.player.username) {
			this.claim();
		    } 
		    this.e.innerHTML = username;
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
	    responseToLeftMouse: dragMoveAndRotate,
	    responseToMiddleMouse: dragFlip,
	    claim: function() {
		this.e.className = 'UserAreaClaimed';
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
		Events.removeContainer(this);
		agImage.prototype.cleanUp.apply(this);
	    }
	}
});

UserArea.construct = Game.Constructor({
	id: "userArea",
	category: "user",
	priority: 1,
	html: '<div class="UserAreaClaimed">User area</div>',
	action: function(game, owner) {
		game.create('UserArea', owner);
	}
});

