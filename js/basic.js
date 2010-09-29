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
	if (typeof(obj) == 'object') {
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
	} else if (typeof(obj) == 'array') {
		var result = new Array();
		result.push('[');
		for (var key in obj) {
			result.push(obj[key]);
			result.push(', ');
		}
		result.push(']');
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

function debug(text, refresh) {
    if (document.getElementById("debug")) {
        if (refresh != undefined && refresh) {
            document.getElementById("debug").innerHTML = str(text);
        } else {
            document.getElementById("debug").innerHTML += '<br />' + str(text);
        }
    }
}

function timestamp() {
	return (new Date()).getTime();
}

Vector.prototype.theta = function() {
    return Math.atan2(this.e(2), this.e(1));
}