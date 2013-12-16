(function() {
var µ = document.querySelectorAll.bind(document),
	REGEX_NEWLINE = /\r\n|\r|\n/g,
	REGEX_ESCAPED_SPACE = /\%20/g,
	PRIVATE;

PRIVATE = {
	ajax: function(opts) {
		var undefined,
			options = {
				method: (opts.method || 'get').toUpperCase(),
				data: opts.data || null,
				url: opts.url || "/",
				async: opts.async !== false,
				crossDomain: undefined,
				callback: opts.callback || function(){},
				expect: opts.expect
			},
			xhr = new XMLHttpRequest(),
			payload,
			length;

		//detect cross domain request
		options.crossDomain = (function() {
			if(options.url[0] === "/") {
				return false;
			}
			else {
				var here = location.protocol + "//" + location.hostname;
				if(options.url.indexOf(here) === 0) {
					return false;
				}
				else {
					return true;
				}
			}
		})()

		xhr.open(options.method, options.url, options.async);
		xhr.onreadystatechange = function () {
			if(xhr.readyState === 4) {
				if(xhr.status >= 200 && xhr.status < 400) {
					var err = null,
						expect = options.expect,
						undefined,
						result;

					if(expect === undefined) {
						switch(xhr.getResponseHeader('Content-Type')) {
							case 'application/json':
								expect = 'json';
							break;

							case 'application/javascript':
							case 'application/ecmascript':
							case 'application/x-ecmascript':
							case 'text/javascript':
								expect = 'javascript';
							break;

							case 'application/xml':
							case 'text/xml':
								expect = 'xml';
							break;
						}
					}

					switch(expect) {
						case 'json':
							try {
								result = JSON.parse(xhr.responseText)
							}
							catch(e) {
								err = e;
								console.error("Response sent with Content-Type application/json but cannot be parsed");
								result = xhr.responseText;
							}
						break;

						case 'javascript':
							result = xhr.responseText;
							(function() {
								eval.apply(this, [xhr.responseText])
							})();
						break;

						case 'xml':
							result = xhr.responseXML;	
						break;

						default:
							result = xhr.responseText;
						break;
					}

					options.callback.call(xhr, null, result);
					PRIVATE.openReqs.splice(PRIVATE.openReqs.indexOf(xhr), 1);
				}
				else {
					options.callback.call(xhr, xhr.status, xhr.responseText);
					PRIVATE.openReqs.splice(PRIVATE.openReqs.indexOf(xhr), 1);
				}
			}			
		};
		
		if(options.method === 'POST') {
			//TODO: set headers based on options.data before sending
			if(options.data instanceof FileList) {
				xhr.setRequestHeader('Content-Type', 'multipart/form-data');
				payload = options.data;
			}
			else if(options.data instanceof File) {
				xhr.setRequestHeader('Content-Type', 'multipart/form-data');
				payload = options.data;
			}
			else if(typeof options.data === 'object') {
				xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				payload = PRIVATE.formURLEncode(options.data);
			}
			else {
				xhr.setRequestHeader('Content-Type', 'text/plain');
				payload = options.data;
			}
		}
		else if(options.method === 'GET') {
			options.url += '?' + PRIVATE.formURLEncode(options.data);
			payload = null;
		}

		if(options.crossDomain) {
			xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
		}

		xhr.send(payload);	
		PRIVATE.openReqs[PRIVATE.openReqs.length] = xhr;
		return xhr;
	},

	/* Returns a string formatted properly for application/x-www-form-urlencoded requests*/
	formURLEncode: function(obj) {
		var visited = [];
		// console.debug("Encoding", obj);
		if(typeof obj !== 'object' || !obj) {
			return obj;
		}

		var recurse = function (name, val) {
			var keys = Object.keys(val),
				isArray = Array.isArray(val);

			return keys.map(function (key) {
				var nextVal = val[key];
				if(typeof nextVal === 'function') {
					console.warn('Function detected in JSON payload. Removing...', obj)
					return '';
				}
				else if(typeof nextVal === 'undefined') {
					return '';
				}
				else if(typeof nextVal === 'object') {
					if(visited.indexOf(nextVal) > -1) {
						console.warn('Circular reference detected in JSON payload. Removing...', obj);
						return '';
					}
					else {
						visited[visited.length] = nextVal;
					}
					
					if(name) {
						return recurse(name + '[' + key + ']', nextVal);
					}
					else {
						return recurse(key, nextVal);
					}
				}
				else {
					var escapedVal = escape(nextVal).replace(REGEX_ESCAPED_SPACE, '+').replace(REGEX_NEWLINE, '\r\n'),
						fullName;

					if(name){
						fullName = escape(name + '[' + (isArray ? '' : key) + ']');
					}
					else {
						fullName = escape(key);
					}

					return fullName.replace(REGEX_ESCAPED_SPACE, '+').replace(REGEX_NEWLINE, '\r\n') + '=' + escapedVal;
				}
			}).filter(function(i) {
				return i !== '';
			}).join('&');
		}

		return recurse('', obj);
	},

	callAjax: function (method, args) {
		var opts = {};
		opts.method = method;
		if(args.length === 0) {
			throw 'µ.' + method + ' requires at least 1 argument';
		}
		else if(args.length == 1) {
			opts.url = args[0];
		}
		else if(args.length == 2) {
			switch(method) {
				case 'post':
				case 'put':
					opts.url = args[0];
					opts.data = args[1];
				break;
				
				case 'get':
				default:
					opts.url = args[0];
					opts.callback = args[1];
				break;
			}
		}
		else if(args.length >= 1) {
			opts.url = args[0];
			opts.data = args[1];
			opts.callback = args[2];
		}
		return PRIVATE.ajax(opts);
	},

	openReqs: []
}

µ.post = function() {
	return PRIVATE.callAjax('post', arguments);
};

µ.get = function() {
	return PRIVATE.callAjax('get', arguments);
};

µ.busy = function() {
	return !!PRIVATE.openReqs.length;
};

window.µ = window.mu = µ;
})()