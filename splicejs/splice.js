/*

SpliceJS

The MIT License (MIT)

Copyright (c) 2015 Dmitry Rogozhkin (jonahgroup)

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
var sjs = (function(window, document){
	"use strict";

	//loggin setup
	var log = !window.console ? {} : window.console;
	//console log interface
	if(!log.error) 	log.error = function(){};
	if(!log.debug) 	log.debug = function(){};
	if(!log.info) 	log.info  = function(){};
	if(!log.error) 	log.error = function(){};


	/**
		Configuration loader, participates in application bootstrap
	*/
	var configuration = {};
	function loadConfiguration(onLoad){
		var main = null;

		// cycle through all script elements in document's head
		for(var i=0; i < document.head.childNodes.length; i++){
			var node = document.head.childNodes[i];
			if(!node.getAttribute) continue;
			if(node.getAttribute('sjs-main') != null) {
				main = node; break;
			}
		}

		// splice js script must have sjs-main attribute
		if(main == null) throw "SpliceJS script element must have 'sjs-main' attribute";

		var config = {
			appBase: 	getPath(window.location.href).path,
			sjsHome:	getPath(main.getAttribute('src')).path,
			sjsMain:	context().resolve(main.getAttribute('sjs-main'))
		};

		var sjsConfig = node.getAttribute('sjs-config');
		//load external configuration if available
		if(sjsConfig == null || !sjsConfig) {
			mixin(configuration, config);
			onLoad(config);
		} else {
				//async load here
		}
	};


	function mixin(target, source){
		if(!source) return target;
		var keys = Object.keys(source);
		for(var i=0; i  < keys.length; i++){
			var key = keys[i];
			target[key] = source[key];
		}
		return target;
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

	// returns URL context which allow further resolutions
	function context(contextUrl){
		return {
			resolve:function(url,isAbs){
				if(!url) return url;
				var _pathVarRegex = /({[^}{]+})/ig;

				var parts = url.split(/({[^}{]+})/);
				var result = "";
				for(var i=0; i<parts.length; i++){
					var pv = PATH_VARIABLES[parts[i]];
					if(pv != null) {
						result = result + resolveUrl(pv);
						continue;
					}
					result = result + parts[i];
				}

				if(isAbs){
					//already absolute
					if(url.startsWith('http://')) return collapseUrl(result);
					return collapseUrl(configuration.appBase + '/' + result);
				}
				return result;
			}
		}
	}


	/**
		Extracts path full resource location
	*/
	function getPath(path){
		var index = path.lastIndexOf('/');

		if(index < 0) return {name:path};
		return {
			path:path.substring(0,index),
			name:path.substring(index+1)
		}
	};

	function collapseUrl(path){
		var stack = [];

		var parts = path.split('/');
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
		for(var i=0; i<stack.length; i++){

			cpath = cpath + separator + stack[i];
			if(stack[i] == 'http:') { separator = '//';  continue; }
			if(stack[i] == 'file:') { separator = '///'; continue; }
			separator = '/';
		}
		return cpath;
	};

	/* make this more efficient */
	function endsWith(text, pattern){
		var matcher = new RegExp("^.+"+pattern.replace(/[.]/,"\\$&")+'$');
		var result = matcher.test(text);
		return result;
	}


	function peek(a){
		if(!a) return null;
		if(a.length > 0) return a[a.length - 1];
		return null;
	};

	var geval = eval;

	function Namespace(){
		if(!(this instanceof Namespace) ) return new Namespace();
		this.sequence = 0;
		this.children = null;
	};

	Namespace.prototype = {
			add : function(path, obj){
				if(!path) return this;
				var parts = path.split(".");
				var target = this;
				for(var i=0; i<parts.length; i++){
					if(target.children == null) target.children = Object.create(null);
					if(target.children[parts[i]] == null) target.children[parts[i]] = new Namespace();
					target = target.children[parts[i]];
				}
				target.content = obj;
				return this;
			},

			lookup:function(path){
				if(!path) return this;
				var parts = path.split(".");
				var target = this;
				for(var i=0; i<parts.length; i++){
					if(target.children == null) return null;
					target = target.children[parts[i]];
					if(target == null) return null;
				}
				return target;
			},
			seq:function(){
				return this.sequence++;
			}
	};

	function Iterator(collection){
		this.data = collection;
		this.i = -1;
	};

	Iterator.prototype.next = function(){
		return this.data[++this.i];
	};


	function Loader(resources, oncomplete, onitemloaded) {

		if(!resources || resources.length == 0) throw 'Invalid Loader constructor';

		this.iterator = new Iterator(resources);
		this.progress = resources.length;
		this.isActive = true;
		this.oncomplete = oncomplete;
		this.onitemloaded = onitemloaded;

		//LOADER_PROGRESS.total += resources.length;

		if(!this.onitemloaded) this.onitemloaded = function(){}; //noop
	};

	Loader.loaders = new Array();

	Loader.prototype.disable = function(){this.isActive = false; return this;};
	Loader.prototype.enable = function(){this.isActive = true; return this;};
	Loader.prototype.loadNext = function(watcher){
		if(!this.isActive) return;
		var loader = this;
		/*
		 * loading is complete run oncomplete handler
		 */
		if(loader.progress <= 0) {
			this.iterator = null; this.oncomplete(); this.oncomplete = null; this.onitemloaded = null;
			return;
		}

		var obj = loader.iterator.next();
		if(!obj) return;

		var filename = obj;
		/*
		 * qualify filename
		 * */
		var relativeFileName = filename;
		filename = resolveUrl(filename,true);
		Loader.currentFile = filename;
		//tell Splice what is loading
		//watcher.notify({name:relativeFileName, url:filename});

		if(	endsWith(filename, '.js') )
		if(URL_CACHE[filename] === true){
			setTimeout(function(){
				logging.debug.log('File ' + filename + ' is already loaded, skipping...');
				loader.progress--;
				LOADER_PROGRESS.complete++;
				watcher.update();
				loader.loadNext(watcher)
			},1);
			return;
		}

		log.info('Loading: ' + filename);
		var head = document.getElementsByTagName('head')[0];

		/*
		 * Load javascript files
		 * */
		if(endsWith(filename, '.js')) {
			//document script loader
			var script = document.createElement('script');
			script.setAttribute("type", "text/javascript");
			script.setAttribute("src", filename);

			script.onload = script.onreadystatechange = function(){
				if(!script.readyState || script.readyState == 'complete' || script.readyState == 'loaded') {
					URL_CACHE[filename] = true;
					loader.onitemloaded();
					loader.progress--;
//					LOADER_PROGRESS.complete++;
//					watcher.update();
					loader.loadNext(watcher);
				}
			};
			head.appendChild(script);
			return;
		}
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

	function load(resources, oncomplete, onitemloaded){
		log.info('Nested loading...');
		var loader = new Loader(resources, function(){
			Loader.loaders.pop();
			if(typeof(oncomplete)  === 'function') oncomplete();
			var queuedLoader = 	peek(Loader.loaders);
			if(queuedLoader) queuedLoader.enable().loadNext({});
		}, onitemloaded);

		//suspend current loader
		var currentLoader = peek(Loader.loaders);
		if(currentLoader) currentLoader.disable();

		Loader.loaders.push(loader);
		loader.loadNext({});
	};

	/**
	@path: is already absolute
	*/
	function prepareImports(a, path){
		if(!a) return {namespaces:null, filenames:null};

		var namespaces = [] , filenames = [],  p = '';
		//loop through all required modules
		for(var i=0; i<a.length; i++){
			//this is a namespaced dependency
			if(typeof a[i] === 'object') {
				for(var key in a[i]){
					if(a[i].hasOwnProperty(key)) {
						var p = resolveUrl(path+'/'+a[i][key]);
						namespaces.push({ns:key,path:p});
						filenames.push(p);
						break;
					}
				}
			} else {
				//this is application context URL
				if(a[i].startsWith('/')) {
					filenames.push(resolveUrl(a[i]));
				} else {
					filenames.push(resolveUrl(path + '/' +a[i]));
				}
			}
		}
		return {namespaces:namespaces, filenames:filenames};
	};

	function applyImports(imports){
		var scope = this;
		for(var i=0; i<imports.namespaces.length; i++){
			var ns = imports.namespaces[i];
			//looking up exports
			var x = MODULE_MAP[absPath(ns.path)];
			if(!x) continue;
			ns = getNamespace.call(scope,ns.ns,true,false);
			ns.place(x);
		}
	};

	function _exports(scope){
		return {
			scope:function(){
				for(var i=0; i < arguments.length; i++){
					var arg = arguments[i];
					if(typeof arg === 'function' ){
						scope[getFunctionName(arg)] = arg;
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
				if(!exports) exports = scope.__sjs_module_exports__ = Object.create(null);
				for(var i=0; i < arguments.length; i++){
					var arg = arguments[i];
					if(typeof arg === 'function' ){
						exports[getFunctionName(arg)] = arg;
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

	var MODULE_MAP = new Object(null);
	function Module(moduleDefinition){
		log.info(this);
    var scope = new Namespace(null); //our module scope
		scope.singletons = {constructors:[], instances:[]};

		var _sjs = mixin(mixin({},core()),{	exports:_exports(scope)});

		var path = getPath(Loader.currentFile).path;
		var url = Loader.currentFile;
	//	var filename = LoadingWatcher.name;

		scope.__sjs_uri__ = {
			path:path,
		//	url:url,
		//	res:filename
		};

		var imports = prepareImports(moduleDefinition.required, path);

		var required 	= imports.filenames;
		var definition  = moduleDefinition.definition;

		/* required collection is always an Array */
		required = required instanceof Array ? required : null;

		log.info(path);

		/*
		 * Module has no required includes
		 * */
		if(!required || required.length < 1) {
			definition.call({'sjs':_sjs,'scope':scope}, _sjs);
			if(!scope.__sjs_module_exports__)
				scope.__sjs_module_exports__ = Object.create(null);
			MODULE_MAP[url] = scope.__sjs_module_exports__;
			return;
		}

		/*
		 * Load dependencies
		 * */
		 load(required, function(){

			/*
				Inject Scope Dependencies
			 */
			if(imports.namespaces) {
				applyImports.call(scope,imports);
			}

			if(typeof definition === 'function') {
				definition.call({'sjs':_sjs,'scope':scope}, _sjs);

				if(!scope.__sjs_module_exports__)
					scope.__sjs_module_exports__ = Object.create(null);

				//get only exported components
				var components = {};
				if(scope.components){
				var keys = Object.keys(scope.components);
				for(var key in keys) {
					var comp = scope.components[keys[key]];
					if(comp && comp.isComponent && comp.template.export) {
						components[comp.template.export] = comp;
					}
				}
				}
				MODULE_MAP[url] = mixin(scope.__sjs_module_exports__,components);
			}

		});
	};

var _core = mixin(Object.create(null),{
	namespace : Namespace,
	pathVar :	setPathVar,
	context : context,
	urlCache : urlCache,
	'module' : Module
});
function core(){
	return mixin(Object.create(null),_core);
}

loadConfiguration(function(config){
	PATH_VARIABLES['{sjshome}'] = config.sjsHome;
	new Image().src = ( config.sjsHome || '') + '/resources/images/bootloading.gif';
	//load main modules
	if(config.sjsMain != null && config.sjsMain){
		log.info('Loading main module: ' + config.sjsMain);
		load([config.sjsMain]);
	}
});

return _core;

})(window,document);
