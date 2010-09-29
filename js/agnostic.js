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

var agImage = Game.Class({
	name: 'agImage',
	__init__: function(eltype) {
	    this.e = document.createElement(eltype || "img");
	    this.e.style.position = "absolute";
	    this.e.style.zIndex = 1;
	    this.baseZ = 0;
	},
	byName: new Object(),
	byOrder: new Array(),
	prototype: {
	    getLeft: function() {
	        return parseInt(this.e.style.left);
	    },
	    getRight: function() {
	        return parseInt(this.e.style.left) + this.e.width;
	    },
	    getTop: function() {
	        return parseInt(this.e.style.top);
	    },
	    getBottom: function() {
	        return parseInt(this.e.style.top) + this.e.height;
	    },
	    getCenter: function() {
	        return Vector.create([this.getLeft() + this.e.width / 2, 
	                              this.getTop() + this.e.height / 2])
	    },
	    contains: function(vector) {
	        vector = this.toLocalCoords(vector);
	        return (Math.abs(vector.e(1)) <= this.e.width / 2)
	            && (Math.abs(vector.e(2)) <= this.e.height / 2);
	    },
	    recenter: function(center) {
	        this.e.style.left = Math.round(center.e(1) - this.e.width / 2);
	        this.e.style.top = Math.round(center.e(2) - this.e.height / 2); 
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
		        this.image_index = parseInt(i || 0) % this.images.length;
		        this.e.src = this.images[this.image_index];
		        this.recenter(center);
		        this.setRotation(0, degrees);
		    },
	    },
	    flip: function(/*optional*/ amount) {
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
	    },
	    cleanUp: function() {
	        document.body.removeChild(this.e);
	    }
    },
});

function moveToEnd(array, item) {
        if (array.length < 1) return false;
        if (array[array.length - 1] === item) return false;
        var found = -1;
        for (var i = 0; i < array.length; ++i) {
                if (array[i] === item) {
                        found = i;
                        break;
                }
        }
        if (found == -1) return false;
        for (var i = found; i < array.length - 1; ++i) {
                array[i] = array[i + 1];
        }
        array[array.length - 1] = item;
        return true;
}

function fixZOrder(array) {
    for (var i in array) {
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
    return Vector.create([parseInt(Math.random() * (window.innerWidth - 200) + 100),
                          parseInt(Math.random() * (window.innerHeight - 200) + 100)]);
}
