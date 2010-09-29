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

function RSBP(server) {
    this.last_transaction = 0;
    this.isRunning = false;
    this.written = new Array();
    this.minimum_wait = 100;
    this.initial_timeout = 250; //ms
    this.maximum_timeout = 10000;
    this.server = server || "RSBP";
    this.first_connection = null;
    this.last_connection = null;
    this.unsent_data = null;
    this.id = null;
    this.record = new RSBP.Record();
}
RSBP.prototype = {
    isConnected: function() {
        return this.last_connection && (this.getDisconnectionTime() < 5.0);
    },
    hasConnected: function() {
        return !!this.first_connection;
    },
    getConnectionTime: function() {
        return ((new Date()).getTime() - this.first_connection) / 1e3;
    },
    getDisconnectionTime: function() {
        return Math.round(((new Date()).getTime() - this.last_connection) / 1e3);
    },
    apply: function(data) {
        var parts = data.split("..");
        for (var i = 1;/*ignore before first separator*/ i < parts.length; ++i) {
            if (parts[i][0] == 'u') {
	        	this.id = parts[i].slice(1);
	        	this.record.id = this.id;
            	debug('got id! ' + this.id);
	        	continue;
            }
            var ds1 = parts[i].indexOf("-");
            var meta = parts[i].slice(0, ds1);
            var payload = parts[i].slice(ds1 + 1);
            var ds2 = meta.search("[od]");
            var transaction = parseInt(meta.slice(1, ds2));
            this.last_transaction = transaction;
            var objectId = meta.slice(ds2 + 1);
            if (meta[ds2] == 'd') {
                if (payload == this.id) {
				    continue;
				} 
				this.record.incoming(objectId, null);
		    } else if (meta[ds2] == 'o') {
	            this.record.incoming(objectId, null);
            } else {
            	safeAlert("Unknown data type " + meta[ds2]);
            }
        }
    },
    generate: function() {
        var result = this.written;
        this.written = new Array();
        result.push(this.record.generate(false));
        result.push("..t" + this.last_transaction);
        result.push("\n");
        return result.join("");
    },
    write: function(data) {
    	this.written.push(data);
    },
    do_write: function(data) {
        var http = new XMLHttpRequest();
        var rsbp = this;
        data = data || this.unsent_data;
        this.unsent_data = data;
        http.open("POST", rsbp.server || "RSBP", true);
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        http.onreadystatechange = function() {
            if (http.readyState == 4) {
                if (http.status == 200) {
                	Events.put({type: 'ping'});
                    rsbp.unsent_data = null;
                    rsbp.timeout = null;
                    rsbp.last_connection = (new Date()).getTime();
                    if (!rsbp.first_connection) {
                        rsbp.first_connection = rsbp.last_connection;
                    }
                    rsbp.apply(http.responseText);
                    if (rsbp.isRunning) {
                        rsbp.start();
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
                    }
                    setTimeout(function() {self.do_write();}, self.timeout);
                }
            } 
        }
        http.send(data);
    },
    poll: function() {
    	if (!this.id) {
    	    this.do_write("..u\n");
    	} else {
    	    this.do_write(this.generate());
    	}
    },
    start: function() {
        this.isRunning = true;
        var self = this;
        setTimeout(function() {self.poll();}, this.minimum_wait);
    },
    stop: function() {
	this.isRunning = false;
    },
    outgoing: function(key, data) {
	this.record.outgoing(key, data);
    }
}
RSBP.encode = function(key, data) {
    if (data === null) {
	return "..d" + key + "-" + this.id;
    } else {
	return "..o" + key + "-" + data;
    }
}
RSBP.Record = function() {
    this.objects = new Object();
    this.pending = new Object();
    this.callbacks = new Array();
    this.transaction = 0;
}
RSBP.Record.prototype = {
	clone: function() {
		result = new RSBP.Record();
		result.objects = clone(this.objects);
		result.pending = clone(this.pending);
		result.transaction = this.transaction;
		return result;
	},
    incoming: function(key, data) {
		if (data === null) {
		    this.doCallback(key, data);
		    delete this.objects[key];
		    for (var skey in this.objects) {
				if (skey.slice(0, key.length + 1) == key + '.') {
				    delete this.objects[skey];
				}
		    }
		} else if (!this.pending[key]) {
            this.objects[key] = [this.transaction++, data];
            this.doCallback(key, data);
        } else if (!maintain_pending && this.objects[key][1] == data) {
            this.pending[key] = false;
        }
    },
    doCallback: function(key, data) {
		for (var i in this.callbacks) {
		    this.callbacks[i].incoming(key, data);
		}
    },
    outgoing: function(key, data) {
        this.objects[key] = [this.transaction++, data];
        this.pending[key] = true;
    },
    join: function() {
        for (var i in this.getTransactions(true)) {
            this.doCallback(arr[i][1], arr[i][0][1]);
        }
    },
    getTransactions: function(/*optional*/all) {
        var arr = new Array();
        for (var key in this.objects) {
            arr.push([this.objects[key], key]);
        }
        arr.sort(function(a,b){return a[0][0]-b[0][0];});       
	var result = new Array();
	for (var i in arr) {
	    result.push([arr[i][1], arr[i][0][1]]);
	}
	return result;
    },
    attachCallback: function(callback) {
    	var arr = this.getTransactions(true);
        for (var i in arr) {
            callback.incoming(arr[i][1], arr[i][0][1]);
        }
    },
    generate: function(/*optional*/all) {
        var result = new Array();
        if (all) {
            result.push(RSBP.encode("", null));
        }
        var arr = this.getTransactions(all);
        for (var i in arr) {
            result.push(RSBP.encode(arr[i][0], arr[i][1]));
        }
        return result.join("");
    },
    reset: function() {
	this.objects = new Object();
	this.pending = new Object();
	this.transaction = 0;
	this.join();
    }
}
