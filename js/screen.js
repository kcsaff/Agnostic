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

function Screen() {
	debug("Screen");
	this.lastConnected = null;
	this.dialogs = clone(Screen.dialogs);
	this.dialogs.start.active = true;
	this.currentDialog = null;
	this.joined = false;
	this.createDialog();
	this.display();
	Events.attach('ping', Delegate(this, Screen.events.ping));
	Events.attach('form', Delegate(this, Screen.events.form));
}
Screen.prototype = {
	createDialog: function() {
	    this.dialog = document.createElement("div");
	    this.dialog.id = "dialog";
	    this.dialog.style.position = "absolute";
	    this.dialog.style.background = "white";
	    this.dialog.style.opacity = 0.85;
	    this.dialog.style.zIndex = 10000;
	    this.dialog.style.left = 0;
	    this.dialog.style.top = 0;
	    this.dialog.width = window.innerWidth;
	    this.dialog.height = window.innerHeight;
	    this.dialog.style.minWidth = window.innerWidth;
	    this.dialog.style.minHeight = window.innerHeight;
	    this.dialog.style.display = 'none';
	    document.body.appendChild(this.dialog);
	    this.idialog = document.createElement("center");
	    this.idialog.id = "idialog";
	    this.idialog.style.position = "absolute";
	    this.idialog.style.zIndex = 10001;
	    this.idialog.style.top = (window.innerHeight / 2 - this.idialog.height / 2) + 'px';
	    this.idialog.width = window.innerWidth;
	    this.idialog.style.minWidth = window.innerWidth;
	    this.idialog.style.left = 0;
	    this.dialog.style.display = 'none';
	    document.body.appendChild(this.idialog);
	},
	showDialog: function() {
		this.dialog.style.display = 'block';
		this.idialog.style.display = 'block';
	    this.dialog.style.opacity = 0.85;
	},
	hideDialog: function() {
		this.dialog.style.display = 'none';
		this.idialog.style.display = 'none';
	},
	fadeDialog: function() {
		this.idialog.style.display = 'none';
		var opacity = parseFloat(this.dialog.style.opacity);
		opacity -= 0.03;
		if (opacity <= 0) {this.hideDialog(); return;}
		else {
			this.dialog.style.opacity = opacity;
			setTimeout(Delegate(this, this.fadeDialog), 40);
		}
	},
	isConnected: function() {
		return this.hasConnected() && this.getDisconnectionTime() < 5;
	},
	hasConnected: function() {
		return this.lastConnected != null;
	},
	getDisconnectionTime: function() {
		return (timestamp() - this.lastConnected) / 1000;
	},
	getActiveDialog: function() {
		var d = null;
		for (var i in this.dialogs) {
			if (this.dialogs[i].active && (!d
					|| (this.dialogs[i].priority > d.priority)) ) {
				debug(i + this.dialogs[i].active);
				d = this.dialogs[i];
			}
		}
		return d;
	},
	display: function() {
		var activeDialog = this.getActiveDialog();
		if (activeDialog === this.currentDialog) {
			this.applyMessages();
			return;
		}
		this.currentDialog = activeDialog;
		if (activeDialog == null) {
			this.fadeDialog(); return;
		}
		this.idialog.innerHTML = activeDialog.html;
		this.applyMessages();
		this.showDialog();
	},
	applyMessages: function() {
		for (var m in Screen.messages) {
			var el = document.getElementById(m);
			if (!el) {continue;}
			el.innerHTML = Screen.messages[m].apply(this);
		}
	},
	createButton: function(name) {
		var button = Screen.buttons[name];
		var result = new Array();
		result.push('<form>')
		if (button.label) {
			result.push('<label for="' + name + '">');
			result.push(button.label.replace(' ', '&nbsp;'));
			result.push('</label>')
		}
		result.push('<input type="button" value="');
		result.push(button.value);
		result.push('" id="' + name + '" onClick="Events.form(this, \'');
		result.push(name)
		result.push('\')" />')
		result.push('</form>')
		return result.join("");
	}
}
Screen.dialogs = {
	'start': {priority: 10, html:
'<div id="connection">Loading...</div>' +
'<div id="gameStatus"></div>'
	},
}
Screen.messages = {
	connection: function() {
		if (this.isConnected()) {
			return "Connected to default server.";
		} else if (this.hasConnected()) {
			return "Disconnected from default server"
            + " for " + this.getDisconnectionTime() + " seconds."
		} else {
			return "Connecting to default server...";
		}
	},
	gameStatus: function() {
		return this.createButton('startNewGame');
	},
}
Screen.events = {
	ping: function() {
		var wasConnected = this.isConnected();
		this.lastConnected = timestamp();
		if (!wasConnected) {
			this.display();
		}
	},
	form: function(event) {
		var key = event.args[1];
		debug('form' + key);
		if (Screen.buttons[key]) {
			Screen.buttons[key].action.apply(this, arguments);
		}
	},
}
Screen.buttons = {
	startNewGame: {
		label: "No game in progress:  ",
		value: "Start new game",
		action: function(form) {
			debug('startNewGame');
			this.dialogs.start.active = false;
			//debug(str(this.dialogs.start));
			this.display();
		}	
	},
}