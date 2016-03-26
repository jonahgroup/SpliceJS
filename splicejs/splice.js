/*
SpliceJS

The MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
try {
	!require;
} catch(ex){
		window.require = function(m){
			if(m == 'splice.window.js') return window;
			if(m == 'splice.document.js') return document;
		}
}

(function(window, document){
	"use strict";
	//logging setup
	var log = !window.console ? {} : window.console;
	//console log interface
	if(!log.error) 	log.error = function(){};
	if(!log.debug) 	log.debug = function(){};
	if(!log.info) 	log.info  = function(){};
	if(!log.warn) 	log.warn = function(){};

    //path delimiter
    var _platform_ = window.__sjs_platform__;
    if(!_platform_) _platform_ = 'WEB';
    
    var _pd_ = '/'; //WEB
    if(_platform_ == 'UNX') _pd_ = '/';
    else if(_platform_ == 'WIN') _pd_ = '\\';
    
    //_not_pd_ is used for in-string replacement must be properly escaped
    var _not_pd_ = _pd_ == '/'?'\\\\':'/';

    var config = {platform: _platform_};

	function loadConfiguration(onLoad){
		var main = null;
		var head = document.head || document.getElementsByTagName('head')[0];
		// cycle through all script elements in document's head
		for(var i=0; i < head.childNodes.length; i++){
			var node = head.childNodes[i];
			if(!node.getAttribute) continue;
			if(node.getAttribute('sjs-main') != null) {
				main = node; break;
			}
		}

		// splice js script must have sjs-main attribute
		if(main == null) {
			log.warn('Application entry point is not defined.');
			return;
			//throw "SpliceJS script element must have 'sjs-main' attribute";
		}

	    mixin(config, {
			appBase: 	context(window.location.href).path,
			sjsHome:	context(main.getAttribute('src')).path,
			sjsMain:	main.getAttribute('sjs-main'),
			splash:		main.getAttribute('sjs-splash'),
			version:	main.getAttribute('sjs-version'),
			mode:		main.getAttribute('sjs-start-mode')
		});

		var sjsConfig = node.getAttribute('sjs-config');
		//load external configuration if available
		if(sjsConfig == null || !sjsConfig) {
			//mixin(configuration, config);
			onLoad(config);
		} else {
				//async load here
		}
	};

	function mixin(_t, _s){
		if(!_s) return _t;
		var keys = Object.keys(_s);
		if(	_s == window || _s == document ||
				_t == window || _t == document
				){
			log.error("Invalid object access " + _s.toString());
			return _t;
		}
		for(var key in keys){
			var p = _s[keys[key]];
			_t[keys[key]] = p;
		}
		return _t;
	};

	if(!Function.prototype.bind) {
		if(!Function.prototype.apply) return;
		Function.prototype.bind = function(t){
			var foo = this;
			return function(){ foo.apply(t,arguments); };
		};
	}

	/*
	 * No support for Object.create
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
	 * */
	if (typeof Object.create != 'function') {
		  Object.create = (function() {
		    var Object = function() {};
		    return function (prototype) {
		      if (arguments.length > 1) {
		        throw Error('Second argument not supported');
		      }
		      if (typeof prototype != 'object') {
		        throw TypeError('Argument must be an object');
		      }
		      Object.prototype = prototype;
		      var result = new Object();
		      Object.prototype = null;
		      return result;
		    };
		  })();
	}

	/* IE Object.keys fill*/
	if(typeof Object.keys !== 'function' ){
		Object.keys = function(obj){
			if(!obj) return null;
			var _keys = [];
			for(var key in  obj){
				if(obj.hasOwnProperty(key)) _keys.push(key);
			}
			return _keys;
		};
	}

	var PATH_VARIABLES = {};
	function setPathVar(key, value){
		//do not allow setting sjs home variable
		if(key === 'sjshome') return;

		if(!key || !value){
			return mixin({},PATH_VARIABLES);
		}
		PATH_VARIABLES[key] = value;
		return mixin({},PATH_VARIABLES);
	}

	function _split(s,regEx,skip){
		var parts = []
		, match = null;
		while(match = regEx.exec(s)){
			var before = s.substring(0,match.index);
			var item = match[0];
			s = s.substring(match.index + item.length);
			parts.push(before);
			if(!skip)	parts.push(item);
		}
		parts.push(s);
		return parts;
	}

	// returns URL context which allow further resolutions
	// / - page context
	function spv(url){
		var parts = _split(url,/{[^}{]+}/);
		var r = "";
		for(var i=0; i < parts.length; i++){
			var pv = PATH_VARIABLES[parts[i]];
			var s = parts[i];
            if(pv != null) s = spv(pv);
            
            if(r[r.length-1] == _pd_ && s[0] == _pd_ )
                r = r.substring(0,r.length-1) + s;
            else 
			    r = r + s;
		}
		return r;
	}
    
    function collapseUrl(path){
		var stack = [];
		var parts = path.split(_pd_);
		for(var i=0; i<parts.length; i++){
			if(!parts[i] && parts[i] == '') continue;
			if(parts[i] === '..' && stack.length >  0) {
				stack.pop();
				continue;
			}
			stack.push(parts[i]);
		}

		var cpath = '';
		var separator = '';
        if(path[0] == _pd_) cpath = _pd_;
		for(var i=0; i<stack.length; i++){
			cpath = cpath + separator + stack[i];
			if(stack[i] == 'http:') { separator = '//';  continue; }
			if(stack[i] == 'file:') { separator = '///'; continue; }
			separator = _pd_;
		}
		return cpath;
	};

    function isAbsUrl(url){
        if(!url) return false;
        //platform specific URL 
        if(config.platform == 'UNX'){
            if(url.startsWith('/')) return true;
            return false;            
        }
        if(config.platform == 'WIN'){
            if(/^[a-zA-Z]:\\/.test(url)) return true;
            return false;            
        }
        if(config.platform == 'WEB'){
            if(/^[a-zA-Z]+:\/\//.test(url)) return true;
            return false;            
        }
    }

	function context(contextUrl){
		//content must end with /
		var ctx = null;
        if(contextUrl) {
            ctx = contextUrl.replace(new RegExp(_not_pd_,"g"),_pd_);
            ctx = ctx.substring(0,ctx.lastIndexOf(_pd_)+1);
        }

        if(!ctx && config.appBase) ctx = config.appBase;

		if(ctx != null && ctx && ctx[ctx.length-1] != _pd_)
		 	throw 'Context URL must end with "'+ _pd_ +'"';
     
		return {
            isAbs: isAbsUrl(ctx),
            path:ctx,
			resolve:function(url){
				if(!url) return null;
				
                url = url.replace(new RegExp(_not_pd_,"g"),_pd_);
				//resolve path variables
				url = spv(url);
				//not page context
                if(isAbsUrl(url)) return collapseUrl(url) ;
                return collapseUrl(ctx + url); 
			}
		}
	}

	function fileExt(f){
		return f.substring(f.lastIndexOf('.'));
	}

	function peek(a){
		if(!a) return null;
		if(a.length > 0) return a[a.length - 1];
		return null;
	};
	//some browsers to not support trim function on strings
	function _trim(s){if(!s) return s;
		if(String.prototype.trim) return s.trim();
		return s.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
	}
	function fname(foo){
		/*
		-- support regular expression only
		because MS Edge browser does not support the name property
		if(foo.name != null) {
			if(foo.name) return foo.name;
			return 'anonymous';
		}
		*/
    if(typeof foo != 'function') throw 'Unable to obtain function name, argument is not a function'
    var match = /function(\s*[A-Za-z0-9_\$]*)\(/.exec(foo.toString());
    if(!match)  return 'anonymous';
		var name = _trim(match[1]);
		if(!name) return 'anonymous';
		return name;
  }

	function Namespace(){
		if(!(this instanceof Namespace) ) return new Namespace();
		this.sequence = 0;
		this.children = null;
	};

	Namespace.prototype = {
			add : function(path, obj){
				if(!path) return this;
				var parts = path.split('.');
				var target = this;
				for(var i=0; i<parts.length-1; i++){
					if(target[parts[i]] == null) target[parts[i]] = Object.create(null);
					target = target[parts[i]];
				}
				if(target[parts[parts.length-1]] != null) throw "Namespace conflict: " + path;
				target[parts[parts.length-1]] = obj;
				return this;
			},
			lookup:function(path){
				if(!path) return null;
				var parts = path.split('.');
				var target = this;
				for(var i=0; i<parts.length-1; i++){
					if(target[parts[i]] == null) target[parts[i]] = Object.create(null);
					target = target[parts[i]];
					if(target == null) break;
				}
				return target[parts[parts.length-1]];
			}
	};

	function Iterator(collection){
		this.data = collection;
		this.i = -1;
	};

	Iterator.prototype.next = function(){
		return this.data[++this.i];
	};

	var _fileHandlers = {
		'.js': function(filename,loader){
			//document script loader
			var head = document.head || document.getElementsByTagName('head')[0];
			var script = document.createElement('script');
			script.setAttribute("type", "text/javascript");
			script.setAttribute("src", filename);

			script.onload = script.onreadystatechange = function(){
				if(!script.readyState || script.readyState == 'complete' || script.readyState == 'loaded') {
					URL_CACHE[filename] = true;
					loader.onitemloaded();
					loader.progress();

					loader.loadNext({});
				}
			};
			head.appendChild(script);
		}
	};

	function updateSplash(){
		if(!isSplashScreen) return;
		if(Loader.splashScreen && typeof(Loader.splashScreen.update) == 'function')
			Loader.splashScreen.update(Loader.complete, Loader.total, Loader.currentFile);
	}


	function detectCircular(loader,print){
		//examine stack of loaders to resolve cicular dependencies
		for(var i=0; i < Loader.loaders.length; i++){
			var l = Loader.loaders[i];
			if(print){
				log.debug(i + ': ' + l.currentFile);
				continue;
			}
			if(l == loader) continue; //ignore current loader
			if(loader.currentFile == l.currentFile) {
				log.debug('----------- Loader stack -----------------')
				detectCircular(loader,true);
				throw "Circular module dependecy detected, please resolve";
			}
		}
	}

	function Loader(scope,resources, oncomplete, onitemloaded) {
		if(!resources || resources.length == 0) throw 'Invalid Loader constructor';
		this.iterator = new Iterator(resources);
		this._progress = resources.length;
		this.isActive = true;
		this.oncomplete = oncomplete;
		this.onitemloaded = onitemloaded;
		this.scope = scope;
		Loader.total += resources.length;
        
        this.appContext = context(config.appBase);

		if(!this.onitemloaded) this.onitemloaded = function(){}; //noop
	};
	Loader.complete = Loader.total = 0;
	Loader.loaders = new Array();

	Loader.prototype.progress = function(){
		this._progress--; 	Loader.complete++; 	updateSplash();
	}
	Loader.prototype.disable = function(){this.isActive = false; return this;};
	Loader.prototype.enable = function(){this.isActive = true; return this;};
	Loader.prototype.loadNext = function(watcher){
		if(!this.isActive) return;
		var loader = Loader.currentLoader = this;

		if(loader._progress <= 0) {
			this.iterator = null; this.oncomplete(); this.oncomplete = null; this.onitemloaded = null;
			return;
		}

		var obj = loader.iterator.next();
		if(!obj) return;

		var filename = obj;
        //returns absolute URL
		filename = this.appContext.resolve(filename);

		Loader.currentFile = this.currentFile = filename;
		updateSplash();

		//detect circular dependency here
		detectCircular(this);

		if(URL_CACHE[filename] === true){
			setTimeout(function(){
				loader.progress();
				loader.loadNext(watcher)
			},1);
			return;
		}

		var handler = _fileHandlers[fileExt(filename)];
		if(!handler) return;
		return handler(filename,loader);

	};

	var URL_CACHE = new Array();
	function urlCache(){
		var cache = [];
		for(var key in URL_CACHE){
			if( URL_CACHE.hasOwnProperty(key)) {
				log.info(key);
				cache.push(key);
			}
		}
		return cache;
	};

	var isSplashScreen = false;
	function load(resources, oncomplete, onitemloaded){
		if(!resources || resources.length < 1){
			if(typeof oncomplete != 'function') return;
			oncomplete();
			return;
		}

		//suspend current loader
		var currentLoader = peek(Loader.loaders);
		if(currentLoader) currentLoader.disable();

		var loader = new Loader((this instanceof Namespace)?this:null,
			resources, function(){
			Loader.loaders.pop();
			if(typeof(oncomplete)  === 'function') oncomplete();
			var queuedLoader = 	peek(Loader.loaders);
			if(queuedLoader) queuedLoader.enable().loadNext({});
			//hide splash screen if applicable
			if(isSplashScreen == true && this.isInitialLoader){
				Loader.splashScreen.hide();
			}
		}, onitemloaded);

		//setup splash screen if applicable
		if(Loader.splashScreen != null && !isSplashScreen){
			loader.isInitialLoader = true;
			isSplashScreen = true;
			Loader.splashScreen.show();
		}
		Loader.loaders.push(loader);
		loader.loadNext({});
	};


	function applyImports(imports){
		var scope = this;
		for(var i=0; i<imports.length; i++){
			if(!imports[i].namespace) continue;
			var ns = imports[i].namespace;
			var x = MODULE_MAP[imports[i].url];
			if(!x) continue;
			var keys = Object.keys(x);
			for(var key in keys){
				scope.add(ns+'.'+keys[key],x[keys[key]]);
			}
		}
	};

	function _exports(scope){
		scope.__sjs_module_exports__ = Object.create(null);
		return {
			scope:function(){
				for(var i=0; i < arguments.length; i++){
					var arg = arguments[i];
					if(typeof arg === 'function' ){
						scope[fname(arg)] = arg;
						continue;
					}
					if(typeof arg === 'object'){
						var keys = Object.keys(arg);
						for(var k=0; k < keys.length; k++){
							scope[keys[k]] = arg[keys[k]];
						}
						continue;
					}
				}
			},
			module:function(){
				var exports = scope.__sjs_module_exports__;
				//if(!exports) exports = scope.__sjs_module_exports__ = Object.create(null);
				for(var i=0; i < arguments.length; i++){
					var arg = arguments[i];
					if(typeof arg === 'function' ){
						exports[fname(arg)] = arg;
						continue;
					}
					if(typeof arg === 'object'){
						var keys = Object.keys(arg);
						for(var k=0; k < keys.length; k++){
							exports[keys[k]] = arg[keys[k]];
						}
						continue;
					}
				}
			}
		}
	};

	function _acopy(s,t){
		if(!s) return;
		if(!(s instanceof Array)) return;
		var keys = Object.keys(s);
		for(var key in keys){
			t[keys[key]] = s[keys[key]];
		}
	}

	function _vercomp(v1,v2){
		if(v1 == '*' || v2 == '*') return 0;

		v1 = _split(v1,/\./,true);
		v2 = _split(v2,/\./,true);
		//padd and compare version numbers
		for(var i=0; i<3; i++){
			//padd
			if(v1[i] == null) v1[i] = 0;
			if(v2[i] == null) v2[i] = 0;
			// compare
			var r = (+v1[i]-(+v2[i]));
			if(r == 0) continue;
			return r/Math.abs(r);
		}
		return 0;
	}

	function _required(m,ctx){
		var r = {resources:[], imports:[]};
		if(!m.required) return r;

		var items = [];
		//all required
		if(m.required instanceof Array) items = m.required;

		var version = _core.config.version;
        var appCtx = context(config.appBase);

		//versioned required
		if(typeof m.version == 'object' && version){
			//extract versions
			var versions = [];
			var keys = Object.keys(m.version);
			for(var key in keys){
				var parts = _split(keys[key],/-/,true);
				versions.push({from:_trim(parts[0]), to:_trim(parts[1]), required:m.version[keys[key]]});
			}
			//evaluate versions
			for(var i=0; i<versions.length; i++){
				var ver = versions[i];
				//exact version
				var pass = false;
				if(!ver.to){
					pass = (_vercomp(ver.from, version) == 0);
				} else { //range is present
					pass = (_vercomp(ver.from, version) <= 0 &&  _vercomp(ver.to, version) >= 0);
				}
				if(pass == true) _acopy(ver.required, items);
			}
		}

		for(var i=0; i < items.length; i++){
            var item = items[i], url = '', ns = '';
            
            //name space includes
            if(typeof(item)  == 'object'){
                for(var key in item){
				    if(item.hasOwnProperty(key)) {
					    url = item[key];
						ns = key;
						break;
					}
				}
            } 
            //no namespace includes
            else {
                url = item;    
            }
            //this means that our url is relative to application context            
			if(url[0] == '/') {
                url = appCtx.resolve(url.substr(1));
            }
            else {
                url = ctx.resolve(url);
            }    
            
			r.resources.push(url); 
            r.imports.push({namespace:ns, url:url});
		}
		return r;
	}

	var MODULE_MAP = new Object(null);
	var _moduleHandlers = {
		'default' : function anonymousModule(m, scope, _sjs){
			m.definition.bind({'scope':scope}, _sjs, scope)();
		},
		'splash' : function splashModule(m, scope, _sjs){
			var s = m.definition.bind({'scope':scope}, _sjs, scope)();
			if(typeof s == 'function') Loader.splashScreen = new s();
		}
	};

	function Module(m){
		var loader = Loader.currentLoader;
		if(this instanceof Loader) loader = this;

		var scope = new Namespace(null); //our module scope
		var path = context(loader.currentFile).path;
		var url = loader.currentFile;

		scope.__sjs_uri__ = {
			path:path,
			url:url
		};
		var ctx = context(path);
		var	required = _required(m,ctx);

		var _sjs = mixin(mixin({},core()),{	exports:_exports(scope)});

		load.call(scope,required.resources, function(){
			applyImports.call(scope,required.imports);
			if(typeof m.definition === 'function') {
				var handler = _moduleHandlers[m.type||'default'];
				if(handler == null) throw 'Handler for "' + m.type + '" is not found' ;
				handler(m, scope, _sjs);
				MODULE_MAP[url] = scope.__sjs_module_exports__;
			}
		});
	};
	Module.list = function(){
		return MODULE_MAP;
	};
	Module.handlers = function(){
		return mixin({},_moduleHandlers);
	};

function addTo(s,t){
	var keys = Object.keys(s);
	for(var key in keys) {
		if(t[keys[key]]) continue;
		t[keys[key]] = s[keys[key]];
	}
}

var extension = {
		core : function(obj){
			addTo(obj,_core);
		},
		loader: function(obj){
			addTo(obj,_fileHandlers);
		},
		module: function(obj){
			addTo(obj,_moduleHandlers);
		}
};

var _core = mixin(Object.create(null),{
	config      : mixin({},config),
    namespace   : Namespace,
	pathVar 	: setPathVar,
	context  	: context,
	urlCache    : urlCache,
	mixin		: mixin,
	'module'    : Module,
	fname		: fname,
	load		: load,
	extension   : extension,
	log 		: log,
	core		: core,
	vercomp		: _vercomp,
	document	: document,
});
function core(){
	return mixin(Object.create(null),_core);
}
function loadMain(config){
	if(config.sjsMain != null && config.sjsMain){
		log.info('Loading main module: ' + config.sjsMain);
		load([config.sjsMain]);
	}
}
function start(config){
	//load main modules
	if(config.splash != null && config.splash){
		load([config.splash], function(){
			loadMain(config);
		});
	}
	else loadMain(config);
}

window.sjs = core();
window.global = {sjs:core()};
try {
    global.sjs = core();
}catch(ex){
}


loadConfiguration(function(config){
    PATH_VARIABLES['{sjshome}'] = config.sjsHome;
    new window.Image().src = ( config.sjsHome || '') + '/resources/images/bootloading.gif';
    _core.config = config;
    if(config.mode == 'onload'){
        window.onload = function(){ start(config);}
    } 
    else if(config.mode == 'node'){
        start(config);
    }
    else {
        _core.start = function(){start(config);}
    }
});

})( (require('splice.window.js')), (require('splice.document.js')));
