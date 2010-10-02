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

//Stolen from:
//http://www.lshift.net/blog/2006/08/03/subclassing-in-javascript-part-2

function clone(from, /*optional*/ to) {
	if (!to) {to = new Object();}
	for (var k in from) {
		to[k] = from[k];
	}
	return to;
}

function constructFromPrototype(prototype) {
    var wc = function() {};
    wc.prototype = prototype;
    return new wc();
}

function extend(superclass, constructor, prototype) {
    constructor.prototype = constructFromPrototype(superclass.prototype);
    clone(prototype, constructor.prototype);
    return constructor;
}


var safeAlertCount = 5;
function safeAlert(text, /*optional*/ignored) {
    if (text != ignored && safeAlertCount-- > 0) {
        alert(text);
    }
}

function str(obj) {
	if (obj === undefined) {
		return '[undefined]';
	} else if (obj === null) {
		return '[null]';
	} else if (typeof(obj) == "string") {
	    return obj;
	} else if (obj.length !== undefined) {
		var result = new Array();
		result.push('[');
		for (var i = 0; i < obj.length; ++i) {
			result.push(obj[i]);
			result.push(', ');
		}
		result.push(']');
		return result.join('');
	} else if (typeof(obj) == 'object') {
		var result = new Array();
		result.push('{');
		for (var key in obj) {
			result.push(key);
			result.push(': ');
			try {result.push(obj[key]);}
			catch(e) {result.push('--Error--');}
			result.push(', ');
		}
		result.push('}');
		return result.join('');
	} else {
		return String(obj);
	}
}

function len(obj) {
	var result = 0;
	for (var i in obj) {++result;}
	return result;
}

function isEmpty(obj) {
	for (var i in obj) {return false;}
	return true;
}

function indexOf(obj, item) {
	for (var i in obj) {
		if (obj[i] == item) {
			return i;
		}
	}
	return null;
}

function removeFrom(obj, item) {
    var index = indexOf(obj, item);
    if (index != null) {
	obj.splice(index, 1);
    }
}

function shuffle(array) {//fisher yates to the rescue.
    for (var i = array.length; i > 0; --i) {
	var j = Math.floor(Math.random() * i);
	var temp = array[i-1];
	array[i-1] = array[j];
	array[j] = temp;
    }
}

function l33t(s) {
	var r = s;
	r = r.replace('i', '!');
	r = r.replace('l', '1');
	r = r.replace('e', '3');
	r = r.replace('a', '4');
	r = r.replace('w', 'vv');
	r = r.replace('m', '|v|');
	r = r.replace('t', '7');
	r = r.replace('x', '><');
	return r;
}

function capitalizeEveryOther(s) {
	var r = s;
	for (var i = 1; i < r.length; i += 2) {
		r = r.slice(0, i) + r[i].toUpperCase() + r.slice(i + 1);
	}
	return r;
}

randomUsername = function() {
	var qualities = 'ice fire rain dark night lucky lefty shiny moon dire were jelly gnarl heat flying spider turkey'.split(' ');
	var animals = 'fox squirrel lizard bird wolf monkey quail fish cat cow goat bat beaver chicken elk mouse ox tortoise toad'.split(' ');
	var quality = qualities[Math.floor(Math.random() * qualities.length)];
	var animal = animals[Math.floor(Math.random() * animals.length)];
	if (Math.random() < 0.1) {
		quality = l33t(quality);
	}
	if (Math.random() < 0.1) {
		animal = l33t(animal);
	}
	if (Math.random() < 0.2) {
		return quality + animal;
	} else if (Math.random() < 0.3) {
		return capitalizeEveryOther(quality + animal);
	} else if (Math.random() < 0.4) {
		return quality + animal.toUpperCase();
	} else if (Math.random() < 0.5) {
		return 'xx.' + quality + '.' + animal + '.xx';
	} else if (Math.random() < 0.6) {
		return '_-=' + quality+animal + '=-_';
	} else if (Math.random() < 0.7) {
		return '.oOo.' + (quality+animal).toUpperCase() + '.oOo.';
	} else if (Math.random() < 0.8) {
		return animal + ' of ' + quality;
	} else if (Math.random() < 0.9) {
		return quality + ' ' + animal;
	} else {
		return 'Mr. Gyroscope :(';
	}
}

function debug() {
	var result = new Array();
	for (var i=0; i < arguments.length; ++i) {
		result.push(str(arguments[i]));
	}
    if (document.getElementById("debug")) {
        document.getElementById("debug").innerHTML += '<br />' + result.join(', ');
    }
}

function timestamp() {
	return (new Date()).getTime();
}

Vector.prototype.theta = function() {
    return Math.atan2(this.e(2), this.e(1));
}

//for (var i = 0; i < 100; ++i) {debug(randomUsername());}

Delegate = function(self, fun) {
	var _self = self;
	var _fun = fun;
	return function() {
		return _fun.apply(_self, arguments);
	};
}
