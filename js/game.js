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

function Game(/*optional*/ record) {
    if (!record) {record = new RSBP.Record();} 
    this.objects = new Object();
    this.record = record;
    this.record.attachCallback(this);
    this.nextId = 1;
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
		    debug(key);
		    this.create(data, key.slice(0, -7));
		} else {
		    var dpos = key.lastIndexOf('.');
		    var obj = this.objects[key.slice(0, dpos)];
		    obj.remote[key.slice(dpos + 1)].apply(obj, data.split(" "));
		}
    },
    outgoing: function(key, data) {
    	this.record.outgoing(key, data);
    },
    clear: function() {
		var backup = this.record.generate(true);
		for (var key in this.objects) {
		    this.remove(key);
		}
    },
    create: function(data, id) {
    	var adata = data.split(" ");
		var result = constructFromPrototype(Game.Class[adata[0]].prototype);
		result.id = id;
		if (!id)
		{
		    debug(id);
			result.id = this.getNextId();
			this.record.outgoing(result.id + '.create', data);
		}
		result.game = this;
		this.objects[result.id] = result;
		Game.Class[adata[0]].apply(result, adata.slice(1));
		!id && result.serialize && result.serialize();
		return result;
    },
    construct: function(data) {
    	var data = data.split(" ");
    	var key = data[0];
    	data.splice(0, 1, this);
    	return Game.Constructor[key].apply(null, data);
    },
    getNextId: function() {
    	return this.record.id + '.' + this.nextId++;
    },
    remote: {
		game: function(name) {
		    this.name = name;
		},
		'': function(data) {
		    if (data === null) {
		    	this.clear();
		    }
		}
    },
}
Game.Class = function(item) {
    Game.Class[item.name] = function(/*arguments*/) {
    	item.__init__.apply(this, arguments);
    };
    clone(item, Game.Class[item.name]);
	debug('classy');
    if (Game.Class[item.name].subclass) {
    	debug('set superclass');
    	var superclass = Game.Class[Game.Class[item.name].subclass];
    	var wcon = function() {};
    	wcon.prototype = superclass.prototype;
    	Game.Class[item.name].prototype = new wcon();
    	clone(item.prototype, Game.Class[item.name].prototype);
    	Game.Class[item.name].prototype.superclass = superclass;
    	debug(Game.Class[item.name].prototype.superclass);
    }
    debug(Game.Class[item.name]);
    return Game.Class[item.name];
}
Game.Constructor = function(arg) {
	Game.Constructor[arg.name] = arg.action;
	Game.Constructor[arg.name].name = arg.name;
	Game.Constructor[arg.name].category = arg.category;
	Game.Constructor[arg.name].priority = arg.priority;
	Game.Constructor[arg.name].html = arg.html;
	return Game.Constructor[arg.name];
}
