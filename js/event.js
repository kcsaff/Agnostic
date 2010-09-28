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

function Events() {}
Events.queue = new Array();
Events.handlers = new Object();
Events.get = function() {return Events.queue.shift();}
Events.put = function(event) {Events.queue.push(event);}
Events.attach = function(type, handler) {
	if (!Events.handlers[type]) {Events.handlers[type] = new Array();}
	for (var i=0; i < Events.handlers[type].length; ++i) {
		if (Events.handlers[type][i] === handler) {return;}
	}
	Events.handlers[type].push(handler);
}
Events.detach = function(type, handler) {
	for (var i=Events.handlers[type].length; i > 0; --i) {
		if (Events.handlers[type][i - 1] === handler || !handler) {
			Events.handlers[type].splice(i, 1);
		}
	}
}
Events.handle = function(count) {
	if (count == null) {count = 100;}
	while (count-- > 0 && Events.queue.length > 0) {
		var event = Events.get();
		for (var i=0; i < Events.handlers[event['type']].length; ++i) {
			Events.handlers[event['type']][i](event);
		}
	}
}

Delegate = function(self, fun) {
	var _self = self;
	var _fun = fun;
	return function() {
		return _fun.apply(_self, arguments);
	};
}
