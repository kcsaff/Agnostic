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

function Game() {
    this.objects = new Object();
    this.pending = new Object();
    this.transaction = 0;
}
Game.prototype = {
    incoming: function(key, data, /*optional*/maintain_pending) {
        if (!this.pending[key]) {
            this.objects[key] = [this.transaction++, data];
            if (this === Game.client) {
            	handleIncoming(key, data);
            }
        } else if (!maintain_pending && this.objects[key][1] == data) {
            this.pending[key] = false;
        }
    },
    outgoing: function(key, data) {
        this.objects[key] = [this.transaction++, data];
        this.pending[key] = true;
    },
    join: function() {
        if (Game.client === Game.server) {return;}
        Game.changeClient(this, "you joined a game");
    },
    _join: function() {
        arr = new Array();
        for (var key in this.objects) {
            arr.push([this.objects[key], key]);
        }
        arr.sort(function(a,b){return a[0][0]-b[0][0];});        
        for (var i in arr) {
            this.incoming(arr[i][1], arr[i][0][1], true);
        }
    },
    generate: function(/*optional*/all) {
        var arr = new Array();
        for (var key in this.objects) {
            if (this.pending[key] || all) {
                arr.push([this.objects[key], key]);
            }
        }
        arr.sort(function(a,b){return a[0][0]-b[0][0];});
        var result = new Array();
        if (all) {
            result.push("..d-" + rsbp.id);
        }
        for (var i in arr) {
            result.push("..o" + arr[i][1] + "-" + arr[i][0][1]);
        }
        return result.join("");
    },
    upload: function() {
        Game.changeServer(this, "you uploaded a different game");
        rsbp.write(this.generate(true));
    },
    getId: function() {
        if (this.objects[''] && this.objects[''][1]) {
            return this.objects[''][1];
        } else {
            return (new Date()).getTime() + "?";
        }
    },
    ensureSaved: function(reason) {
        if (!Game.backups[this.getId()]) {
            Game.backups[this.getId()] = [reason, this.generate(true)];
        }
    },
    reset: function(reason) {
    	if (this === Game.server) {
    		Game.changeServer(null, reason || 'reset');
    		rsbp.write('..d-');
    	}
    	if (this === Game.client) {
    		Game.clearBoard();
    		Game.changeClient(null, reason || 'reset');
    	}
    	Game.apply(this);
    }
}
Game.create = function() {
    var game = new Game();
    game.outgoing('', (new Date()).getTime() );
    return game;
}
Game.backups = new Object();
Game.server = null;
Game.client = null;
Game.ensureSaved = function(game, reason) {
    if (!game) {return;}
    game.ensureSaved(reason);
}
Game.changeServer = function(game, reason) {
    if (game === Game.server) {return;}
	debug('change server ' + Game.server + ' to ' + game + ' by ' + reason)
    Game.ensureSaved(Game.server, reason);
    if (Game.server === Game.client) {
        demandConnectionScreen();
    }
    Game.server = game;
}
Game.changeClient = function(game, reason) {
    if (game === Game.client) {return;}
	debug('change client ' + Game.server + ' to ' + game + ' by ' + reason)
    Game.ensureSaved(Game.client, reason);

    Game.clearBoard();
    
    Game.client = game;
    game._join();
}
Game.clearBoard = function() {
    for (var i in agImage.byName) {
        var obj = agImage.byName[i];
        if (obj && obj.e && obj.e.parentNode) {
            obj.e.parentNode.removeChild(obj.e);
        }
    }
    agImage.byOrder = new Array();
    agImage.byName = new Object();  
}
Game.player = null;

function agnosticRSBP() {
    var rsbp = new Object();
    rsbp.last_transaction = 0;
    rsbp.loop = false;
    rsbp.written = new Array();
    rsbp.minimum_wait = 100;
    rsbp.initial_timeout = 250; //ms
    rsbp.maximum_timeout = 10000;
    rsbp.server = null;
    rsbp.first_connection = null;
    rsbp.last_connection = null;
    rsbp.unsent_data = null;
    rsbp.id = null;
    rsbp.isConnected = function() {
        return this.last_connection && (this.getDisconnectionTime() < 5.0);
    }
    rsbp.hasConnected = function() {
        return !!this.first_connection;
    }
    rsbp.getConnectionTime = function() {
        return ((new Date()).getTime() - this.first_connection) / 1e3;
    }
    rsbp.getDisconnectionTime = function() {
        return Math.round(((new Date()).getTime() - this.last_connection) / 1e3);
    }
    rsbp.apply = function(data) {
        var parts = data.split("..");
        for (var i = 1;/*ignore before first separator*/ i < parts.length; ++i) {
        	if (parts[i][0] == 'u') {
        		this.id = parts[i].slice(1);
        		continue;
        	}
            var ds1 = parts[i].indexOf("-");
            var meta = parts[i].slice(0, ds1);
            var payload = parts[i].slice(ds1 + 1);
            var ds2 = meta.search("[od]");
            var transaction = parseInt(meta.slice(1, ds2));
            this.last_transaction = transaction;
        	var objectName = meta.slice(ds2 + 1);
            if (meta[ds2] == 'd') {
            	if (!objectName) {
            		if (payload != this.id) {
            			Game.changeServer(null, payload || "connection was lost");
            		}
            	} else {
            		Game.server.remove(objectName, payload);
            	}
            } else if (meta[ds2] == 'o') {
            	if (!Game.server) {
            		safeAlert("Created new server game");
            		Game.changeServer(new Game(), "a game started");
            	}
                if (!Game.client) {
                    Game.client = Game.server;
                }
	            Game.server.incoming(objectName, payload);
            } else {
            	safeAlert("Unknown data type " + meta[ds2]);
            }
        }
        if (this.after) {
            this.after();
        }
        //alert(data);
    }
    rsbp.generate = function() {
        var result = this.written;
        this.written = new Array();
        if (Game.server) {
            result.push(Game.server.generate(false));
            result.push("..t" + this.last_transaction);
        } else {
            result.push("..t0");
        }
        result.push("\n");
        return result.join("");
    }
    rsbp.write = function(data) {
    	this.written.push(data);
    }
    rsbp.do_write = function(data) {
        var http = new XMLHttpRequest();
        var rsbp = this;
        data = data || this.unsent_data;
        this.unsent_data = data;
        http.open("POST", rsbp.server || "RSBP", true);
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        //http.setRequestHeader("Content-length", data.length);
        //http.setRequestHeader("Connection", "close");
        http.onreadystatechange = function() {
            if (http.readyState == 4) {
                if (http.status == 200) {
                    rsbp.unsent_data = null;
                    rsbp.timeout = null;
                    rsbp.last_connection = (new Date()).getTime();
                    if (!rsbp.first_connection) {
                        rsbp.first_connection = rsbp.last_connection;
                    }
                    //undemand("timeout");
                    rsbp.apply(http.responseText);
                    if (rsbp.loop) {
                        rsbp.poll_forever();
                    }
                } else {
                    var self = rsbp;
                    if (!self.timeout) {
                        self.timeout = self.initial_timeout;
                    }
                    else {
                        self.timeout *= 2;
                    }
                    if (self.timeout > self.maximum_timeout) {
                        self.timeout = self.maximum_timeout;
                        //demand("timeout", 100, "Connection lost.");
                    }
                    if (false && self.loop) {
                        setTimeout(function() {self.poll_forever();}, self.timeout);
                    }
                    else {
                        setTimeout(function() {self.do_write();}, self.timeout);
                    }
                }
            } 
        }
        http.send(data);
    }
    rsbp.poll = function() {
    	if (!this.id) {
    		this.do_write("..u\n");
    	} else {
    		this.do_write(this.generate(false));
    	}
    }
    rsbp.poll_forever = function() {
        this.loop = true;
        var self = this;
        setTimeout(function() {self.poll();}, this.minimum_wait);
    }
    return rsbp;
}

var rsbp = new agnosticRSBP();
