

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
			appHome: 	getPath(window.location.href).path,
			sjsHome:	getPath(main.getAttribute('src')).path
		};

		var sjsConfig = node.getAttribute('sjs-config');
		//load external configuration if available
		if(sjsConfig == null) {
			onLoad(config);
		} else {
				//async load here
		}
	};


	/**
		Merges properties of source object into target object
		and return target object
	*/
	function mixin(target, source){
		if(!source) return target;
		var keys = Object.keys(source);
		for(var i=0; i  < keys.length; i++){
			var key = keys[i];
			target[key] = source[key];
		}
		return target;
	};


	/**
	 * No support for bind
	 * use closure to emulate
	 * must support Function.prototype.apply()
	 * */
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


	/**
	 * Returns function's name
	 * First tries function.name property
	 * Next name is parsed from the function.prototype.toString output
	 * */
	var _fNameRegex = /function\s+([A-Za-z_\$][A-Za-z0-9_\$]*)\(/ig;
	function getFunctionName(foo){
		if(foo.name) return foo.name;

		if(typeof foo != 'function') throw 'Unable to obtain function name, argument is not a function'

		var functionString = foo.toString();
		var match = _fNameRegex.exec(functionString);

		if(!match)  return 'anonymous';
		return match[1];
	};



	var _pathVarRegex = /({[^}{]+})/ig;
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


	function collapsePath(path){
		var stack = [];
		/*
			create origin stack
		*/
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


	function absPath(path){
		return collapsePath(configuration.app_home+'/'+path);
	};




	/*
		Inheritance model
	*/

		function __super(inst,b,args){
			if(!b) return;
			__super(inst,b.constructor.__sjs_base__,args);
			b.constructor.apply(inst,args);
		};

		function __invoke(inst,method,b,args){
			if(!b) return;
			__invoke(inst,method,b.constructor.__sjs_base__,args);
			var method = b.constructor.prototype[method];
			method.apply(inst,args);
		}

		/**
			@param {prototype} p
		*/
		function _inheritance_map(p){
			var map = Object.create(null);

			while(p) {
				var keys = Object.keys(p);
				for(var i=0; i<keys.length; i++){
					var key = keys[i];
					if(map[key]) continue;
					map[key] = (function(){
						this.proto[this.key].apply(this.instance,arguments);
					}).bind({instance:this,proto:p,key:key});
				}

				p = p.constructor.__sjs_base__;
			}

			return map;
		};

		/**
		 * pseudo class wrapper
		 * */
		 function Class(_class){
			if(!_class) throw 'constructor function may not be empty';
			if(typeof(_class) !== 'function' ) throw 'Constructor must be a function';

			_class.extend = function(base){
				this.prototype = Object.create(base.prototype);
				this.prototype.constructor = this;
				/*
					we will need to invoke base prototypes methods thus
					constructor's base is a prototype
				*/
				this.__sjs_base__ = base.prototype;

				this.prototype.super = function(){
					/*
						ensure super constructor is invoked only once
						attach super prototype methods
					*/
					this.super = function(){};

					__super(this,_class.__sjs_base__, arguments);
					this.super = function(__class){
						if(!(this instanceof __class))
							throw 'Invalid super class "' + getFunctionName(__class) + '" of class "' + getFunctionName(_class) + '"' ;
						return _inheritance_map.call(this,__class.prototype);
					}
				}

				return this;
			}

			return _class;
		};


	var geval = eval;
	/**
	 *
	 */
	var URL_CACHE = new Array();

	/**
	  	Bootloading files
	*/
	var BOOT_SOURCE = []
	,	READY = {}
	, LOADER_PROGRESS = {total:0, complete:0}
	,	MODULE_MAP = new Object(null);

	var FILE_EXTENSIONS = {
		javascript: '.js',
		template: 	'.html',
		style: 		'.css',
		route: 		'.sjsroute',
	};

	var PATH_VARIABLES = {
		sjshome:''
	};



	function setPathVar(key, value){
		//do not allow setting sjs home variable
		if(key === 'sjshome') return;

		if(!key || !value){
			return mixin({},PATH_VARIABLES);
		}

		PATH_VARIABLES[key] = value;
		return setPathVar;
	};


	function applyPath(src){
		var path = this.path;
		var regex = /<img\s+src="(\S+)"\s*/igm;

		var match = null;
		var asrc = '';

		var lastMatch = 0;

		while(  match = regex.exec( src ) ){
			var apath = absPath(home(match[1],path));

			var left = src.substring(lastMatch, match.index);


			asrc = asrc + left + '<img src="' + apath + '" ';
			lastMatch += match.index + match[0].length;

			logging.debug.log(apath);
		}

		asrc = asrc + src.substring(lastMatch, src.length);
		return asrc;
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



function PathVariable(key){
	this.key = key;
	this.value = PATH_VARIABLES[key];
	if(key === 'sjshome') this.isHome = true;
}

function UrlAnalyzer(url){
	if(!(this instanceof UrlAnalyzer)) return new UrlAnalyzer(url);
	var t = new Tokenizer(url)
	,	token = null;

	this.parts = [];

	while(token = t.nextToken()){
		if(token == '{') {
			this.parts.push(new PathVariable(t.nextToken()));
			t.nextToken(); //closing bracket
			continue;
		}
		this.parts.push(token);
	}
};

UrlAnalyzer.prototype = {
	url:function(){
		var url = '';

		for(var i=0; i < this.parts.length; i++){
			var part = this.parts[i];

			if( part instanceof PathVariable ){
				url += part.value;
			} else {
				url += part;
			}
		}
		return url;
	},

	isHome:function(){
		return this.parts[0].isHome;
	}

};

/*
----------------------------------------------------------

	Http Request

*/

	var HttpRequest = function HttpRequest(){
		var a = Array("Msxml2.XMLHTTP","Microsoft.XMLHTTP");
    	if (window.ActiveXObject)
        for (var i = 0; i < a.length; i++) {
           	this.transport = new ActiveXObject(a[i]);
        }
      else if (window.XMLHttpRequest)   this.transport =  new XMLHttpRequest();
	};

	HttpRequest.prototype.request = function(type,config){

	 	var params = ''
    ,   separator = ''
	 	,   requestURL = config.url
	 	,   self = this;

    if (config.formData)
    for(var d=0; d < config.formData.length; d++){
    	params += separator + config.formData[d].name + '=' + encodeURIComponent(config.formData[d].value);
      separator = '&';
    }

    if(params.length > 0 && type === 'GET'){
    	requestURL = requestURL + "?" + params;
    }

		this.transport.open(type,requestURL,true);

	    //custom content type
		if (config.contentType) {
		    this.transport.setRequestHeader('Content-Type', config.contentType);
		}

	    //form url encoded data
		else if (config.formData) {
		    this.transport.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
		}

        //post plain text
		else if (config.data) {
		    this.transport.setRequestHeader('Content-Type', 'text/html; charset=utf-8');
		}

  	/*
        in ie8 onreadystatechange is attached to a quasy window object
        [this] inside handler function will refer to window object and not transport object
    */
    this.transport.onload = function(){
        var transport = self.transport;

        var response = {
            text: transport.responseText,
            xml:  transport.responseXML
        };

        switch (transport.status) {
            case 200:
                if(typeof config.onok == 'function') config.onok(response);
                break;
            case 400, 401, 402, 403, 404, 405, 406:
            case 500:
            default:
                if (typeof config.onfail == 'function') config.onfail(response);
                break;

        }
    }

    if (type == 'POST' && !params) params = config.data;

		this.transport.send(params);
		return this;
	};

	HttpRequest.post = function (config) {
		return new HttpRequest().request('POST',config);
	};

	HttpRequest.get = function(config){
		return new HttpRequest().request('GET',config);
	};


	/**
		Application entry point

	*/
	function start(){
		var fn = function(){

		var loadStart  = window.performance.now();
/*
		var mainPageHtml = document.body.innerHTML;
		document.body.innerHTML = '';
*/
		var url = window.location.origin + window.location.pathname;
		if(url.indexOf(configuration.app_home) == 0){

			url = url.substring(configuration.app_home.length);
			var name = getPath(url);
			LoadingWatcher.name = name.name;
			LoadingWatcher.url =url;
		}

		// boot module
		Module({
			required:BOOT_SOURCE,
			definition:function(){
				var scope = this.scope;
				scope.components = new Namespace();
				//var _Template = constructTemplate(mainPageHtml);
				var template = new Template(document.body);
				template.type = 'MainPage';
				var component = compileTemplate.call(scope,template);
				//var t = new _Template();
				//display(t);
				var controller = new Controller();
				_processIncludeAnchors.call(template,document.body,controller,scope);
				controller.onAttach();
				controller.onDisplay();

				var loadEnd  = window.performance.now();
				console.log('Load complete: ' + (loadEnd-loadStart) + 'ms');
			}
		});
	};
		//load and register custom spash sreen
		if(configuration.splash.module) {

			load([configuration.splash.module],function(){
				var m = findModule(configuration.splash.module)
				var screen = new (m[configuration.splash.class])();
				LoadingWatcher.initialInclude = 1;
				LoadingWatcher.splashScreen = screen;
				fn();
			})
		}
 		else{
			fn();
		}

	}



	function toPath(obj, path){
		if(!path) return obj;

		if(typeof obj === 'string'){
			if(obj.indexOf(path) === 0) return obj;
			if(path.charAt(path.length-1) == '/') path = path.substring(0, path.length - 1);
			return path + '/' + obj;
		}

		if(obj instanceof Array){
			for(var i=0; i < obj.length; i++){
				obj[i] = home(obj[i],toPath);
			}
			return obj;
		}
	};

	function home(obj,path){
		if(!path) path = configuration.splice_home;
		if(!obj) return path;

		if(typeof obj === 'string'){
			if(obj.indexOf(configuration.splice_home) === 0) return obj;
			return {ishome:true, path:(path + '/' + obj)};
		}

		if(obj instanceof Array){
			for(var i=0; i < obj.length; i++){
				obj[i] = home(obj[i],path);
			}
			return obj;
		}
	};


	function splitQualifiedName(name){

		if(!name) return null;
		var parts = name.split('.');

		var ns = '';
		var separator = '';

		for(var i=0; i < parts.length - 1; i++){
			ns += separator + parts[i];
			separator = '.';
		}
		return {namespace:ns, name:parts[parts.length-1]};
	};

	/** Namespace object
	 *
	 * */

	function Namespace(){
		if(!(this instanceof Namespace) ) return new Namespace();
		this.sequence = 0;
		this.content = Object.create(null);
	};

	Namespace.prototype = {
			add : function(path, obj){
				if(!path) return this;
				var parts = path.split(".");
				var target = this;
				for(var i=0; i<parts.length; i++){
					if(target.content[parts[i]] == null) target.content[parts[i]] = new Namespace();
					target = target.content[parts[i]];
				}
				target.content = obj;
				return this;
			},

			lookup:function(path){
				if(!path) return this;
				var parts = path.split(".");
				var target = this;
				for(var i=0; i<parts.length; i++){
					target = target.content[parts[i]];
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


	/**
	 * Sequential resource loader Loader
	 *
	 * @constructor
	 * @this {Loader}
	 * @param {Array} resources 	Resource URLs
	 * @param {Function} oncomplete Callback, invoked when last resource in the list is loaded
	 * @param {Function} onitemloaded Callback, called on each loaded item from the resource list
	 */

	function Loader(resources, oncomplete, onitemloaded) {

		if(!resources || resources.length == 0) throw 'Invalid Loader constructor';

		this.iterator = new Iterator(resources);
		this.progress = resources.length;
		this.isActive = true;
		this.oncomplete = oncomplete;
		this.onitemloaded = onitemloaded;


		LOADER_PROGRESS.total += resources.length;

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
		filename = absPath(filename);

		//tell Splice what is loading
		watcher.notify({name:relativeFileName, url:filename});

		/*
		 * */

		if(	endsWith(filename, FILE_EXTENSIONS.style) 		||
			endsWith(filename, FILE_EXTENSIONS.javascript)  ||
			endsWith(filename, FILE_EXTENSIONS.template) 	||
			endsWith(filename, FILE_EXTENSIONS.route) )
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

		logging.debug.log('Loading: ' + filename);

		var head = document.getElementsByTagName('head')[0];


		/*
		 * Load CSS Files - global
		 * */
		if(endsWith(filename, FILE_EXTENSIONS.style)){

			var linkref = document.createElement('link');

			linkref.setAttribute("rel", "stylesheet");
			linkref.setAttribute("type", "text/css");
			linkref.setAttribute("href", filename);

			//linkref.onreadystatechange
			/*
			 * Link ref supports onload in IE8 WTF????
			 * as well as onreadystatechange
			 * having an assigment to both will trigger the handler twice
			 *
			 * */


			linkref.onload = function(){
				if(!linkref.readyState || linkref.readyState == 'complete') {
					URL_CACHE[filename] = true;
					loader.onitemloaded();
					loader.progress--;
					LOADER_PROGRESS.complete++;
					watcher.update();
					loader.loadNext(watcher);
				}
			};
			head.appendChild(linkref);

			return;
		}


		/*
		 * Load javascript files
		 * */
		if(endsWith(filename, FILE_EXTENSIONS.javascript)) {


			if(configuration.debug) {
			//document script loader
			var script = document.createElement('script');
			script.setAttribute("type", "text/javascript");
			script.setAttribute("src", filename);

			script.onload = script.onreadystatechange = function(){
				if(!script.readyState || script.readyState == 'complete' || script.readyState == 'loaded') {
					URL_CACHE[filename] = true;
					loader.onitemloaded();
					loader.progress--;
					LOADER_PROGRESS.complete++;
						watcher.update();
					loader.loadNext(watcher);
				}
			};
			head.appendChild(script);
			return;
			}
		/*

		//geval script loader
			HttpRequest.get({
				url: filename,
				onok:function(response){

					try {
						geval(response.text);
					} catch(ex){
						throw ex;
					}
					URL_CACHE[filename] = true;
					loader.onitemloaded();
					loader.progress--;
					LOADER_PROGRESS.complete++;
					loader.loadNext(watcher);
				}
			});
		*/


		//function script loader
			if(!configuration.debug){
			HttpRequest.get({
				url: filename,
				onok:function(response){

					try {
						//(new Function(response.text))();
						var s = document.createElement('script');
						s.setAttribute('type','text/javascript');

						s.innerHTML = response.text;

						document.head.appendChild(s);
					} catch(ex){
						throw ex;
					}
					URL_CACHE[filename] = true;
					loader.onitemloaded();
					loader.progress--;
					LOADER_PROGRESS.complete++;
						watcher.update();
					loader.loadNext(watcher);
				}
			});
			return;
			}
		}

		/*
		 * Load html templates
		 * */
		if(endsWith(filename, FILE_EXTENSIONS.template)){
			HttpRequest.get({
				url: filename,
				onok:function(response){
					URL_CACHE[filename] = true;
					loader.onitemloaded({ext: FILE_EXTENSIONS.template, filename:filename, data:response.text});
					loader.progress--;
					LOADER_PROGRESS.complete++;
						watcher.update();
					loader.loadNext(watcher);
				}
			});
			return;
		}

		/*
		 *	Load routing file
		 * */
		 if(endsWith(filename, FILE_EXTENSIONS.route)){
			HttpRequest.get({
				url: filename,
				onok:function(response){
					URL_CACHE[filename] = true;
					loader.onitemloaded({ext: FILE_EXTENSIONS.route, filename:filename, data:response.text});
					loader.progress--;
					LOADER_PROGRESS.complete++;
						watcher.update();
					loader.loadNext(watcher);
				}
			});
			return;
		 }
	};



	function dumpUrlCache(){
		var cache = [];
		for(var key in URL_CACHE){
			if( URL_CACHE.hasOwnProperty(key)) {
				logging.info.log(key);
				cache.push(key);
			}
		}
		return cache;
	};

	function include(resources, oncomplete, onitemloaded){

		/*
		 * Initial bootstrap
		 * */
		if(LoadingWatcher.initialInclude > 0) {
			showPreloader();
			var foo = oncomplete;
			oncomplete = function(){
				removePreloader();
				if(typeof foo === 'function') foo();
			};
			LoadingWatcher.initialInclude = 0;
		}

		/*
		 * Always perform nested loading
		 * */
		logging.debug.log('Nested loading...');
		var loader = new Loader(resources, function(){
			Loader.loaders.pop();

			if(typeof(oncomplete)  === 'function') oncomplete();

			var queuedLoader = 	peek(Loader.loaders);

			if(queuedLoader) queuedLoader.enable().loadNext(LoadingWatcher);

		}, onitemloaded);

		//suspend current loader
		var currentLoader = peek(Loader.loaders);
		if(currentLoader) currentLoader.disable();

		Loader.loaders.push(loader);
		loader.loadNext(LoadingWatcher);
	};


	function load(moduleUrls, oncomplete){
		include(moduleUrls, oncomplete);
	};







	/*
		@path is a relative path to splice_home
		@a is a dependency list of file names
	*/
	function prepareImports(a, path){
		if(!a) return {namespaces:null, filenames:null};

		var namespaces = [] , filenames = [],  p = '';

		for(var i=0; i<a.length; i++){

			var ua = null;
			//this is a namespaced dependency
			if(typeof a[i] === 'object') {
				for(var key in a[i]){
					if(a[i].hasOwnProperty(key)) {
						ua = UrlAnalyzer(a[i][key]);

						if(ua.isHome()) {
							p = ua.url();
						}
						else {
							p = toPath(ua.url(),path);
						}

						namespaces.push({ns:key,path:p});
						filenames.push(p);
						break;
					}
				}
			} else {
				ua = UrlAnalyzer(a[i]);

				if(ua.isHome()) {
					p = ua.url();
				}
				else {
					p = toPath(ua.url(),path);
				}

				filenames.push(p);
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

	/**
	 * Builds module and compiles template(s) from module definition.
	 * The templates will be compiled recursively,
	 * where inner templates are compiled first and then outer.
	 * Any scripts embedded into template will be evaluated and
	 * their result be injected into DOM, by replacing underlying script tag.
	 * @param moduleDefinition
	 */
	function Module(moduleDefinition){

    var scope = new Namespace(null); //our module scope
		scope.singletons = {constructors:[], instances:[]};

		var _sjs = mixin(mixin({},sjs()),{
			exports:_exports(scope),
			proxy : (function(){return proxy.apply(this,arguments);}).bind(scope),
			load  : (function(filenames){

				return (function(fn){
					var imports = prepareImports(filenames, this.__sjs_uri__.path);

					include(imports.filenames,function(){
						applyImports.call(scope,imports);
						if(typeof fn === 'function') fn();
					});

				}).bind(this);

			}).bind(scope),
			loadscope:function(targetscope){
				return (function(filenames){

					return (function(fn){
						var imports = prepareImports(filenames, this.__sjs_uri__.path);

						include(imports.filenames,function(){
							applyImports.call(scope,imports);
							if(typeof fn === 'function') fn();
						});

					}).bind(this);

				}).bind(targetscope);
			}
		});

		var path = getPath(LoadingWatcher.name).path;
		var url = LoadingWatcher.url;
		var filename = LoadingWatcher.name;

		scope.__sjs_uri__ = {
			path:path,
			url:url,
			res:filename
		};

		var imports = prepareImports(moduleDefinition.required, path);

		var required 	= imports.filenames;
		var definition  = moduleDefinition.definition;



		/* required collection is always an Array */
		required = required instanceof Array ? required : null;

		logging.debug.log(path);
		/*
		 * Handler to receive template file sources
		 * each file may container any number of templates
		 * template are then extracted into templateDefinitions
		 * and assigned to module instance
		 *
		 * Template compiler is called on module instance
		 * */
		var collectTemplates = function(template){
			if(!template) return;

			if(template.ext == FILE_EXTENSIONS.template) {
				extractTemplates.call(scope,template.data);
			}
		};

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
		 include(required, function(){

			/*
				Inject Scope Dependencies
			 */
			if(imports.namespaces) {
				applyImports.call(scope,imports);
			}

			/*
			 * Templates are compiled after module has been defined
			 *
			 * */
			compileTemplates(scope);

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

		},collectTemplates);
	};



	function listModules(){
		return MODULE_MAP;
	};

	function measureRuntime(fn){
		var start = window.performance.now();
		fn();
		var end = window.performance.now();
		return end - start;
	};


	function findModule(m){
		var mdl = null;
		var keys = Object.keys(MODULE_MAP);
		for(var i=0; i < keys.length; i++){
			var key = keys[i];
			if(key.endsWith(m)) mdl = MODULE_MAP[key];
		}
		return mdl;
	};

	loadConfiguration(function(config){
		new Image().src = ( config.sjsHome || '') + '/resources/images/bootloading.gif';
	});

return {
	namespace: Namespace
}

})(window,document);
