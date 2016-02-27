

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

	//global error listener
	window.onerror = function(error,a,b,c,d,e){
		return false;
	}

	for(var i=0; i < document.head.childNodes.length; i++){
		var node = document.head.childNodes[i];
		if(!node.getAttribute) continue;

		var main 		= node.getAttribute('sjs-main');
		if(main == null) continue;
		var src 		= node.getAttribute('src');
		var config 	= node.getAttribute('sjs-config');
		log.debug("main script attributes");
	}




	if(!window.sjsConfig) log.warn('sjsConfig not found, using defaults');

	var configuration = {
		app_home: 	getPath(window.location.href).path,
		splice_home:        window.sjsConfig.home,
		debug:							window.sjsConfig.debug,
		startup:						window.sjsConfig.startup,
		platform:					 {
				isTouchEnabled:window.sjsConfig.platform_touch,
				isMobile:	window.sjsConfig.platform_mobile
		},
		splash: { 'module': window.sjsConfig.splash_screen_module,
							'class'	:	window.sjsConfig.splash_screen_class
		}
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
	, 	LOADER_PROGRESS = {total:0, complete:0}
	,	MODULE_MAP = new Object(null);

	var FILE_EXTENSIONS = {
		javascript: '.js',
		template: 	'.html',
		style: 		'.css',
		route: 		'.sjsroute',
	};

	/*
	 	Cache loading indicator
	*/
	new Image().src = ( configuration.splice_home || '') + '/resources/images/bootloading.gif';



/*

----------------------------------------------------------
	Utility Functions
*/
	/*
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



	function loadConfig(){

	}


	/*
	 * Returns function's name
	 * First tries function.name property
	 * Next name is parsed from the function.prototype.toString output
	 * */
	function getFunctionName(foo){
		if(foo.name) return foo.name;

		if(typeof foo != 'function') throw 'Unable to obtain function name, argument is not a function'

		var regex = /function\s+([A-Za-z_\$][A-Za-z0-9_\$]*)\(/ig;
		var functionString = foo.toString();
		var match = regex.exec(functionString);

		if(!match)  return 'anonymous';
		return match[1];
	};


	function showPreloader(){
		if(window.SPLICE_SUPPRESS_PRELOADER) return;
			display(LoadingWatcher.splashScreen);
	}

	function removePreloader(){
		if(window.SPLICE_SUPPRESS_PRELOADER) return;
			display.clear(LoadingWatcher.splashScreen);
	}



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


	function getPath(path){
		var index = path.lastIndexOf('/');

		if(index < 0) return {name:path};
		return {
			path:path.substring(0,index),
			name:path.substring(index+1)
		}
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

	function valueGetter(obj, path) {
		if(path == null) return (new Function('return this;')).bind(obj);
		var parts = path.toString().split('.');
    var stmnt = 'return this';
    for(var i=0; i < parts.length; i++){
      stmnt+='[\''+parts[i]+'\']';
    }
    stmnt+=';';
    return (new Function(stmnt)).bind(obj);
  };

	function valueSetter(obj, path){
		if(path == null) return (new Function('throw "No setter path exception"')).bind(obj);

		var parts = path.toString().split('.');
		var stmnt = 'this';
		for(var i=0; i < parts.length; i++){
			stmnt+='[\''+parts[i]+'\']';
		}
		stmnt+='=v;';
		return (new Function('v',stmnt)).bind(obj);
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


/**
 *
 * 	URL analyzer
 *
 */
function Tokenizer(input, alphanum, space){
	if(!(this instanceof Tokenizer) ) return new Tokenizer(input, alphanum, space);
	mixin(this, {
		input: input,	i : 0,	c : input[0]
	});

	this.alphanum = Tokenizer.isAlphaNum;
	if(alphanum) this.alphanum = alphanum;

	this.space = Tokenizer.isSpace;
	if(space) this.space = space;
};


Tokenizer.isSpace = function(c){
		if(	c === ' ' 	||
			c === '\n'	||
			c === '\r'  ||
			c === '\t') return true;
};

Tokenizer.isAlphaNum = function(c){
		if(!c) return false;
		var code = c.charCodeAt();
		if(	c === '_' ||
			(code >= 48 && code <= 57)	||	/*0-9*/
			(code >= 65 && code <= 90 ) || 	/*A-Z*/
			(code >= 97 && code <= 122) 	/*a-z*/ )
		return true;
		return false;
};


Tokenizer.prototype = {
	consume : function(){
		if(this.input.length <= this.i) return null;
		var cons = this.c;
		this.c = this.input[++this.i];
		return cons;
	},

	nextToken : function(){

		var c = this.c;
		if(this.alphanum(c)) {
			return this.identifier();
		}
		return this.consume();
	},

	identifier:function(){
		var result = '';
		while(this.alphanum(this.c)){
			result += this.consume();
		}
		return result;
	}
};

var PATH_VARIABLES = {
	sjshome:configuration.splice_home
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

/*

----------------------------------------------------------

	SliceJS Core
	Implementation

*/

	var SplashScreenController = Class(function SplashScreenController(){
		this.super();
	}).extend(Controller);


	SplashScreenController.prototype.update = function(total, complete, itemname){
		throw 'SplashScreenController derived class must implement "update" method';
	}

	function onReady(fn){	READY.callback = fn; };

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

	//determine application startup mode
	if(configuration.startup == 'onload') {
		window.onload = function(){
			start();
		};
	};

	function boot(args){

		if(!args) return null;
		if(!(args instanceof Array) ) return null;

		for(var i=0; i< args.length; i++){
			BOOT_SOURCE.push(args[i]);
		}

		return boot;
	};


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




	var NAMESPACE_INDEX = [];

	/** Namespace object
	 *
	 * */

	function _Namespace(namespace){

		if(typeof namespace !== 'string' ) throw "Namespace(string) argument type must be a string";

		var ns = getNamespace.call(window,namespace, false, false);

		if(ns && !(ns instanceof Namespace))
			throw "Namespace " + namespace + " is ocupied by an object ";

		/*
		 * return Namespace proxy with Class constructor
		 * */
		if(ns == null){
			return {


				add:function(name, object){

					var idx = (namespace + '.' + name).toUpperCase();

					var newNamespace = getNamespace.call(window,namespace,true);
					NAMESPACE_INDEX[idx] = newNamespace[name] = object;

				}
			}
		}


		return ns;
	}


	function Namespace(path){
		this.itc = 0;
	};


	Namespace.prototype = {

			getNextTemplateName : function(){
				return '__impTemplate' + (this.itc++);
			},



			place:function(obj){
				for(var key in obj){
					if(!Object.prototype.hasOwnProperty.call(obj,key)) continue;
					this[key] = obj[key];
				}
			},

			add:function(name, object){

				var idx = (this._path + '.' + name).toUpperCase();
				NAMESPACE_INDEX[idx] = this[name] = object;

			},

			lookup:function(name){
				return getNamespace.call(this,name,false, true);
			},

			list: function(){

				var fn = function(ns, collection, accumulator, separator){


					var props = Object.keys(ns);

					for(var i=0; i < props.length; i++){
						if(! ns.propertyIsEnumerable(props[i]) ||  !ns.hasOwnProperty(props[i])) continue;
						/*
						 * Process children of the namespace recursively
						 * */
						if(ns[props[i]] instanceof Namespace)
							fn(ns[props[i]], collection, accumulator+separator+props[i], '.');
						else {

							var type = typeof(ns[props[i]]);
							var path = '';

							if(type === 'function')
								path = accumulator + separator + '{' + props[i] + '}';
							else
							if (type === 'object')
								path = accumulator + separator + '[' + props[i] + ']';
							else
								path = accumulator+separator+props[i];


							collection.push(path);
						}
					}

					return;
				}

				var namespaces = [];
				fn(this,namespaces, '','');

				for(var i=0; i< namespaces.length; i++){
					core.info.log(namespaces[i]);
				}

			}
	};



	/**
	 * Public Namespace interface
	 * returns Namespace or a namespace proxy object
	 * */

	Namespace.list = function(){
		/*
		 * get owened properties on the global window object
		 * */
		var keys = Object.keys(window);

		for(var i = 0; i < keys.length; i++ ) {
			var prop = keys[i];
			var foo =  window[prop];
			if(foo instanceof Namespace) {
				var a = {};a[prop] = window[prop];
				Namespace.prototype.list.call(a);
			}
		}
	};

	Namespace.listIndex = function(){
		for(var key in NAMESPACE_INDEX){
			if(NAMESPACE_INDEX.hasOwnProperty(key))
				logging.debug.log(key);
		}
	};

	Namespace.lookup = function(qualifiedName){
		logging.debug.log('searching ' + qualifiedName);
		return getNamespace.call(window,qualifiedName,false, true);
	};

	Namespace.lookupIndex = function(qualifiedName){
		var idx = qualifiedName.toUpperCase();

		return NAMESPACE_INDEX[idx];
	};



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

	function _super(inst,b,args){
		if(!b) return;
		_super(inst,b.base,args);
		b.apply(inst,args);
	};


	function prototype(_class,_proto){
		return mixin(_class.prototype,_proto);
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



	var defaultSplash =(function(){

			var splash = new Controller();
			var view = new View(
				'<div></div>')
			.style('position:absolute; top:0px; left:0px; height:4px; width:0%; background-color:#48DBEA;' +
						 '-webkit-box-shadow: 0px 2px 11px 2px rgba(0,0,0,0.75); '+
						 '-moz-box-shadow: 0px 2px 11px 2px rgba(0,0,0,0.75);'+
						 ' box-shadow: 0px 2px 11px 2px rgba(0,0,0,0.75);');

			splash.views = {root:view};
			splash.update = function(total, complete, itemName){
				  var p = Math.round(complete/total*100);
					if(!this.progress || this.progress < p) this.progress = p;
					this.views.root.htmlElement.style.width = this.progress + '%';
			}
			return splash;
	})();

	var LoadingWatcher = {

		splashScreen : defaultSplash,
		initialInclude : 1,
		getLoaderProgress : function(){
			return LOADER_PROGRESS;
		},

		notify:function(current){
			this.name = current.name;
			this.url = current.url;

			if(!this.splashScreen) return;

			this.splashScreen.update(LOADER_PROGRESS.total,LOADER_PROGRESS.complete,current.name);
		},

		update:function(){
			if(!this.splashScreen) return;
			this.splashScreen.update(LOADER_PROGRESS.total,LOADER_PROGRESS.complete);
		}
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
	 *
	 * Namespace stores functions(classes) and not instances of the
	 * objects
	 * Returns a namespace object,
	 * If the namespace object does not exist it is created
	 *
	 * Namespaces may not have common root namespace
	 *
	 * */
	function getNamespace(namespace, isCreate, isLookup){

		var parts = namespace.split('.');

		var ns = this;
		if(!ns) ns = window;

		var last = null;


		var separator = '', path = '';

		for(var i=0; i<parts.length; i++){

			path = path + separator + parts[i];

			if(!ns[parts[i]]) {
				if(isCreate === true) ns[parts[i]] = new Namespace(path);
				else return null;
			}

			ns = ns[parts[i]];

			/*
			 * if current object is not Namespace
			 * stop the loop
			 * */
			if(!(ns instanceof Namespace) ) break;

			if(ns instanceof Namespace){
				last = ns;
			}

			separator = '.';

		} // end for

		if(isLookup === true){
			if(i+1 == parts.length) return ns;
			else return null;
		}

		return ns;
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


	function mixin(target, source){
		if(!source) return target;
		var keys = Object.keys(source);

		for(var i=0; i< keys.length; i++){
			var key = keys[i];
			target[key] = source[key];
		}
		return target;
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

	function runAsync(fn){
		var asyncfn = function(){
			setTimeout(1,function(){
				fn()
			});
		}

		asyncfn.call = function(){

				fn.apply(arguments[0])

		};
		return asyncfn;
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


/*

--------------------------------------

	Core exports

*/

	var consoleLog = console.log.bind(console);


	var sjsExports = mixin(Object.create(null), {

		debug:{
			log : consoleLog,
			info: logging.info,
			enable:function(){
				this.log = consoleLog;
				logging.debug.log = consoleLog;
			},
			disable:function(){
				this.log  = function(){}
			}
		},

		config : configuration,

		boot : boot,
		toPath : toPath,
		home : home,

		propname: propertyName,
		absPath : absPath,
		getPath : getPath,
		pathvar : setPathVar,
		display : display,
		close 	: close,
		endswith:endsWith,
		mixin	: mixin,
		binding : binding,
		proxy	: proxy,
		propvalue : propertyValue,
		async: runAsync,
		getter: valueGetter,
		setter: valueSetter,
		view:function(d){
			if(!d) return _viewQueryMode();
			return new View(d);
		},
		timing	:	measureRuntime,

		load	: include,
		include : include,
		fname:getFunctionName,

		Namespace: Namespace,
		Class : Class,
		Controller : Controller,
		SplashScreenController : SplashScreenController,
		types : {
			View:View,
			Controller:Controller
		},

		prototype:prototype,

		HttpRequest : HttpRequest,
		Event : EventSingleton,
		event:	Event,
		Tokenizer:Tokenizer,
		UrlAnalyzer:UrlAnalyzer,

		onReady:onReady,

		modules: listModules

});
	if(configuration.startup === 'user'){
			sjsExports.start = function(){start();}
	}

	function sjs(m) {
		//free module definition
		if(typeof m === 'function') return Module({definition:m});
		//dependent module definition
		if( typeof m === 'object' && typeof m.definition === 'function') return Module(m);

		//lookup module
		if(typeof m  === 'string'){
			var mdl = findModule(m);
			return function(callback){
				if(mdl != null) {
					if(typeof callback === 'function') {
						callback(mdl); return;
					}
				}

				load([m],function(){
					if(typeof callback === 'function') {
						var mdl = findModule(m);
						if(mdl != null)	callback(mdl);
					}
				})
			};
		}

		return sjsExports;}
	//core.debug = debug;
	return sjs;

})(window,document);
