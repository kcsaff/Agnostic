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

var Card = Game.Class({
	id: 'Card',
	subclass: 'agImage',
	__init__: function(front, back) {
		agImage.apply(this);
	    this.e.src = front;
	    this.images = [front, back];
	    this.throwRandomly();
		this.isFlippable = true;
	    if (Math.random() < 0.33) {
	    	this.flip();
	    }
	    this.display();
	},
	prototype: {
	    responseToLeftMouse: function(event) {
		return dragMoveAndRotate(this, event);
	    },
	    responseToMiddleMouse: function(event) {
		return dragFlip(this, event);
	    }
	}
});

Card.createDeck = Game.Constructor({
	id: "standardDeck",
	category: "cards",
	priority: 1,
	html: '<img src="card/spades-a-75.png" />',
	action: function(game, jokers) {
		var jokers = parseInt(jokers);
	    var suits = "clubs diamonds hearts spades".split(" ");
	    var ranks = "a 2 3 4 5 6 7 8 9 10 j q k".split(" ");
	    for (var suit in suits) {
			for (var rank in ranks) {
			    game.create("Card card/"+suits[suit]+"-"+ranks[rank]+"-75.png" +
				       " card/back-blue-75-1.png");
			}
	    }
	    if (jokers && jokers >= 1) {
	    	game.create("Card card/joker-r-75.png card/back-blue-75-1.png");
	    }
	    if (jokers && jokers >= 2) {
	    	game.create("Card card/joker-b-75.png card/back-blue-75-1.png");
	    }
	}
});


function dragArbitraryRotate(object, event) {
    var result = {};
    result.object = object;
    result.mouseFirstPos = Mouse.getCoords(event);
    result.firstRotation = object.currentRotation || 0;
    result.move = function (mousePos) {
        newRotation = getRelativeRotation(this.object.getCenter(),
                                          this.mouseFirstPos,
                                          mousePos);
        this.object.setRotation(newRotation, this.firstRotation);
        //snapRotation(this.object, 90, 10);
        return false;
    }
    return result;
}

function doDragMoveAndRotate(mousePos) {
        var thisTime = (new Date()).getTime();
	if (Math.abs(this.offset.e(1)) < this.object.width / 4
	        && Math.abs(this.offset.e(2)) < this.object.height / 4) {//move only
	    this.object.move(mousePos.subtract(this.lastPos));
	} else {
            this.velocity = mousePos.subtract(this.lastPos).x(1 / (thisTime - this.lastTime))
              || Vector.Zero(2);
            var inVelocity = (this.lastPos.distanceFrom(this.object.getCenter()) 
			      - mousePos.distanceFrom(this.object.getCenter())) 
                              / (thisTime - this.lastTime) || 0;
	    var oldCenter = this.object.getCenter();
    	    var oldRotation = getAbsoluteRotation(Vector.Zero(2), this.offset)
    	    var amount = mousePos.distanceFrom(oldCenter) / this.offset.modulus();
	    var newRotation = getAbsoluteRotation(oldCenter, mousePos);
	    if (!this.object.isFlippable || amount >= 1 || (!this.x && inVelocity < 0.25)) {
		    this.object.setRotation(newRotation - oldRotation);
		    var newRelativePoint = this.offset.rotate(newRotation - oldRotation, Vector.Zero(2)); 
		    newCenter = mousePos.subtract(newRelativePoint);
		    this.object.recenter(newCenter);
                    this.x = null; this.y = null;
	    } else if (true) {
		//First create temporary information needed for flipping.
		if (!this.x || !this.y) {
		    this.x = Vector.create([Math.cos(this.object.getRotation()),
					    Math.sin(this.object.getRotation()), 0]);
		    this.y = Vector.create([-Math.sin(this.object.getRotation()),
					     Math.cos(this.object.getRotation()), 0]);
		}
		if (!this.object.points) {
		    this.object.points = new Array();
		    this.object.points.push(Vector.create([-this.object.width / 2,
						           -this.object.height / 2]));
		    this.object.points.push(Vector.create([+this.object.width / 2,
						           -this.object.height / 2]));
		    this.object.points.push(Vector.create([-this.object.width / 2,
						           +this.object.height / 2]));
		    this.object.points.push(Vector.create([+this.object.width / 2,
						           +this.object.height / 2]));
		}
		/*
		  First determine which point we want to rotate around.  This should
		  be biased towards the card's lowest point (most negative z), but
		  if the card is fairly level we want it to be the center.  So we
		  perform an average weighted by -z.
		 */
		var tot = 0;
		var cor = Vector.Zero(2); //center of rotation	  
		for (var i = 0; i < this.object.points.length; ++i) {
		    var z = this.x.x(this.object.points[i].e(1)).add(
                            this.y.x(this.object.points[i].e(2))    ).e(3);
		    var weight = Math.exp(-z / 30.0); // 30.0 found experimentally decent.
		    cor = cor.add(this.object.points[i].x(weight));
		    tot += weight;
		}
		cor = cor.x(1.0 / tot); //Finally have center of rotation in relative coords.
		//cor = this.object.points[3];
		/*
		  Now figure out both old and new 3D vectors of the grabbed point with respect
		  to the point to rotate around.  This is easily done.  We know the total distance,
		  and the x and y offsets, so we only need to calculate the z.  We know the z is
                  positive since it is higher.
		 */
                var absCor = this.object.toGlobalCoords(cor);
		var old2D = this.lastPos.subtract(absCor);
		var new2D = mousePos.subtract(absCor);
		var distance = cor.distanceFrom(this.offset);
		var old3D = Vector.create([old2D.e(1), old2D.e(2),
                                           Math.sqrt(distance * distance
                                                     -old2D.modulus() * old2D.modulus()) || 0]);
		var new3D = Vector.create([new2D.e(1), new2D.e(2),
                                           Math.sqrt(distance * distance
                                                     -new2D.modulus() * new2D.modulus()) || 0]);
                /*
                  The cross product of these is the axis of rotation.  Rotate the "x" and "y"
                  vectors around it in the specified angle (arcsin of the length).
                 */
                old3D = old3D.toUnitVector();
                new3D = new3D.toUnitVector();
                var cp = old3D.cross(new3D);
                var angle = Math.asin(cp.modulus());
                var axis = Line.create([0,0], cp);
                if (axis) {//axis usually ok, might be invalid for some math reasons
                    this.x = this.x.rotate(angle, axis);
                    this.y = this.y.rotate(angle, axis);
                }
                /*
                  Then recalculate center based on new rotation so stuck point doesn't move.
                 */
                var m = Matrix.create([[this.x.e(1), this.y.e(1)],
                                       [this.x.e(2), this.y.e(2)]]);
                if (m.determinant() < 0) {
                    this.x = this.x.x(-1);
                    this.offset = Vector.create([-this.offset.e(1), this.offset.e(2)]);
                    m = Matrix.create([[this.x.e(1), this.y.e(1)],
                                       [this.x.e(2), this.y.e(2)]]);
                    this.object.flip();
                }
                this.object.currentRotation = radiansToDegrees(newRotation - oldRotation);
                this.object.setTransformation(m);
                var newPos = this.object.toGlobalCoords(this.offset);
		this.object.move(mousePos.subtract(newPos));
	    }
	  }
	this.lastTime = thisTime;
      this.lastPos = mousePos;
      return false;
}

function dragMoveAndRotate(object, event) {
    var result = {};
    result.object = object;
    object.width, object.height;//firefox workaround??
    result.offset = object.toLocalCoords(Mouse.getCoords(event));
    result.lastPos = Mouse.getCoords(event);
    result.move = doDragMoveAndRotate;
    result.drop = function () {
	snapRotation(this.object, 90, 12);
	Events.checkContainer(this.object.getCenter(), this.object, true);
    }
    return result;
}


function dragFlip(object, event) {
    var result = {};
    result.object = object;
    result.object.image_index = result.object.image_index || 0;
    result.flipped = false;
    result.move = function (mousePos) {
        var shouldFlip = !this.object.contains(mousePos);
        if (shouldFlip && !this.flipped && this.object.images) {
            this.object.flip(+1);
	    this.flipped = true;
        }
        else if (false && !shouldFlip && this.flipped && this.object.images) {
            this.object.flip(-1);
	    this.flipped = false;
        }
        return false; 
    }
    return result;
}

function makeDraggable(item) {
	if (!item) return;
	item.e.onmousedown = Delegate(item, Card.onmousedown);
}
