var global = global || {};
global.alert = alert;
global.prompt = function (msg, cb) {
	cb(prompt(msg));
};
global.confirm = function (msg, cb) {
	cb(confirm(msg));
};

window.URL = window.URL || window.webkitURL;

if(window["chrome"] && window["chrome"]["storage"]){
	global.storage = {
		"set": function (key, s) {
			var d = {};
			d[key] = s;
		  	chrome.storage.sync.set(d);
		},
		"get": function (key, callback) {
			  chrome.storage.sync.get({}, callback);
		},
		"remove": function (key, callback) {
			  chrome.storage.sync.remove(key, callback);
		}
	}
}else{
	global.storage = {
		"set": function (key, s) {
			localStorage[key] = s;
		},
		"get": function (key, callback) {
			if (localStorage[key]) {
				var returnedData = {};
				returnedData[key] = localStorage[key];
				callback(returnedData);
			}
		},
		"remove": function (key, callback) {
			  localStorage.removeItem(key);
		}
	}

	window.addEventListener('load', function(e) {

	  window.applicationCache.addEventListener('updateready', function(e) {
	    if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
	      // Browser downloaded a new app cache.
	      // Swap it in and reload the page to get the new hotness.
	      window.applicationCache.swapCache();
	      global.confirm('A new version of this site is available. Load it?', function (ok) {
	        if (ok) {
	            window.location.reload();
	        }
	      });
	    }
	  }, false);

	}, false);

}

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}
