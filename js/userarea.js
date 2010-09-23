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

var UserArea = extend
(agImage, 
 function(username, id) {
    agImage.apply(this, ["div"]);
    this.e.style.minWidth = 300;
    this.e.style.minHeight = 100;
    this.e.style.background = "black";
    makeDraggable(this);
    this.throwRandomly();
    this.finalize(id, username);
},
 {
 }
 );
UserArea.recreate = function(id, desc) {
    return new UserArea(desc, id);
}
registerClass(UserArea, "UserArea");

UserArea.createForm = function() {
    return '<label for="wantUserArea">USER AREA</label><br />\
<input type="checkbox" name="item" id="wantUserArea" value="User.require(\'UserArea\')">\
Add a user-private area.</input>';
}
