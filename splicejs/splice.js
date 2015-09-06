

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

	var configuration = {
		APPLICATION_HOME: 				getPath(window.location.href).path, 
		SPLICE_HOME:         			window.SPLICE_HOME,
		ONLOAD_DISP_SHORT_FILENAME: 	window.SPLICE_ONLOAD_DISP_SHORT_FILENAME,
		IS_DEBUG_ENABLED:				window.SPLICE_IS_DEBUG, 
		platform: {	
			IS_MOBILE: 			window.SPLICE_PLATFORM_IS_MOBILE,
			IS_TOUCH_ENABLED: 	window.SPLICE_PLATFORM_IS_TOUCH_ENABLED
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
	new Image().src = ( configuration.SPLICE_HOME || '') + '/resources/images/bootloading.gif';

	
	if(!window.console) { 
		window.console = {log:function(){}}; 
	}

	var logging = {
		debug : {log:function(){}},
		info  : console
	}; 

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
			'<div style="display:inline;"><img style="vertical-align:middle;" src="'+configuration.SPLICE_HOME+'/resources/images/bootloading.gif"/></div>'+
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


	function peek(a){
		if(!a) return null;
		if(a.length > 0) return a[a.length - 1];
		return null;
	};
	
	function dfs(dom, target, filterFn, nodesFn){
		if(!dom) return;
		
		
		if(typeof filterFn === 'function') {
			var node = filterFn(dom);  
			if(node) target.push(node);
		} else {
			target.push(dom);
		} 
		
		
		var children = [];
		if(typeof nodesFn === 'function'){
			children = nodesFn(dom);
		}
		else {
			children = dom.childNodes;
		}

		for(var i=0; i < children.length; i++){
			var n = dom.childNodes[i];
			dfs(n,target,filterFn, nodesFn);
		}
	}; 

	function selectNodes(dom,filterFn, nodesFn){
		var nodes = new Array();
		dfs(dom,nodes,filterFn, nodesFn);
		if(nodes.length < 1) nodes = null;
		return nodes;
	};


	function selectTextNodes(dom,filterFn){
		var nodes = new Array();
		//nodeType 3 is a text node
		dfs(dom,nodes,function(node){ 
			if(node.nodeType === 3) {
				if(typeof filterFn === 'function')	return filterFn(node);
				return node;
			}
			return null; 
		});
		if(nodes.length < 1) nodes = null;
		return nodes;
	};



	function display(controller,target){
		if(!target) target = document.body;

		target.innerHTML = '';
		target.appendChild(controller.concrete.dom);

		controller.onAttach();
		controller.onDisplay();

	};


	display.overlay = function(controller, target) {
	    if (!target) target = document.body;

	    target.appendChild(controller.concrete.dom);

	    controller.onAttach();
	    controller.onDisplay();
	};

	function close(controller) {
	    controller.concrete.dom.parentNode.removeChild(controller.concrete.dom);
	};

	function isHTMLElement(object){
		if(!object) return false;
		if(object.tagName && object.tagName != '') return true;
		return false;
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
function HomeVariable(){ this.name = 'sjshome';}
function Variable(name){ 
	if(name == 'sjshome') return new HomeVariable();
	if(!(this instanceof Variable)) return new Variable(name);
	this.name = name; 
}
function variableValue(name){
	if(name == 'sjshome') return configuration.SPLICE_HOME;
	return '';
}

function UrlAnalyzer(url){
	if(!(this instanceof UrlAnalyzer)) return new UrlAnalyzer(url);
	var t = new Tokenizer(url)
	,	token = null;
	
	this.parts = [];
	
	while(token = t.nextToken()){
		if(token == '{') {
			this.parts.push(Variable(t.nextToken()));
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
			
			if( part instanceof Variable || 
				part instanceof HomeVariable ){
				url += variableValue(part.name);				
			} else {
				url += part;
			}	
		}
		return url;
	},
	
	isHome:function(){
		return this.parts[0] instanceof HomeVariable;
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
           	try {this.transport = new ActiveXObject(a[i]);}
        	catch (ex) {console.log(ex);}
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
	
	SpliceJS Event Model

*/

	function mousePosition(e){
        //http://www.quirksmode.org/js/events_properties.html#position
		var posx = 0
		,   posy = 0;
		
		if (e.pageX || e.pageY) 	{
			posx = e.pageX;
			posy = e.pageY;
		}
		else if (e.clientX || e.clientY) 	{
			posx = e.clientX + document.body.scrollLeft
				+ document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop
				+ document.documentElement.scrollTop;
		}

		return {x:posx,y:posy};
	};

	
	function domEventArgs(e){
		return {
			mouse: mousePosition(e),
		   	source: e.srcElement,
            e:e,     // source event			
			cancel: function(){
            	this.cancelled = true;
            	e.__jsj_cancelled = true;
            }
		}
	};


	function Event(fn){
		this.transformer = fn;
	};
	Event.prototype.transform = function(fn){
		return new Event(fn);
	};

	Event.prototype.attach = function(object, property, cancelBubble){
		
		var callbacks = [[]], instances = [[]];
		var cleanup = {fn:null, instance:null };
		var transformer = this.transformer;

		var MulticastEvent = function MulticastEvent(){
			var idx = callbacks.length-1;

			/*
				Grab callbacks and instance reference
				stacks may be popped during handler execution
				by another handler that subscribed to the currently
				bubbling event inside an already invoked event handler
			*/
			var cbak = callbacks[idx]
			,	inst = instances[idx]
			,	eventBreak = false
			,	callback_result = null;
			
			
			// nothing to do here, callback array is empty
			if(!cbak || cbak.length <=0 ) return;
			
			
			for(var i=0; i < cbak.length; i++) {
				/*check if event was cancelled and stop handing */
				if(arguments.length > 0 && arguments[0])
				if(arguments[0].cancelled || (arguments[0].e && 
				   							  arguments[0].e.__jsj_cancelled == true)) {
					
					eventBreak = true;
					break;
				}
				
				//invocation parameters
				var _args = arguments;
				var _callback = cbak[i].callback;
				var _inst = inst[i];

				if(MulticastEvent.argumentFilter) {
					if(!MulticastEvent.argumentFilter.apply(_inst, _args)) return;
				}			
				
				//pass arguments without transformation
				if(!transformer) {
					if(cbak[i].is_async) {
						setTimeout(function(){_callback.apply(_inst, _args);},1);
					}
					else 
						callback_result = _callback.apply(_inst, _args);
				}
				else {
					if(cbak[i].is_async) {
						setTimeout(function(){_callback.call(_inst, transformer.apply(_inst,_args));},1)
					}
					else 
						callback_result = _callback.call(_inst, transformer.apply(_inst,_args));
				}	
			}

			if(!eventBreak && typeof cleanup.fn === 'function') {
				cleanup.fn.call(cleanup.instance, MulticastEvent );
				cleanup.fn 		 = null;
				cleanup.instance = null;
			}
			
			return callback_result;
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

			var idx = callbacks.length-1;
			
			callbacks[idx].push({callback:callback,is_async:false});
			instances[idx].push(instance);
			return this;
		};
		
		MulticastEvent.subscribeAsync = function(callback,instance){
			if(!callback) return;
			if(typeof callback !== 'function') throw 'Event subscriber must be a function';

			if(!instance) instance = this;

			var idx = callbacks.length-1;
			
			callbacks[idx].push({callback:callback,is_async:true});
			instances[idx].push(instance);
			return this;
		};

		MulticastEvent.unsubscribe = function(callback){
			var idx = callbacks.length-1;
			for(var i=0; i < callbacks[idx].length; i++) {
				if( callbacks[idx][i] == callback ) {
					logging.debug.log('unsubscribing...');
					callbacks[idx].splice(i,1);		
					instances[idx].splice(i,1);
					break;
				}
			}
		};

		MulticastEvent.push = function(){
			callbacks.push([]);
			instances.push([]);
			return this;
		};

		MulticastEvent.pop = function(){
			if(callbacks.length == 1) return;
			callbacks.pop();
			instances.pop();
			return this;
		};
		
		MulticastEvent.cleanup = function(callback, instance){
			cleanup.fn 		 = callback;
			cleanup.instance = instance;
			return this;
		};
		
		MulticastEvent.purge = function(){
			for(var i=0; i<callbacks.length; i++) {
				callbacks.splice(0,1);
				instances.splice(0,1);
			}
		};


		if(!object || !property) return MulticastEvent;

		/* handle object and property arguments */
		var val = object[property];

		if(val && val.SPLICE_JS_EVENT) return val;

		if(typeof val ===  'function') {
			MulticastEvent.subscribe(val, object);		
		}

		/*
			if target object is a dom element 
			collect event arguments
		*/
		if(isHTMLElement(object)) {
			/* 
				wrap DOM event
			*/
			object[property] = function(e){

				if(!e) e = window.event;
				if(cancelBubble) {
					e.cancelBubble = true;
					if (e.stopPropagation) e.stopPropagation();
				}

				MulticastEvent(domEventArgs(e));
			}
		
			// expose subscribe method
			object[property].subscribe = function(){
				MulticastEvent.subscribe(arguments);
			}	

		}
		else { 
			object[property] = MulticastEvent;
			
		}

				
		
		return MulticastEvent;
	
	};
	var EventSingleton = new Event(null);
/*

----------------------------------------------------------
	
	Binding Model

*/
	var BINDING_TYPES = {
			SELF 		 : 1
		/* Look for properties within immediate instance */
		,	PARENT 		 : 2
		/* Look for properties within direct parent of the immediate instance*/
		,	FIRST_PARENT : 3
		/* Look for properties within a first parent  where property if found */
		,	ROOT 		 : 4
		/* Look for properties within a root of the parent chain */
		,	TYPE 		 : 5
		/* Indicates type lookup lookup */
	};
	var BINDING_DIRECTIONS = {
			FROM : 1,
		/* Left assignment */
			TO: 2,
		/* 
			determine binding based on the type of objects 
			use right assignment by default
		*/	
			AUTO: 3
	};

	function Binding(propName, bindingType){
		this.prop = propName;
		this.type = bindingType;
		this.direction = BINDING_DIRECTIONS.AUTO;
	}	
	
	
	/* 
	 * !!! Bidirectional bindings are not allowed, use event-based data contract instead 
	 * */
	var binding = function binding(propName,type,dir){
		 return {
			self:   		new Binding(propName,	BINDING_TYPES.SELF),
			parent: 		new Binding(propName,	BINDING_TYPES.PARENT),
			root:			new Binding(propName,	BINDING_TYPES.ROOT),
			"type":			function(type){
							var b = 
							new Binding(propName, 	BINDING_TYPES.TYPE); 
							b.vartype = type;
							return b;}
		}
	};
	
	/**
	 *	@scope|Namespace - component scope 
	 */
	Binding.prototype.getTargetInstance = function(originInstance, scope){

		switch(this.type){

			case BINDING_TYPES.PARENT:
				if(!originInstance.parent) throw 'Unable to locate parent instance';
				return originInstance.parent;
			break;


			case BINDING_TYPES.TYPE:

				/*locate var type */
				var vartype = scope[this.vartype]
				,	parent = originInstance;

				if(!vartype) vartype = Namespace.lookup(this.vartype);

				if(!vartype) throw 'Unable to resolve binding target type';
			
				
				while(parent) {

					if(parent instanceof vartype) return parent;

					parent = parent.parent;
				}

			break;
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
			
					if(typeof result._bindingRouter === 'function'){
						result = result._bindingRouter(nPath[i]);
					}
					else {	
						result = result[nPath[i]];
					}
					if (!result) return null;	
				}

				if(typeof result._bindingRouter === 'function'){
					result = result._bindingRouter(nPath[nPath.length-1]);
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

	SliceJS Core
	Implementation

*/
	
	function onReady(fn){	READY.callback = fn; };
	
	window.onload = function(){
		var start  = window.performance.now();
		
		var mainPageHtml = document.body.innerHTML;
		document.body.innerHTML = '';
			
		var url = window.location.origin + window.location.pathname;
		if(url.indexOf(configuration.APPLICATION_HOME) == 0){
			
			url = url.substring(configuration.APPLICATION_HOME.length);
			var name = getPath(url);
			LoadingWatcher.name = name.name;
			LoadingWatcher.url =url;	
		}
		
		//user specified on ready handler, run it and return
		if(typeof READY.callback === 'function'){
			Module({
				required:BOOT_SOURCE,
				definition:function(){
					removePreloader();
					READY.callback.call(this);
				}	
			});
			return;	
		}
		
		
		// boot module		
		Module({
			required:BOOT_SOURCE,
			definition:function(){
				var scope = this.scope;
				var _Template = constructTemplate(mainPageHtml);
				_Template.type = 'MainPage'; 
				_Template = compileTemplate.call(scope,_Template);
				var t = new _Template();
				display(t);
				
				var end  = window.performance.now();
				console.log('Load complete: ' + (end-start) + 'ms');
			}
		});
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
		if(!path) path = configuration.SPLICE_HOME;
		if(!obj) return path;

		if(typeof obj === 'string'){
			if(obj.indexOf(configuration.SPLICE_HOME) === 0) return obj;
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
				Class:function(constructor){
					
					var idx = (namespace + '.' + getFunctionName(constructor)).toUpperCase(); 
					var newNamespace = getNamespace.call(window,namespace,true);
					return Class.call({namespace:newNamespace, idx:idx}, constructor);

				},

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
	
		this._path = path;
		this.templates = [];
		this.path = path;
		this.compindex = [];
		this.itc = 0;
	
	};

	
	Namespace.prototype = {
			
			getNextTemplateName : function(){
				return '__impTemplate' + (this.itc++);
			},
			
			Class: function(constructor){
				var idx = (this._path + '.' + getFunctionName(constructor)).toUpperCase(); 
				return Class.call({namespace:this,idx:idx},constructor);
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
		
	/**
	 * pseudo class wrapper
	 * */
	var Class = function Class(_class){
		if(!_class) throw 'constructor function may not be empty';
		if(typeof(_class) !== 'function' ) throw 'Constructor must be a function';
		return _class;
	};

	function _super(inst,b,args){
		if(!b) return;
		_super(inst,b.base,args);
		//console.log('Calling super');
		b.apply(inst,args);
	};
	
	Class.extend = function(base){
		return function(_class){
			_class.prototype = Object.create(base.prototype);
			_class.prototype.constructor = _class;
			_class.base = base.prototype.constructor;
			var superMethods = mixin({},base.prototype);
			
			_class.prototype.super = function(){
				this.super = mixin(function(){},superMethods);
				_super(this,_class.base, arguments);	
				
			};
			mixin(_class.prototype.super,superMethods);
			
			return _class;
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

		//flags local css loading strategy
		this.cssIsLocal = resources.cssIsLocal;

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
				loader.loadNext(watcher)
			},1);
			return;
		}
		
		logging.debug.log('Loading: ' + filename);
		
		var head = document.getElementsByTagName('head')[0];
		
		
		/*
		 * Load CSS Files - global
		 * */
		if(endsWith(filename, FILE_EXTENSIONS.style) && !loader.cssIsLocal){
			
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

		
			if(configuration.IS_DEBUG_ENABLED) {
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
			if(!configuration.IS_DEBUG_ENABLED){
			HttpRequest.get({
				url: filename,
				onok:function(response){
					
					try {
						(new Function(response.text))();
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
	
	
	var LoadingWatcher = {
		
		getLoaderProgress : function(){
			return LOADER_PROGRESS;
		},
		
		notify:function(current){
			this.name = current.name;
			this.url = current.url;
			
			if(!progressLabel) return;
	
			var label = current.name;
			
			if(configuration.ONLOAD_DISP_SHORT_FILENAME)
				label = getPath(current.name).name;
	
			progressLabel.innerHTML = label;
		}
	};
	
	
	function include(resources, oncomplete, onitemloaded){
		
		/*
		 * Initial bootstrap
		 * */
		
		if(!LoadingWatcher.isInitialInclude) {
			showPreloader();
			
			var foo = oncomplete;
			oncomplete = function(){
				removePreloader();
				if(typeof foo === 'function') foo();
			};
			LoadingWatcher.isInitialInclude = true;
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

----------------------------------------------------------

	Templating Engine

*/
	
	function Scope(path){
		this.templates = [];
		this.path = path;
		this.compindex = [];
		this.itc = 0;
	};

	Scope.prototype.getNextTemplateName = function(){
		return '__impTemplate' + (this.itc++);
	};



	/**
	 * Object descriptor
	 * @type: data type of the object to be created
	 * @parameters:	parameters to be passed to the object behind proxy
	 * */
	var Obj = function Obj(args){
		/*
		 * Scope object
		 * Includers scope - should be used for resolving bindings
		 * */
		var scope = this;
		
		var Proxy = function Proxy(proxyArgs){
			if(!(this instanceof Proxy) ) throw 'Proxy object must be invoked with [new] keyword';
		
			/* create instance of the proxy object
			 * local scope lookup takes priority
			 */
			var obj = null;
			
			if(!obj) try{
				obj = scope.lookup(args.type);
			} catch(ex){}
			
			/* lone template is being included */
			if(!obj) try {
				obj = scope.templates[args.type];
			} catch(ex) {}
					  
			if(!obj) try {
				obj = scope[args.type]; 
			} catch(ex) {}
			

			if(!obj) try {
				obj = Namespace.lookup(args.type);
			} catch(ex) {}

			

			if(!obj) 
				throw 'Proxy object type ' + args.type + ' is not found';
			if(typeof obj !== 'function') throw 'Proxy object type ' + args.type + ' is already an object';


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
			
			
			/**  
			*	create new in-place component
			* 	using template and an override controller
			*/
			if(args.controller) {
				obj = createComponent(args.controller, obj.template, scope);
			}

			/*
				invoke component constructor
			*/
			parameters._includer_scope = scope;
			
			if(!obj.isComponent) 
				return instantiate(obj, parameters);
			else
				return new obj(parameters);	
		}
		
		Proxy.type 			= args.type;
		Proxy.ref 			= args.ref;
		Proxy.parameters 	= args;
		
		return Proxy;
		
	};

	function linkupEvents(obj){
		for(var key in  obj){
			if( obj[key] instanceof Event){
				logging.debug.log('Found event object');
				obj[key] = obj[key].attach();
			}	
		}				
	};
	
	
	function bindDeclarations(parameters, instance, scope){
		if(!parameters) return;

		var keys = Object.keys(parameters);
		for(var k=0; k< keys.length; k++) {
		
			var key = keys[k];

			if(key === 'ref') 		continue;
			if(key === 'content') 	continue; //content is processed separately
						
			if(parameters[key] instanceof Binding) {
				try {
					resolveBinding(parameters[key], instance, key, scope);
				} catch(ex){}
				
				continue;
			}
		
			/* default property assignment */
			instance[key] = parameters[key];
		}
	};

	function instantiate(fn, parameters){
		var instance = Object.create(fn.prototype);
		var scope = parameters._includer_scope;
		
		configureHierarchy.call(scope,instance,parameters);
		
		linkupEvents(instance);
		
		
		/*	todo: supress exceptions
		 	ignore binding error
		 */
		bindDeclarations(parameters, instance, scope );
			
		var result = fn.call(instance,parameters);
		// constructor returns override defaults
		if(result) return result;
		return instance;
	};


	var Controller = function Controller(){
		
		if(!this.children)	this.children = [];

		this.onDisplay.subscribe(function(){
			if(!this.children) return;
			for(var i=0; i< this.children.length; i++){
				var child = this.children[i];
				if(typeof child.onDisplay === 'function') 
					child.onDisplay();
			}
		},this);


		this.onAttach.subscribe(function(){
			if(!this.children) return;
			for(var i=0; i< this.children.length; i++){
				var child = this.children[i];
				if(typeof child.onAttach === 'function') 
					child.onAttach();
			}
		},this);

	};

	Controller.prototype.onAttach 		= EventSingleton;
	Controller.prototype.onDisplay 		= EventSingleton;
	Controller.prototype.onDomChanged 	= EventSingleton;
	Controller.prototype.onData 		= EventSingleton;

	Controller.prototype.onReflow = EventSingleton;
	Controller.prototype.reflow = function(position,size,bubbleup){

		if(bubbleup == true) {
			this.reflowChildren(null,null,bubbleup);
			return ;
		}

		// Get style object once and apply settings
		var style = this.concrete.dom.style;
		
		style.left 		= position.left +'px';
		style.top  		= position.top + 'px';
		
		style.width  	= size.width + 'px';
		style.height 	= size.height + 'px';
		
		this.reflowChildren(position,size,bubbleup);

		this.onReflow(position,size);

	};

	Controller.prototype.reflowChildren = function(position, size,bubbleup){
		
		for(var i=0; i<this.children.length; i++){
			if(typeof this.children[i].reflow !== 'function') continue;

			this.children[i].reflow(position,size,bubbleup);
		}
	};

	

	var Concrete = function Concrete(dom){
		this.dom = dom;
	};
	

	Concrete.prototype.export = function(){
		return this.dom;
	};

	Concrete.prototype.applyContent = function(content, suspendNotify){
		
		var deepClone = this.dom;
		var controllerInstance = this.controllerInstance;

		
		if(!this.contentMap) {
			var contentNodes = selectTextNodes(deepClone, function(node){
				if(node.nodeValue.indexOf('@') === 0) //starts with 
					return node;
				return null;
			});	
			
			//build content nodes key map
			if(!contentNodes) return;

			this.contentMap = {};
			for(var i=0; i < contentNodes.length; i++){
				var key = contentNodes[i].nodeValue.substring(1); 
				this.contentMap[key] = contentNodes[i];
			}
		}

		var contentMap = this.contentMap;
		var keys = Object.keys(contentMap);		
		for(var i=0; i < keys.length; i++ ){
		
			var key = keys[i];
			var obj = content[key];
			var newNode = null;

			if(typeof obj === 'function') {
				var contentInstance = new obj({parent:controllerInstance});
				if(contentInstance.concrete) {
					
					newNode = contentInstance.concrete.export();
					if(newNode instanceof Array) {
						var parentNode = contentNodes[i].parentNode;
						var child = newNode[0]; 
						
						if(isHTMLElement(child))
						parentNode.replaceChild(child, contentNodes[i]);

						for( var n = 1; n < newNode.length; n++){
							var sibling = child.nextSibling;
							var child = newNode[n];
							if(isHTMLElement(child))
							parentNode.insertBefore(child,sibling);
						}	
					} else {
						contentNodes[i].parentNode.replaceChild(newNode, contentNodes[i]);			
					}
					
					if(suspendNotify) continue;
					if(contentInstance.onAttach) contentInstance.onAttach();
					if(contentInstance.onDisplay) contentInstance.onDisplay();	
					
					continue;
				}
			}

			if(typeof obj === 'string'){
				newNode = document.createTextNode(obj);		
			}

			if(typeof obj === 'number'){
				newNode = document.createTextNode(obj);			
			}

			if(!newNode) continue;

			contentMap[key].parentNode.replaceChild(newNode, contentMap[key]);
			contentMap[key] = newNode;	
		}
		
	};

	
	function Template(dom){
		if(!dom) throw 'Template constructor argument must be a DOM element';
		this.dom = dom;
		this.dom.normalize();
		
		/* template attributes */
		this.type = dom.getAttribute('sjs-type');
		this.controller = dom.getAttribute('sjs-controller');
		
		//export attribute exists
		if(this.dom.attributes['sjs-export']) {
			var exp = dom.getAttribute('sjs-export').value;
			if(!exp) this.export = this.type;
			else this.export = exp;
		}		
		
		/*
		 * Object references to child templates
		 * child DOM tree have already been merged with parent
		 * this array will hold objects with soft references to
		 * templates DOMs
		 * */
		this.children = [];
	};
		
	Template.prototype.addChild = function(childTemplate){
		this.children.push(childTemplate);
		return this.children.length-1;
	};



	
	
	
	
	Template.prototype.normalize  = function(){

		/*
		 * reassign the wrapper if template has a root element
		 * */
		var nodes = this.dom.childNodes;
		
		var elementCount = 0; //count nodes of type "1" ELEMENT NODE
		var firstElement = null;
		for(var i=0; i< nodes.length; i++){
			if(nodes[i].nodeType == 1) { 
				elementCount++; 
				if(!firstElement) firstElement = nodes[i];
			}
		}
		if(elementCount == 1) { 
			if(firstElement.getAttribute('data-sjs-tmp-anchor')) {
				this.dom.normalize(); return;	
			}
			firstElement = this.dom.removeChild(firstElement);
			this.dom = firstElement;
			this.dom.normalize();
		}
	}
	


	/**
	 * @tieInstance - instance of a tie class that is associated with the template
	 * */
	Template.prototype.getInstance = function(controllerInstance, parameters, scope){
		
		var build = this.dom;
		
		var deepClone = build.cloneNode(true);
		deepClone.normalize();

		 
		var instance = new Concrete(deepClone);
		instance.controllerInstance = controllerInstance;
		
		instance.dom['-sjs-component'] = controllerInstance.constructor;
		
		/* process dom references */
		var elements = deepClone.querySelectorAll('[sjs-element]');
	
		var element = deepClone
		,	rootElement = null;
		
		if(controllerInstance)
		for(var i=-1; i< elements.length; i++){			
			if(i > -1) element = elements[i];
			
			var ref = element.getAttribute('sjs-element'); 
			if(ref) {
				//allow multiple element references to a single element
				var parts = ref.split(' ');
				for(var p=0; p<parts.length; p++ ) {
					controllerInstance.elements[parts[p]] = element;
				}
			} 	
		
			if(ref == 'root'){
				rootElement = element;
			}
		}
		
		//apply style
		if(rootElement){
			if(parameters && parameters.class)
				rootElement.className = parameters.class + ' ' + rootElement.className; 
		}
	
	   /*
		* Handle content declaration
		* Getcontent nodes
		*/	
		if(parameters.content) 
		instance.applyContent(parameters.content, true);


		if(typeof controllerInstance.handleContent === 'function'){
			controllerInstance.handleContent(parameters.content);
		}


		


		/* 
		 * Anchor elements with data-sjs-tmp-anchor attibute
		 * are placeholders for included templates
		 * Process clone and attach templates 
		 * */
		var anchors = deepClone.querySelectorAll('[data-sjs-tmp-anchor]');
		

		for(var i=0; i < anchors.length; i++){
			
			var childId = anchors[i].getAttribute('data-sjs-child-id');
			var _Proxy 	= this.children[childId];
			
			
			var c_instance = new _Proxy({parent:controllerInstance, parentscope:scope});
			
			/* no document structure to return */
			if(!c_instance.concrete) {
				anchors[i].parentNode.removeChild(anchors[i]);
				continue;				
			}
			
			var exportDom = c_instance.concrete.export();			
			
			/*multiple child nodes*/
			if(exportDom instanceof Array) {
				var parentNode = anchors[i].parentNode;
				var child = exportDom[0]; 
				
				if(isHTMLElement(child))
				parentNode.replaceChild(child, anchors[i]);

				for( var n = 1; n < exportDom.length; n++){
					var sibling = child.nextSibling;
					var child = exportDom[n];
					if(isHTMLElement(child))
					parentNode.insertBefore(child,sibling);
				}	
			}
			else {	
				if(isHTMLElement(exportDom))
				anchors[i].parentNode.replaceChild((exportDom), anchors[i]);
			}
		}

		return instance;
	};


	var container = document.createElement('span');
	function extractTemplates(fileSource){
		//var start  = window.performance.now();
		
		this.templates = [];
		this.components = []; //component exports
		
		container.innerHTML = fileSource;
		
		var nodes = container.querySelectorAll('sjs-component');
		for(var i=0; i<nodes.length; i++){
			var node = nodes[i];
			this.templates[node.attributes['sjs-type'].value] = new Template(node);
			this.templates.length = i + 1;
		}

		//var end = window.performance.now();
		//perf.total += (end-start);
		//console.log('template collection performance step: ' +  (end-start) + ' total: ' + perf.total) ;
		return this.templates;
	};



	function startsWith(s,v){
		if(s.startsWith) return s.startsWith(v);	
		if(s.indexOf(v) == 0) return true;
		
		return false;
	};

	function capitalize(s){
		return s[0].toUpperCase() + s.substring(1);
	}

	/**
	 *	Converts arbitrary string to a property name 
	 */
	function propertyName(name, esc){
		var fn = function(c){
			if (c== '_') return false; 
			return Tokenizer.isAlphaNum(c); 
		};
		
		var t = Tokenizer(name,fn);
		
		var	result = ''
		,	token = '';
		var iscap = false;
		
		while(token = t.nextToken()){
			if(!fn(token) || (token =='sjs' && esc == true)) continue;
			result = result + (iscap?capitalize(token):token);	
			iscap = true;
		}
		return result;		
	};

	var RESERVED_ATTRIBUTES = ["type", "ref", "singleton", "class", "width", "height", "layout", "controller"];

	function collectAttributes(node, filter){
		if(!node) return null;
		
		var attributes = node.attributes;
		if(!attributes) return '';
	
		var result = ''
		,	separator = '';
		
		for(var i=0; i<attributes.length; i++){
			var attr = attributes[i]
			,	name = propertyName(attr.name,true);
			
			if(startsWith(attr.value,'binding(')){
				result = result + separator + name + ':' + attr.value;	
				separator = ', ';
				continue;	
			}
			
			if(RESERVED_ATTRIBUTES.indexOf(name) < 0) continue;
			
			result = result + separator + name + ':\'' + attr.value + '\''; 
			separator = ', ';
		}
		return result;
	};

	function handle_SJS_INCLUDE(node, parent, replace){
		
		var attributes = collectAttributes(node,RESERVED_ATTRIBUTES)
		,	json = '';
				
		//empty configuration of the include tag
		var idx = node.innerHTML.indexOf('{');
		if( idx < 0){
			json = 'Obj.call(scope,{'+ attributes +'})';
		}
			
		else {	
			if(attributes) attributes = attributes + ',';
			
			json = 'Obj.call(scope,{' + attributes +
			node.innerHTML.substring(idx+1)
			+')'
		}

		if(replace === true)
			node.parentNode.replaceChild(document.createTextNode(json),node);

		return json;
	}

	function handle_SJS_ELEMENT(node, parent, replace){
		var type = node.getAttribute('type')
		,	attributes = collectAttributes(node,RESERVED_ATTRIBUTES);
			
		if(attributes) attributes = attributes + ', '
			
		var json = 'Obj.call(scope,{'+
			attributes + 
			node.innerHTML.substring(node.innerHTML.indexOf('{')+1)
			+')'
		
		if(replace === true)
			node.parentNode.replaceChild(document.createTextNode(json),node);
	
		return json;
	}	

	function handle_INLINE_HTML(node, parent, replace){
		var scope = this;
		
		var _type = scope.getNextTemplateName(),
			json = '';

		if(parent.tagName == 'SJS-ELEMENT')
			json = 'null, type:\'' + _type + '\''; 			
		else
			json = 'Obj.call(scope,{type:\''+ _type + '\'})';

		if(replace === true)
			node.parentNode.replaceChild(document.createTextNode(json),node);

		/* 
			build new template and store within scope 
			run template compiler
		*/
		var sjs_node = document.createElement('sjs-template');
		
		sjs_node.appendChild(node);
		var template = new Template(sjs_node);
		template.type = _type;
		 

		if(parent.tagName == 'SJS-ELEMENT'){
			sjs_node.attributes['controller'] = 'Controller';
			//template.declaration = {type:_type, tie:'SpliceJS.Controls.UIElement'};
		}
		
		compileTemplate.call(scope, template);

		return json
	}	

	function convertToProxyJson(dom, parent, replace){
		
		var scope = this;

		if(	dom.tagName != 'SJS-INCLUDE' &&	dom.tagName != 'SJS-ELEMENT')
			return handle_INLINE_HTML.call(scope, dom, parent, true);	

		var	elements = 	selectNodes({childNodes:dom.childNodes},
				function(node){
					if(node.nodeType == 1) return node;
				},
				function(node){
					if(node.nodeType == 1) return [];
					return node.childNodes;	
				}
		);

		//if sub elements found process recursivelly
		if(elements && elements.length > 0){
			for(var i=0; i< elements.length; i++){
				var node = elements[i];
				convertToProxyJson.call(scope,node, dom, true);
			}
		}

		//proces current element
		if(dom.tagName === 'SJS-INCLUDE') return handle_SJS_INCLUDE(dom, parent, replace);
		if(dom.tagName === 'SJS-ELEMENT') return handle_SJS_ELEMENT(dom, parent, replace);
		
	};





	function resolveCustomElements(template){

		var scope = this;

		/* select top level includes */
		var inclusions = [];

		var nodes = selectNodes({childNodes:template.dom.childNodes},
				function(node){
					if(node.tagName == 'SJS-INCLUDE' || node.tagName == 'SJS-ELEMENT') return node;
				},
				function(node){
					if(node.tagName == 'SJS-INCLUDE' || node.tagName == 'SJS-ELEMENT') return [];
					return node.childNodes;	
				}
			);

		if(!nodes || nodes.length < 1) return;

		for(var i=0; i<nodes.length; i++){
			
			var node = nodes[i]
			,	parent = node.parentNode
			,	json = convertToProxyJson.call(scope,node, node.tagName)
			, 	fn = new Function("var binding = arguments[0].binding, Obj = arguments[0].Obj; " + 
								  "var scope = this; var window = document = null; return " + json)
			 	
			var result = fn.call(scope,sjs());

			if(typeof result !==  'function'){				
				result = Obj.call(scope,result);
			}

			var childId = template.addChild(result);

			var a = document.createElement('a');
			a.setAttribute('data-sjs-tmp-anchor',result.type);
			a.setAttribute('data-sjs-child-id',	childId);
			
			parent.replaceChild(a,node);
		}
	};




	function resolveBinding(binding, instance, key, scope){
		if( !(binding instanceof Binding) ) throw 'Cannot resolve binding, source property is not a binding object';
		
		var source = null;
		
		switch(binding.type){
		case BINDING_TYPES.SELF:
			break;
		
		case BINDING_TYPES.PARENT:
			if(!instance.parent) throw 'Cannot resolve parent binding, instance parent is not null';
			
			var v = Binding.Value(instance.parent);

			source = { 
						instance: 	v.instance(binding.prop),
						path: 	  	v.path(binding.prop),
						value: 		function(){return this.instance[this.path];}
					};
			break;
			
		case BINDING_TYPES.FIRST_PARENT:
			break;
			
		case BINDING_TYPES.ROOT:
			break;
			
		case BINDING_TYPES.TYPE:
			logging.debug.log('Resolving binding to type: ' + binding.vartype);
			var parent = instance;
			
			var vartype = scope.lookup(binding.vartype);
			if (!vartype) throw 'Unable to resolve binding target type: ' + binding.vartype;
			
			while(parent) {
				if(parent instanceof vartype) {
					logging.debug.log('Found instance of type: ' + binding.vartype);
					
					var v = Binding.Value(parent);

					source = {
								instance: 	v.instance(binding.prop),
							  	path: 		v.path(binding.prop),
							  	value: 		function(){return this.instance[this.path];}
							};
					break;
				}
				parent = parent.parent;
			}
		}
		
		if(!source) throw 'Cannot resolve binding source';

		var v = Binding.Value(instance);
		var dest = {
				instance:  	v.instance(key),
				path: 		v.path(key),
				value: 		function(){return this.instance[this.path];}
		}


		/* Initialize events where applicable */
		if(dest.value() instanceof Event )  { dest.instance[dest.path] 	= Event.attach(); }
		if(source.value() instanceof Event) { source.instance[source.path] = Event.attach(); }


		/* Default binding mode is FROM */


		/* 
			If course is an event then switch to TO mode 
			unless destination is an event too
		*/
		if(source.value() && source.value().SPLICE_JS_EVENT && 
		  (!dest.value() || !dest.value().SPLICE_JS_EVENT)) {
			var _s = source;
			source = dest;
			dest = _s;
			_s = null;
		}

		/* Perform binding here */

		/*  this is event binding only allow functions to be bound to events */
		if(dest.value() && dest.value().SPLICE_JS_EVENT) {
			if(typeof source.value() !== 'function') 
				throw 'Cannot establish binding between \''+ key + '\' and \'' + binding.prop + '\'. Check that properties are of types \'function\'';

			dest.instance[dest.path].subscribe(source.value(), source.instance);

			return;
		}

		if(typeof source.value() === 'function')
			dest.instance[dest.path] = 	function(){
					return source.instance[source.path].apply(source.instance,arguments);
				}
				
		else
			dest.instance[dest.path] = source.instance[source.path];
	};


	function constructTemplate(html){
	
		var wrapper = document.createElement('sjs-component');
		wrapper.innerHTML = html;

		return new Template(wrapper);
	}


	/*
	 * Compiles template within a given loading scope
	 * 
	 * */
	function compileTemplates(scope){
		if(scope.templates.length < 1) return; //no templates in this module
		
		var keys = Object.keys(scope.templates);
		
		for(var i=0; i< keys.length; i++) {
			var template = scope.templates[keys[i]];
			compileTemplate.call(scope,template);
		}
	};
	

	
	/**
	 * Creates a build version of the template (dom element but not linked to main document yet).
	 *
	 * This will not generate any bindings but rather encode  information into elements through data-...
	 *
	 * @param template - a template to compile
	 * @param moduleName - a module where template can be located
	 * @returns {HTMLElement|*} a DOM of the template (aka build version).
	 */
	function compileTemplate(template){
		
		var scope = this; //module scope

		/*
		 * Run notations and scripts to form a 
		 * final template DOM
		 * */
		logging.debug.log('Processing template notations for module: ');		

		resolveCustomElements.call(scope,template);
		
		var component = createComponent(template.controller,template,this);
		this.templates[template.type] = component;
		
		if(template.export) {
			this.components[template.export] = component; 	
		}  
		return component;
	
	};
		

	function configureHierarchy(instance, args){
		if(!instance) return;
		instance.parent = args.parent;

		if(!instance.parent) return; 

		
		instance.parent.children.push(instance);						
		
		if(!args.ref) return;

		if(typeof args.ref == 'string') {
			instance.parent.ref[args.ref] = instance;
			return;
		}
		
		if(args.ref instanceof Binding){
			var ti = args.ref.getTargetInstance(instance,this);
			if(!ti) throw 'Unable to locate target instance';
			ti.ref[args.ref.prop] = instance;
			return;
		}

		throw 'Invalid [ref] value, must be a string or an instance of Binding';
	};

	
	/** 
	 * 
	 * @controller controller type function
	 * 
	 * @template template object
	 * 
	 * @scope is a Namespace object where modules have been declared
	 * used for resolving references to local-scoped templates
	 * when invoked by parent, module points to the parent's context
	 * 
	 * components are not extendable
	 * only controllers are
	 * 
	 * */
	function createComponent(_controller, template, scope){
		/*
		 * Component function is assigned to the variable of the same name
		 * "Component" because otherwise in IE8 instanceof operation on "this"
		 * implicit object does not return true on this instanceof Component
		 * IE8 seems to evaluare the operator against the name of the
		 * function that created the object
		 * */
		var Component = function Component(args){
			
			if(!(this instanceof Component)) throw 'Component function must be invoked with [new] keyword';
			
			/* lookup controller */
			var controller =  _controller?scope.lookup(_controller):null;
			/* assign default */
			if(!controller) controller = Controller; 
			if(controller.isComponent) controller = controller.controller();
			
			args = args || {};
			
			if(args._includer_scope) { 
				var idof = args._includer_scope.singletons.constructors.indexOf(this.constructor.component);
				if(idof >=0) { 
					var inst =  args._includer_scope.singletons.instances[idof];
					return inst;
				}
			}
			
			var obj = Object.create(controller.prototype);
				
			
			obj.ref = {};
			obj.elements = {};
			obj.children = [];
			obj.scope = scope;
						
			
			/* 
			 * assign reference to a parent and 
			 * append to children array
			 * */
			configureHierarchy.call(args._includer_scope,obj,args);

			/*
				Auto-creating event casters
			*/
			linkupEvents(obj);

			
			/*
			 * Bind declarative parameters
			 */
			bindDeclarations(args, obj, args._includer_scope);
			
			
			/*
				Instantiate Template
			*/
			if(template)
			obj.concrete = template.getInstance(obj, args, scope);


			controller.apply(obj, [args]);

			if(args.singleton) {
				args._includer_scope.singletons.constructors.push(this.constructor.component);
				args._includer_scope.singletons.instances.push(obj);
			}

			return obj; 
			
		};
		
		Component.controller = function(){
			/* lookup controller */
			var controller =  _controller?scope.lookup(_controller):null;
			/* assign default */
			if(!controller) controller = Controller; 
			if(controller.isComponent) controller = controller.controller();
			return controller;
		};
		
		Component.isComponent = true;
		Component.template = template;

		return Component;
	}; 

	/*
		@path is a relative path to SPLICE_HOME
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

	
	/**
	 * Builds module and compiles late(s) from module definition. 
	 * The templates will be compiled recursively, 
	 * where inner templates are compiled first and then outer. 
	 * Any scripts embedded into template will be evaluated and 
	 * their result be injected into DOM, by replacing underlying script tag.
	 * @param moduleDefinition
	 */
	function Module(moduleDefinition){
	
	    var scope = new Namespace(path); //our module scope
			scope.singletons = {constructors:[], instances:[]};
		
		var proxyClass = function(fn){
				var nm = getFunctionName(fn);
				scope[nm] = Class(fn);
				return scope[nm];
		};
		proxyClass.extend = function(base){
			return function(fn){
				var nm = getFunctionName(fn);
				var _base = base;
				if(base.isComponent) _base = base.controller(); 
				scope[nm] = Class.extend(_base)(fn);
				return scope[nm];
			}
		};
			
		var _sjs = mixin(sjs(),{
			Class : proxyClass
		});
		
		
		
		
		//use absolute URL there is no reason not to
		var path = getPath(LoadingWatcher.name).path;
		var url = LoadingWatcher.url;
		
		var imp = prepareImports(moduleDefinition.required, path);
		
		var required 	= imp.filenames;
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
			MODULE_MAP[url] = definition.call(_sjs,_sjs); 
			return;
		}
		
		/* 
		 * Load dependencies
		 * */
		 include(required, function(){	

			/*
				Inject Scope Dependencies
			 */
			if(imp.namespaces) {
				for(var i=0; i<imp.namespaces.length; i++){
					var ns = imp.namespaces[i];
					//looking up exports
					var x = MODULE_MAP[absPath(ns.path)];
					if(!x) continue;
					ns = getNamespace.call(scope,ns.ns,true,false);
					ns.place(x);
				}
			}
				/* 
			 * Templates are compiled after module has been defined
			 * 
			 * */
			compileTemplates(scope);
			
			if(typeof definition === 'function') {
				var _exports = definition.call({'sjs':_sjs,'scope':scope}, _sjs); 
				if(!_exports) _exports = Object.create(null);
				MODULE_MAP[url] = mixin(_exports,scope.components);
			}
		},collectTemplates);
	};


	function mixin(target, source){
		for(var key in source ){
			if(source.hasOwnProperty(key)) {
				target[key] = source[key];
			}	
		}
		return target;
	};


	function listModules(){
		return MODULE_MAP;	
	};


/*

--------------------------------------

	Core exports

*/
	var consoleLog = console.log.bind(console); 
	
	
	function sjs(m) { 
		//free module definition
		if(typeof m === 'function'){
			return Module({definition:m});
		}
		
		//dependent module definition
		if( typeof m === 'object' && typeof m.definition === 'function'){
			return Module(m);	
		};
		
		//lookup module
		if(typeof m  === 'string'){
				
			var keys = Object.keys(MODULE_MAP);
			for(var i=0; i < keys.length; i++){
				var key = keys[i];
				if(key.endsWith(m)) return MODULE_MAP[key];  					
			}
			return function(callback){
				//async module loader here				
			};
		};
		
		return mixin(Object.create(null), {
		
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
			display : display,
			close : close,
			endswith:endsWith,
			mixin: mixin,
			binding : binding,
						
			load	: include,		
			include : include,
			getFunctionName:getFunctionName,
		
			Namespace: Namespace,
			Class : Class,
			Controller : Controller,
			Obj : Obj,
			
			HttpRequest : HttpRequest,	
			Event : EventSingleton,	
			
			Tokenizer:Tokenizer,
			UrlAnalyzer:UrlAnalyzer,
			
			onReady:onReady,
			
			modules: listModules
		
	});}
	
	
	//core.debug = debug;
	return sjs

})(window,document);


