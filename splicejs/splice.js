
/*

SpliceJS
  
The MIT License (MIT)

Copyright (c) 2015 jonahgroup

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


var _ = sjs = (function(window, document){
	"use strict";


	var configuration = {
		APPLICATION_HOME: 				getPath(window.location.href).path, 
		PUBLIC_ROOT:         			window.SPLICE_PUBLIC_ROOT,
		ONLOAD_DISP_SHORT_FILENAME: 	window.SPLICE_ONLOAD_DISP_SHORT_FILENAME, 
		platform: {	
			IS_MOBILE: 			window.SPLICE_PLATFORM_IS_MOBILE,
			IS_TOUCH_ENABLED: 	window.SPLICE_PLATFORM_IS_TOUCH_ENABLED
		}
	};


	/*
	  	Bootloading files
	*/
	var BOOT_SOURCE = [];


	/*
		Core object released into global space
	*/
	var core = {};


	/* 
	 	Cache loading indicator 
	*/
	new Image().src = ( configuration.PUBLIC_ROOT || '') + '/resources/images/bootloading.gif';

	
	if(!window.console) { 
		window.console = {log:function(){}}; 
	}



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
	
	
	
	var tempBodyContent = '';
	var progressLabel = null;
	function showPreloader(){
		if(window.SPLICE_SUPPRESS_PRELOADER) return;
		tempBodyContent = document.body.innerHTML;
		document.body.innerHTML = 
		'<div style="position:absolute; left:10%; top:50%; font-family:Arial; font-size:0.7em; color:#101010;">'+
		'<div style="position:relative; top:-20px">'+
			'<div style="display:inline;"><img style="vertical-align:middle;" src="'+window.SPLICE_PUBLIC_ROOT+'/resources/images/bootloading.gif"/></div>'+
			'<div style="display:inline; padding-left:1em;"><span></span></div>'+
		'</div>'+
		'</div>';

		
		progressLabel = document.body.querySelectorAll('span')[0];
	}
	
	function removePreloader(){
		if(window.SPLICE_SUPPRESS_PRELOADER) return;
		document.body.innerHTML = tempBodyContent;
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
		return collapsePath(configuration.APPLICATION_HOME+'/'+path);
	};


	function getPath(path){
		var index = path.lastIndexOf('/');

		if(index < 0) return {name:path};
		return {
			path:path.substring(0,index),
			name:path.substring(index+1)
		}
	};
	

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
		
		if(!match)  throw 'Unable to obtain function name';
		return match[1];
	};


	/* make this more efficient */
	function endsWith(text, pattern){
		var matcher = new RegExp("^.+"+pattern.replace(/[.]/,"\\$&")+'$');
		var result = matcher.test(text); 
		return result;
	}



/*
	
----------------------------------------------------------
	
	SpliceJS Event Model

*/
	
	var Event = function Event(){};


	Event.create = function(object, property){


		var callbacks = [], instances = [];

		var MulticastEvent = function MulticastEvent(){

			for(var i=0; i < callbacks.length; i++) {
				callbacks[i].apply(instances[i],arguments);
			}
		}

		MulticastEvent.SPLICE_JS_EVENT = true; 

		/* 
			"This" keyword migrates between assigments
			important to preserve the original instance
		*/
		MulticastEvent.subscribe = function(callback, instance){
			if(!callback) return;
			if(typeof callback !== 'function') throw 'Event subscriber must be a function';

			if(!instance) instance = this;

			callbacks.push(callback);
			instances.push(instance);
		}

		if(!object || !property) return MulticastEvent;

		/* handle object and property arguments */
		var val = object[property];

		if(val && val.SPLICE_JS_EVENT) return val;

		if(typeof val ===  'function') {
			MulticastEvent.subscribe(val, object);		
		}
		object[property] = MulticastEvent;
		
		
		return MulticastEvent;
	}

	core.Event = Event;



/*

----------------------------------------------------------
	
	Binding Model

*/

	
	/* 
	 * !!! Bidirectional bindings are not allowed 
	 * */
	var Binding = function Binding(propName,type,dir){
		if(!(this instanceof Binding)) return {
			Self:   		new Binding(propName,	Binding.SELF,   		Binding.Direction.AUTO),
			Parent: 		new Binding(propName,	Binding.PARENT, 		Binding.Direction.AUTO),
			FirstParent: 	new Binding(propName,	Binding.FIRST_PARENT, 	Binding.Direction.AUTO),
			Root:			new Binding(propName,	Binding.ROOT, 			Binding.Direction.AUTO),
			Type:			function(type){
							var b = 
							new Binding(propName, 	Binding.TYPE, 			Binding.Direction.AUTO); 
							b.vartype = type;
							return b;}
		}
		
		this.prop = propName;
		this.type = type;
		this.direction = dir;
		
	};
	
	
	Binding.Template = function(templateName){
		return new Binding(templateName, Binding.TEMPLATE, Binding.Direction.FROM);
	};
	
	Binding.From = function(propName){
		return {
			Self:   		new Binding(propName,	Binding.SELF,   Binding.Direction.FROM),
			Parent: 		new Binding(propName,	Binding.PARENT, Binding.Direction.FROM),
			FirstParent: 	new Binding(propName,	Binding.FIRST_PARENT, Binding.Direction.FROM),
			Root:			new Binding(propName,	Binding.ROOT, Binding.Direction.FROM),
			Type:			function(type){
							var b = 
							new Binding(propName, 	Binding.TYPE, Binding.Direction.FROM); 
							b.vartype = type;
							return b;}
		}
	};
	
	Binding.To = function(propName){
		return {
			Self:   		new Binding(propName, 	Binding.SELF,   Binding.Direction.TO),
			Parent: 		new Binding(propName, 	Binding.PARENT, Binding.Direction.TO),
			FirstParent: 	new Binding(propName, 	Binding.FIRST_PARENT, Binding.Direction.TO),
			Root:			new Binding(propName, 	Binding.ROOT, 	Binding.Direction.TO),
			Type:			function(type){
							var b = 
							new Binding(propName, 	Binding.TYPE, Binding.Direction.TO); 
							b.vartype = type;
							return b;}

		}
	};
	
	Binding.findValue = function(obj, path){
		var nPath = path.split('.'),
			result = obj;

		if (!obj) return null;

		for (var i = 0; i< nPath.length; i++){
			
			result = result[nPath[i]];

			if (!result) return null;	
		}

		return result;
	}


	Binding.Value = function(obj){

		

		return {
			set : function(value, path){

				var nPath = path.split('.');
					
				for(var i=0; i< nPath.length-1; i++){
					obj = obj[nPath[i]];
				}

				if(obj) {
					obj[nPath[nPath.length-1]] = value;
				}

			},

			get : function(path){

				var nPath = path.split('.'),
					result = obj;

				if(nPath.length < 1) return null; 	

				for (var i = 0; i< nPath.length; i++){
			
					result = result[nPath[i]];

					if (!result) return null;	
				}

				return result;
			},

			instance:function(path){

				var nPath = path.split('.'),
					result = obj;

				for (var i = 0; i< nPath.length-1; i++){
			
					result = result[nPath[i]];

					if (!result) return null;	
				}

				return result;

			},

			path:function(path){
				var nPath = path.split('.');
				return nPath[nPath.length-1];
			}
		}

	};





/*

----------------------------------------------------------

	Templating Engine
	Implementation

*/
	
	var Scope = function Scope(path){
		this.path = path;
		this.compindex = [];
		this.itc = 0;
	};

	Scope.prototype.getNextTemplateName = function(){
		return '__impTemplate' + (this.itc++);
	};


		/** 
	 * 
	 * @tie
	 * 
	 * @template
	 * 
	 * @module is a scope object where modules have been declared
	 * used for resolving references to local-scoped templates
	 * when invoked by parent, module points to the parent's context
	 * 
	 * */
	function createComponent(tie, template, scope){
		/*
		 * Component function is assigned to the variable of the same name
		 * "Component" because otherwise in IE8 instanceof operation on "this"
		 * implicit object does not return true on this instanceof Component
		 * IE8 seems to evaluare the operator against the name of the
		 * function that created the object
		 * */
		var Component = function Component(args){
			
			if(!(this instanceof Component)) throw 'Component function must be invoked with [new] keyword';

			
			
			var args = args || {};
			
			var obj = Object.create(tie.prototype);
			obj.constructor = tie;
			
			obj.parent = args.parent;
			obj.ref = {};
			obj.elements = {};
			obj.children = [];
			
			/* 
			 * assign reference to a parent and 
			 * append to children array
			 * */
			if(obj.parent) { 
				obj.parent.ref 		= obj.parent.ref || [];
				obj.parent.children = obj.parent.children || [];

				if(args.ref) obj.parent.ref[args.ref] = obj;
				obj.parent.children.push(obj);						
			}
			

			/*
				Auto-creating event casters
				
			*/
			for(var key in  obj){
				if(obj[key] == _.Event){
					core.debug.log('Found event object');
					obj[key] = core.Event.create();
				}	
			}	



			/*
			 * Bind declarative parameters
			 *
			 */
			var tieInstance = obj; 
			var parameters = args;
			if(parameters) {
				var keys = Object.keys(parameters);
				for(var k=0; k< keys.length; k++) {
				
					var key = keys[k];

					if(key === 'ref') 		continue;
					if(key === 'content') 	continue; //content is processed separately
					
					if(parameters[key] instanceof _.Binding) {
						var binding = parameters[key]; 
						resolveBinding(binding, tieInstance, key, scope);
						continue;
					}
				
					/* default property assignment */
					tieInstance[key] = parameters[key];
				}
			}

			if(template)
			obj.concrete = template.getInstance(obj, args, scope);
			

			tie.apply(obj, [args]);
			return obj; 
			
		};
		
		if(tie) Component.base = tie.base;
		
		/* fill for extending classes */
		Component.call = function(_this){
			var args = [];
			if(arguments.length > 1) {
				for(var i=1; i<arguments.length; i++){
					args[i] = arguments[i];
				}
			}
			tie.apply(_this,args);
		};

		Component.isComponent = true;
		Component.template = template;
		Component.tie = tie;
		Component.prototype = tie.prototype;
		Component.constructor = tie;
		return Component;
	}; 



	/**
	 * Proxy Object factory
	 * @type: data type of the object to be created
	 * @parameters:	parameters to be passed to the object behind proxy
	 * */
	var Obj = function Obj(args){
		/*
		 * Scope object
		 * */
		var scope = this;
		
		var Proxy = function Proxy(proxyArgs){
			if(!(this instanceof Proxy) ) throw 'Proxy object must be invoked with [new] keyword';
		
			/* create instance of the proxy object
			 * local scope lookup takes priority
			 */
			var obj = scope.templates[args.type] || scope[args.type] || _.Namespace.lookup(args.type);
			var tieOverride = null;

			if(!obj) throw 'Proxy object type ' + args.type + ' is not found';
			if(typeof obj !== 'function') throw 'Proxy object type ' + args.type + ' is already an object';
			

			/* locate tie, if override was specified */
			if(args.tie) {
				tieOverride = scope[args.tie] || _.Namespace.lookup(args.tie);
				if(!tieOverride) throw 'Tie type cannot be found';
			}

			/* copy args*/
			var parameters = {};
			var keys = Object.keys(args);
			for(var i = 0; i < keys.length; i++ ){
				var key = keys[i];
				if(key == 'type' || key == 'tie') continue; /* skip type */
				parameters[key] = args[key];
			}

			/* override proxy arguments */
			if(proxyArgs){
				var keys = Object.keys(proxyArgs);
				for(var i=0; i<keys.length; i++){
					var key = keys[i];
					//parameters['parent'] = proxyArgs.parent; 
					parameters[key] = proxyArgs[key]; 
				}
				
			} 
			
			
			/* create new component*/
			if(typeof tieOverride === 'function') {
				obj = createComponent(tieOverride, obj.template, scope);
			}


			return new obj(parameters);	
		}
		
		Proxy.type 			= args.type;
		Proxy.ref 			= args.ref;
		Proxy.parameters 	= args;
		
		return Proxy;
		
	};


	core.Obj = Obj;






/*

----------------------------------------------------------

	SliceJS Core
	Implementation

*/


	core.configuration = configuration;

	/*
	 * loader initializers
	 * */
	core.PUBLIC_ROOT = window.SPLICE_PUBLIC_ROOT ? window.SPLICE_PUBLIC_ROOT : '';
	
	window.onload = function(){
		
		if(BOOT_SOURCE.length > 1) {
			core.include(BOOT_SOURCE, function(){
				if(typeof(core.run) === 'function') core.run();	
			})
		}
		else {
			if(typeof(core.run) === 'function') core.run();
		}

	};

	
	
	/**
	 * Debug and info log harness
	 * */
	core.debug  = {log:function(){}};
	core.info = console;
	
	core.debugDisable = function(){
		core.debug = {log:function(){}};
	};	
	
	core.debugEnable = function(){
		core.debug = console;
	};
	


	core.boot = function(args){

		if(!args) return null;
		if(!(args instanceof Array) ) return null;
		
		for(var i=0; i< args.length; i++){
			BOOT_SOURCE.push(args[i]);
		}

		return core.boot;
	}



	core.home = function(obj,path){


		if(!path) var path = window.SPLICE_PUBLIC_ROOT;

		if(!obj) return path;

		if(typeof obj === 'string'){
			if(obj.indexOf(window.SPLICE_PUBLIC_ROOT) === 0) return obj;
			return path + '/' + obj;
		}

		if(obj instanceof Array){
			for(var i=0; i < obj.length; i++){
				obj[i] = core.home(obj[i],path);
			}
			return obj;
		}

	};



	core.absPath = absPath;
	core.getPath = getPath;
	
	if(window.performance && window.performance.now)
	core.performance = {
			now:function(){
				return window.performance.now();
			}
	};
	
	
	if(!window.performance || !window.performance.now)
		core.performance = {
			now:function(){
				return (new Date()).getTime();
			}
	};
	
	core.splitQualifiedName = function(name){
		
		if(!name) return null;
		var parts = name.split('.');
		
		var ns = '';
		var separator = '';
		
		for(var i=0; i < parts.length - 1; i++){
			ns += separator + parts[i];
			separator = '.';
		}
		return {namespace:ns, name:parts[parts.length-1]};
	}
	



	var NAMESPACE_INDEX = [];

	/** Namespace object
	 * 
	 * */
	var Namespace = function Namespace(path){
		this._path = path;
	};

	Namespace.prototype = {
			
			Class: function(constructor){
				var idx = (this._path + '.' + getFunctionName(constructor)).toUpperCase(); 
				return core.Class.call({namespace:this,idx:idx},constructor);
			},
			
			add:function(name, object){

				var idx = (this._path + '.' + name).toUpperCase(); 
				NAMESPACE_INDEX[idx] = this[name] = object;

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
	core.Namespace = function(namespace) {
		var ns = getNamespace(namespace,false, false);
		
		if(ns && !(ns instanceof Namespace)) 
			throw "Namespace " + namespace + " is ocupied by an object ";
		
		/* 
		 * return Namespace proxy with Class constructor
		 * */
		if(ns == null){
			return {
				Class:function(constructor){
					
					var idx = (namespace + '.' + getFunctionName(constructor)).toUpperCase(); 
					var newNamespace = getNamespace(namespace,true);
					return core.Class.call({namespace:newNamespace, idx:idx}, constructor);

				},

				add:function(name, object){
					
					var idx = (namespace + '.' + name).toUpperCase(); 

					var newNamespace = getNamespace(namespace,true);
					NAMESPACE_INDEX[idx] = newNamespace[name] = object;

				}
			}
		}
		
		
		return ns;
	};
	
	core.Namespace.list = function(){
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
	
	core.Namespace.listIndex = function(){
		for(var key in NAMESPACE_INDEX){
			if(NAMESPACE_INDEX.hasOwnProperty(key))
				core.debug.log(key);
		}
	};

	core.Namespace.lookup = function(qualifiedName){
		core.debug.log('searching ' + qualifiedName);
		return getNamespace(qualifiedName,false, true);
	};

	core.Namespace.lookupIndex = function(qualifiedName){
		var idx = qualifiedName.toUpperCase();

		return NAMESPACE_INDEX[idx];
	};
		
	/**
	 * pseudo class wrapper
	 * */
	core.Class = function Class(constructor){
		
		if(!constructor) throw 'constructor function may not be empty';
		if(typeof(constructor) !== 'function' ) throw 'Constructor must be a function';
		
		/* 
		 * Class is being declaired within a namespace
		 * Attached constructor to a namespace instance
		 * */
		if(this.namespace){
			var constructorName = getFunctionName(constructor); 

			/*
			 * Definition already exists, throw na error
			 * */
			if(this.namespace[constructorName]) throw constructorName + ' is already defined, please check namespace and definition name';
			
			this.namespace[constructorName] = constructor;
			NAMESPACE_INDEX[this.idx] = constructor;
		}
		
		/*
		 * Any class is a descendant of the Object 
		 * */
		constructor.base = Object;
		
		
		/* *
		 * Prototype extension shorthand, 
		 * created on a supplied constructor Object
		 */
		constructor.extend = function(base){
			
			if(!base) throw 'Can\'t extend the undefined or null base constructor';
			if(typeof(base) !== 'function') throw 'Base must be a constructor function';
					
			
			this.prototype = Object.create(base.prototype);
			/* retain inheritance chain */
			this.base = this.prototype.constructor;			
			this.prototype.constructor = this;
			/*
			this.prototype.super = function(){
				base.apply(this,arguments);
			}
			*/
			return this;
			
		};
		
		return constructor;
	};
	
	
	
	var _url_cache = new Array();	
	
	
	
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
		
		if(!resources || resources.length == 0) return null;
		
		this.iterator = new Iterator(resources);
		this.progress = resources.length;
		this.isActive = true;
		this.oncomplete = oncomplete;
		this.onitemloaded = onitemloaded;
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
		var runnable = null;
		
		/*
		 * this is inline file 
		 */		
		if(typeof filename == 'object') {
			filename =  obj.name;
			runnable =  obj.source;
		}
		
		/*
		 * qualify filename
		 * */
		//filename = window.SPLICE_PUBLIC_ROOT +'/'+filename;
		var relativeFileName = filename; 
		filename = _.absPath(filename);

		/*
		 * */

		if(	endsWith(filename, ".css") || 
			endsWith(filename, ".js")  || 
			endsWith(filename, ".htmlt") )
		if(_url_cache[filename] === true){
			core.debug.log('File ' + filename + ' is already loaded, skipping...');
			loader.progress--; loader.loadNext(watcher);
			return;
		}
		
		core.debug.log('Loading: ' + filename);
		
		var head = document.getElementsByTagName('head')[0];
		
	    /*
		 * Run the inline pseudo file
		 */
		if(runnable){

			runnable();
			_url_cache[filename] = true;
			loader.onitemloaded();
			loader.progress--; loader.loadNext(watcher);
			return;
		
		} 	

		/*
		 * Load CSS Files
		 * */
		if(endsWith(filename, ".css")){
			var linkref = document.createElement('link');
			
			//tell Splice what is loading
			watcher.notifyCurrentlyLoading({name:relativeFileName,obj:linkref});
			
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
					_url_cache[filename] = true;
					loader.onitemloaded();
					loader.progress--; loader.loadNext(watcher);
				}
			};
			head.appendChild(linkref);
			return;
		}

		/*
		 * Load javascript files
		 * */
		if(endsWith(filename, ".js")) {
			var script = document.createElement('script');
			
			//tell Splice what is loading
			watcher.notifyCurrentlyLoading({name:relativeFileName,obj:script});
			
			script.setAttribute("type", "text/javascript");
			script.setAttribute("src", filename);
			
			script.onload = script.onreadystatechange = function(){
				if(!script.readyState || script.readyState == 'complete' || script.readyState == 'loaded') {
					_url_cache[filename] = true;
					loader.onitemloaded();
					loader.progress--; loader.loadNext(watcher);
				}
			};
			head.appendChild(script); 
			return;
		}
		
		/*
		 * Load html templates
		 * */
		if(endsWith(filename, '.htmlt')){
			//tell Splice what is loading
			watcher.notifyCurrentlyLoading({name:relativeFileName,obj:null});
			_.HttpRequest.get({
				url: filename,
				onok:function(response){
					_url_cache[filename] = true;
					loader.onitemloaded({ext: 'htmlt', filename:filename, data:response.text});
					loader.progress--; loader.loadNext(watcher);
				}
			});
			return;
		}
		
	};
	
	
	function peek(a){
		if(!a) return null;
		if(a.length > 0) return a[a.length - 1];
		return null;
	};
	
	core.dumpUrlCache = function (){ 
		var cache = [];
		for(var key in _url_cache){
			if( _url_cache.hasOwnProperty(key)) {
				_.info.log(key);
				cache.push(key);
			}
		}
		return cache;
	};
	
	core.include = function(resources, oncomplete, onitemloaded){
		
		/*
		 * Initial bootstrap
		 * */
		
		if(!this.isInitialInclude) {
			showPreloader();
			
			var foo = oncomplete;
			var oncomplete = function(){
				removePreloader();
				if(typeof foo === 'function') foo();
			}
			this.isInitialInclude = true;
		}

		/*
		 * Always perform nested loading
		 * */
		core.debug.log('Nested loading...');
		var loader = new Loader(resources, (function(){
			Loader.loaders.pop();
			if(typeof(oncomplete)  === 'function') oncomplete();
			
			var queuedLoader = 	peek(Loader.loaders);

			if(queuedLoader) queuedLoader.enable().loadNext(this);
			
		}).bind(this), onitemloaded);
		 
		//suspend current loader
		var currentLoader = peek(Loader.loaders);
		if(currentLoader) currentLoader.disable();
		
		Loader.loaders.push(loader); 
		loader.loadNext(this);
	};

	
	
	core.notifyCurrentlyLoading = function(current){
		this.currentlyLoading = current;
		if(!progressLabel) return;

		var label = current.name;
		
		if(configuration.ONLOAD_DISP_SHORT_FILENAME)
			label = getPath(current.name).name;

		progressLabel.innerHTML = label;
	};
	
	
	core.load = function(moduleUrls, oncomplete){
		this.include(moduleUrls, oncomplete);
	};
	

	
	core.getFunctionName = getFunctionName;
	
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
		
		var ns = window;
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
	
	return core;
})(window,document);


