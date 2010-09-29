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

function Main() {
	this.rsbp = new RSBP();
	this.game = new Game(this.rsbp.record);
	this.screen = new Screen(this.rsbp, this.game);
	//setInterval(Delegate(this, this.run), 1000);
	this.rsbp.start();
	this.run();
}
Main.prototype = {
	run: function() {
		setInterval(Events.handle, 100);
	}
}
