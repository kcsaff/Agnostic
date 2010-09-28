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

function Game(/*optional*/ record, screen) {
    if (!record) {record = new RSBP.Record();} 
    if (!screen) {screen = null;}
    this.connection = connection;
    this.screen = screen;
    this.objects = new Object();
    this.record = record;
    this.record.attachCallback(this);
}
Game.prototype = {
    remove: function(key) {
	if (this.objects[key]) {
	    this.objects[key].cleanUp();
	    delete this.objects[key];
	}
    },
    incoming: function(key, data) {
	if (this.remote[key]) {
	    this.remote[key].call(this, data);
	} else if (data === null) {
	    this.remove(key);
	} else if (key.slice(-7) == '.create') {
	    this.create(key.slice(0, -7), data);
	} else {
	    var dpos = key.lastIndexOf('.');
	    var obj = this.objects[key.slice(0, dpos)];
	    obj.remote[key.slice(dpos + 1)].apply(obj, data.split(" "));
	}
    },
    create: function(key, data) {
	var sPos = data.indexOf(" ");
	var className = data.slice(0, sPos);
	var params = data.slice(sPos + 1).split(" ");
	params.unshift(key);
	params.unshift(this);
	var result = new Object();
	Game.Class[className].apply(result, params);
	this.objects[key] = result;
	return result;
    },
    remote: {
	game: function(name) {
	    this.name = name;
	},
	'': function(data) {
	    if (data === null) {
		var backup = this.record.generate(true);
		for (var key in this.objects) {
		    this.remove(key);
		}
	    }
	}
    },
}
Game.Class = function(name, constructor, prototype) {
    Game.Class[name] = function() {
	var args = arguments;
	this.game = args.shift();
	this.id = args.shift();
	this.__class__ = name;
	constructor.apply(this, arguments);
    }
    Game.Class[name].prototype = prototype;
    return Game.Class[name];
}
			  