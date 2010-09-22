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

var Tarot = extend
(Card, 
 function(front, back, id) {
    Card.apply(this, arguments);
},
 {
 }
 );
Tarot.recreate = function(id, desc) {
    var images = desc.split(" ");
    return new Tarot(images[0], images[1], id);
}
registerClass(Tarot, "Tarot");


Tarot.createDeck = function() {
    var suits = "wa sw cu pe".split(" ");
    var ranks = "ac 02 03 04 05 06 07 08 09 10 pa kn qu ki".split(" ");
    for (var suit in suits) {
	for (var rank in ranks) {
	    new Tarot("tarot/" + suits[suit] + ranks[rank] + ".png",
		      "tarot/back.png");
	}
    }

    for (var i = 0; i < 22; ++i) {
	new Tarot("tarot/ar" + (i < 10 ? "0" + i : i) + ".png", "tarot/back.png");
    }
}

Tarot.createForm = function() {
    return '\
<br /><label for="wantTarotDeck"><img src="tarot/ar00.png" /></label><br />\
<input type="checkbox" name="item" id="wantTarotDeck" value="Tarot.createDeck()">\
Add a deck of tarot cards.</input><br />\
';
}