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
	    responseToLeftMouse: Motion.dragMoveAndRotate,
	    responseToMiddleMouse: Motion.dragFlip,
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

