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

function numerize(value) {
	if (typeof (value) == 'number') {return value;}
	var result = parseInt(value);
	if (result != NaN) {return result;}
	return parseInt(value.slice(0, -2)); //get rid of px
}

var agImage = Game.Class({
	id: 'agImage',
	__init__: function(eltype) {
	    this.e = document.createElement(eltype || "img");
	    this.e.style.position = "absolute";
	    this.e.style.zIndex = 1;
	    this.e.onload = Delegate(this, agImage.onload);
	    this.baseZ = 0;
	    this.center = Vector.Zero(2);
	    this.width = 0;
	    this.height = 0;
	    this.isFlippable = true;
	},
	byName: new Object(),
	byOrder: new Array(),
	prototype: {
	    getLeft: function() {
	        return numerize(this.e.style.left);
	    },
	    getRight: function() {
	        return numerize(this.e.style.left) + this.width;
	    },
	    getTop: function() {
	        return numerize(this.e.style.top);
	    },
	    getBottom: function() {
	        return numerize(this.e.style.top) + this.height;
	    },
	    getCenter: function() {
	        return Vector.create([this.getLeft() + this.width / 2, 
	                              this.getTop() + this.height / 2])
	    },
	    contains: function(vector) {
	        vector = this.toLocalCoords(vector);
	        return (Math.abs(vector.e(1)) <= this.width / 2)
	            && (Math.abs(vector.e(2)) <= this.height / 2);
	    },
	    recenter: function(center) {
	        this.e.style.left = Math.round(center.e(1) - this.width / 2);
	        this.e.style.top = Math.round(center.e(2) - this.height / 2); 
	    },
	    serialize:function() {
	        var center = this.getCenter();
	        this.game.outgoing(this.id + '.move',
	                            "" + Math.round(center.e(1)) + " " + Math.round(center.e(2)) + " " 
	                            + Math.round(this.currentRotation || 0) + " "
	                            + (this.image_index || 0));
	    },
	    throwRandomly: function() {
	        this.recenter(randomLocation());
	        this.setRotation(0, Math.random() * 360);
	    },
	    setRotation: function(radians, degrees) {
	        this.currentRotation = cleanupDegrees((degrees || 0) 
	                                              + radiansToDegrees(radians));
	        var transform = "rotate(" + this.currentRotation + "deg)";
	        this.e.style.webkitTransform = transform;
	        this.e.style.MozTransform = transform;
	        this.currentTransformation = Matrix.Rotation(degreesToRadians(this.currentRotation));
	    },
	    getRotation: function() {
	        return degreesToRadians(this.currentRotation || 0);
	    },
	    rotate: function(radians) {
	        this.setRotation(radians, this.currentRotation || 0);
	    },
	    move: function(vector) {
	        this.recenter(this.getCenter().add(vector));
	    },
	    moveToFront: function() {
	        if (moveToEnd(agImage.byOrder, this)) {
	            fixZOrder(agImage.byOrder);
	        } 
	    },
	    remote: {
			move: function(x, y, theta, i) {
			        this.moveToFront();
			        var center = Vector.create([parseFloat(x), parseFloat(y)]);
			        var degrees = parseFloat(theta);
			        if (this.images) {
			        	this.image_index = parseInt(i || 0) % this.images.length;
				        this.e.src = this.images[this.image_index];
			        } else {
			        	this.image_index = 0;
			        }
			        this.recenter(center);
			        this.setRotation(0, degrees);
		    },
	    },
	    flip: function(/*optional*/ amount) {
	    	if (!this.images) {return;}
	        this.image_index = (this.image_index || 0) + ((amount == undefined) ? 1 : amount);
	        this.image_index %= this.images.length;
	        if (this.image_index < 0) {
	            this.image_index += this.images.length;
	        }
	        this.e.src = this.images[this.image_index];
	    },
	    setTransformation: function(m) {
	            var transform = "matrix(" + m.e(1,1) + ", " + m.e(2,1) + ", " 
	                                  + m.e(1,2) + ", " + m.e(2,2) + ", 0, 0)";
	        this.e.style.webkitTransform = transform;
	        this.e.style.MozTransform = transform; 
	        this.currentTransformation = m;
	    },
	    getTransformation: function() {
	        return this.currentTransformation || Matrix.I(2);
	    },
	    toLocalCoords: function(globalCoords) {
	        return this.getTransformation().inv().x(globalCoords.subtract(this.getCenter()));
	    },
	    toGlobalCoords: function(localCoords) {
	        return this.getTransformation().x(localCoords).add(this.getCenter());
	    },
	    display: function() {
	        document.body.appendChild(this.e);
	        this.width = this.e.width || numerize(this.e.style.minWidth) || 0;
	        this.height = this.e.height || numerize(this.e.style.minHeight) || 0;
	    },
	    cleanUp: function() {
	        document.body.removeChild(this.e);
	    }
    },
});
agImage.onload = function() {
	var oldWidth = this.width;
	var oldHeight = this.height;
	this.width = this.width || numerize(this.e.width);
	this.height = this.height || numerize(this.e.height);
	this.e.style.top = numerize(this.e.style.top) + (oldHeight - this.height) / 2;
	this.e.style.left = numerize(this.e.style.left) + (oldWidth - this.width) / 2;
}

function moveToEnd(array, item) {
        if (array.length && array[array.length - 1] === item) return false;
        var found = -1;
        for (var i = 0; i < array.length; ++i) {
                if (array[i] === item) {
                        found = i;
                        break;
                }
        }
        if (found == -1) {
	    array.push(item);
	    return true;
	}
        for (var i = found; i < array.length - 1; ++i) {
                array[i] = array[i + 1];
        }
        array[array.length - 1] = item;
        return true;
}

function fixZOrder(array) {
    for (var i=0; i < array.length; ++i) {
        array[i].e.style.zIndex = (array[i].baseZ || 0) + i;
    }
}

function getRotation(vector) {//in radians
        return Math.atan2(vector.e(2), vector.e(1));
}
function getAbsoluteRotation(center, point) { //in radians
    return getRotation(point.subtract(center));
}
function getRelativeRotation(center, first, last) { //in radians
    return getAbsoluteRotation(center, last) - getAbsoluteRotation(center, first);
}
function degreesToRadians(deg) {
        return Math.PI * 2 * deg / 360;
}
function radiansToDegrees(rad) {
        return rad * 360 / (Math.PI * 2);
}
function cleanupDegrees(deg) {
        deg = deg % 360;
        while (deg < 0) deg += 360;
        return deg;
}
function snapDegrees(deg, increment, closeness) {
    for (var snap=0; snap < 360 + increment; snap += increment) {
        if (Math.abs(deg - snap) < closeness) deg = snap;
    }
    return deg % 360;
}
function snapRotation(object, increment, closeness) {
    object.setRotation(0, snapDegrees(object.currentRotation || 0, 
                                                 increment, closeness));
}

function randomLocation() {
    return Vector.create([Math.floor(Math.random() * (window.innerWidth - 200) + 100),
                          Math.floor(Math.random() * (window.innerHeight - 200) + 100)]);
}
