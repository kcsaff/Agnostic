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
			agImage.apply(this, ["div"]);
			this.isFlippable = false;
		    this.e.style.minWidth = 300;
		    this.e.style.minHeight = 100;
		    this.e.style.background = "gray";
		    this.e.style.opacity = 0.6;
		    this.e.style.top = 100;
		    this.e.style.left = 100;
		    this.e.style.borderStyle = 'dashed';
		    this.e.style.borderWidth = 'thick';
		    this.e.style.borderColor = 'black';
		    this.e.style.fontSize = '24pt';
		    this.e.style.fontFamily = 'monospace';
		    this.e.style.fontWeight = 'bold';
		    this.e.style.overflow = 'hidden';
		    this.e.innerHTML = Game.User.decode(owner);
		    makeDraggable(this);
		    this.throwRandomly();
		    this.display();
		    
		    var f = document.createElement('div');
		    f.style.minWidth = 80;
		    f.style.minHeight = 80;
		    f.style.background = "red";
		    f.style.opacity = 1;
		    f.style.position = 'absolute';
		    f.style.top = -3;
		    f.style.left = 10;
		    f.style.MozTransform = 'rotate(20deg)';
		    this.e.appendChild(f);
		    
		} else {
			this.game.peruser['UserArea'] = ['username'];
			Events.put({type: 'peruser', cls: 'UserArea', args: ['username']});
			this.serialize = function() {};
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

