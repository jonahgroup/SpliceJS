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

var _ = (function(window, document){
	"use strict";
	
	/* Loading indicator 
	 * */
	
	new Image().src = ( window.SPLICE_PUBLIC_ROOT || '') + 'public/jscript/sengiloading.gif';
	
	
	if(!window.console) { 
		window.console = {log:function(){}}; 
	}

	/*
	 * No support for bind
	 * use closure to emulate
	 * must support Function.prototype.apply()
	 * */
	if(!Function.prototype.bind) {
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
	
	
	function Splice(){
		/*
		 * loader initializers
		 * */
		this.PUBLIC_ROOT = window.SENGI_PUBLIC_ROOT || '';
		
		window.onload = (function(){
			/*!!!! dont remove main page dom, thats just NOT COOL, rework */
			/*
			document.body.innerHTML = 
				'<div style="position:absolute; left:50%; top:50%; font-family:Arial; font-size:11px; color:#101010;">' + 
				'<img style="position:absolute; top:-21px; left:-21px;" src="'+this.PUBLIC_ROOT+'public/jscript/sengiloading.gif"/>'+
				'</div>';
			*/
			if(typeof(this.run) === 'function') this.run();
		}).bind(this);
	};
	
	
	/**
	 * Debug and info log harness
	 * */
	Splice.prototype.debug  = {log:function(){}};
	Splice.prototype.info = console;
	
	Splice.prototype.debugDisable = function(){
		Splice.prototype.debug = {log:function(){}};
	};	
	
	Splice.prototype.debugEnable = function(){
		Splice.prototype.debug = console;
	};
	
	
	if(window.performance && window.performance.now)
	Splice.prototype.performance = {
			now:function(){
				return window.performance.now();
			}
	};
	
	
	if(!window.performance || !window.performance.now)
		Splice.prototype.performance = {
			now:function(){
				return (new Date()).getTime();
			}
	};
	
	
	Splice.prototype.splitQualifiedName = function(name){
		
		if(!name) return;
		var parts = name.split('.');
		
		var ns = '';
		var separator = '';
		
		for(var i=0; i < parts.length - 1; i++){
			ns += separator + parts[i];
			separator = '.';
		}
		return {namespace:ns, name:parts[parts.length-1]};
	}
	
	/** Namespace object
	 * 
	 * */
	var Namespace = function Namespace(){};
	Namespace.prototype = {
			
			Class: function(constructor){
				return Splice.prototype.Class.call({namespace:this},constructor);
			},
			
			add:function(name, object){
				this[name] = object;
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
					Splice.prototype.info.log(namespaces[i]);
				}
				
			}
	};
	
	/**
	 * Public Namespace interface
	 * returns Namespace or a namespace proxy object
	 * */
	Splice.prototype.Namespace = function(namespace) {
		var ns = getNamespace(namespace,false, false);
		
		/* 
		 * return Namespace proxy with Class constructor
		 * */
		if(ns == null){
			return {
				Class:function(constructor){
					var newNamespace = getNamespace(namespace,true);
					return Splice.prototype.Class.call({namespace:newNamespace},constructor);
				},
				add:function(name, object){
					var newNamespace = getNamespace(namespace,true);
					newNamespace[name] = object;
				}
			}
		}
		
		/*
		if(!ns.Class) ns.Class = function(constructor){
			return Splice.prototype.Class.call({namespace:this},constructor);
		};
		*/
		return ns;
	};
	
	Splice.prototype.Namespace.list = function(){
		/* 
		 * get owened properties on the global window object 
		 * */
		var keys = Object.keys(global);
		
		for(var i = 0; i < keys.length; i++ ) {
			var prop = keys[i];
			var foo =  global[prop];
			if(foo instanceof Splice.prototype.Interface.Namespace) {
				var a = {};a[prop] = global[prop];
				Namespace.prototype.list.call(a);
			}
		}
	}
	
	Splice.prototype.Namespace.lookup = function(qualifiedName){
		Splice.prototype.debug.log('searching ' + qualifiedName);
		return getNamespace(qualifiedName,false, true);
	}
		
	/**
	 * pseudo class wrapper
	 * */
	Splice.prototype.Class = function Class(constructor){
		
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
			
			return this;
			
		};
		
		return constructor;
	};
	
	
	
	var _url_cache = new Array();	
	
	String.prototype._endswith = function(ending){
		var matcher = new RegExp("^.+"+ending.replace(/[.]/,"\\$&")+'$');
		var result = matcher.test(this); 
		return result;
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
	 * @param {Function} oncomplete  Callback, invoked when last resource in the list is loaded
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
		
		//loading is complete run oncomplete handler
		if(loader.progress <= 0) {
			this.iterator = null; this.oncomplete(); this.oncomplete = null; this.onitemloaded = null;
			return;
		}

		var obj = loader.iterator.next();
		if(!obj) return;
		
		var filename = obj; 
				
		if(typeof filename == 'object') {
			filename =  filename.src;
		}
		
		/*
		 * */
		if(filename._endswith(".css") || filename._endswith(".js") )
		if(_url_cache[filename] === true){
			Splice.prototype.debug.log('File ' + filename + ' is already loaded, skipping...');
			loader.progress--; loader.loadNext(watcher);
			return;
		}
		
		Splice.prototype.debug.log('Loading: ' + filename);
		
		var head = document.getElementsByTagName('head')[0];
		
		if(filename._endswith(".css")){
			var linkref = document.createElement('link');
			
			//tell Splice what is loading
			watcher.notifyCurrentlyLoading(linkref);
			
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
		}

		
		if(filename._endswith(".js")) {
			var script = document.createElement('script');
			
			//tell Splice what is loading
			watcher.notifyCurrentlyLoading(script);
			
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
		}
		
		if(filename._endswith('.html')){
			_.HttpRequest.post({
				url: filename,
				onok:function(response){
					loader.onitemloaded({name:obj.name, data:response.text});
					loader.progress--; loader.loadNext(watcher);
				}
			});
			
		}
		
	};
	
	
	function peek(a){
		if(!a) return null;
		if(a.length > 0) return a[a.length - 1];
		return null;
	};
	
	Splice.prototype.include = function(resources, oncomplete, isnested, onitemloaded){

		
		if(isnested) { 
			Splice.prototype.debug.log('Nested loading...');
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

		} else {
			new Loader(resources, oncomplete,onitemloaded).loadNext(this);
		}
		
	};

	
	Splice.prototype.notifyCurrentlyLoading = function(obj){
		this.currentlyLoading = obj;
	};
	
	
	
	
	var _names = new Namespace(); //namespace container
	
	
	/*
	 * Returns function's name
	 * First tries function.name property
	 * Next name is parsed from the function.prototype.toString output
	 * */
	function getFunctionName(foo){
		if(foo.name) return foo.name;
		
		if(typeof foo != 'function') throw 'Unable to obtain function name, argument is not a function'
					
		var match = /function\s+([\w\$])\(/igm.exec(foo.toString());
		
		if(!match)  throw 'Unable to obtain function name';
		return match[1];
	}
	
	Splice.prototype.getFunctionName = getFunctionName;
	
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
		
		var ns = global;
		var last = null;
		
		for(var i=0; i<parts.length; i++){
			if(!ns[parts[i]]) { 
				if(isCreate === true) ns[parts[i]] = new Namespace();
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
		}
		
		if(isLookup === true) return ns;
		return last;
	};
	
	
	
	/*
	 * Interfaces name space
	 * */
	Splice.prototype.Interface = {};
	Splice.prototype.Interface.Namespace = Namespace;
	
	
	
	/**
	 * Application API
	 * */
	Splice.prototype.Application = {};
	Splice.prototype.Application.start = function(args){
		/* break out of the initializer stack*/
		setTimeout(function(){_.Application.main(args);},10);
	};

	
	return new Splice();
})(window,document);


