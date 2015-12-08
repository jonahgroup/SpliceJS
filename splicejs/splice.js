

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
		app_home: 	getPath(window.location.href).path,
		splice_home:        window.sjs_config.home,
		debug:							window.sjs_config.debug,
		startup:						window.sjs_config.startup,
		platform:					 {
				isTouchEnabled:window.sjs_config.platform_touch,
				isMobile:	window.sjs_config.platform_mobile
		},
		splash: { 'module': window.sjs_config.splash_screen_module,
							'class'	:	window.sjs_config.splash_screen_class
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

/*
	function propertyValue(obj, path, newValue){
		var nPath = path.split('.'),
			result = obj;

		if(nPath.length < 1) return null;

		for (var i = 0; i< nPath.length; i++){
			result = result[nPath[i]];
			if (result == null) return null;
		}
		return result;
	};
*/

	function _propertyValueLocator(path){
				var npath = path.split('.')
				,	result = this;

				//loop over path parts
				for(var i=0; i < npath.length-1; i++ ){
					result = result[npath[i]];
					if(result == null) console.warn('Property ' + path + ' is not found in object ' + result);
				}
				var p = npath[npath.length - 1];
				if(result && result[p] == undefined) console.warn('Property ' + path + ' is not found in object ' + result);

				//hash map object
				return Object.defineProperty(Object.create(null),'value',{
					get:function(){
						if(!result) return null;
						return result[p];
					},
					set:function(newValue){
						if(!result) return;
						result[p] = newValue;
					}
				});
	};

	function propertyValue(obj){
		return _propertyValueLocator.bind(obj);
	};


	function display(view){
		if(view instanceof Controller) {
			document.body.appendChild(view.views.root.htmlElement);
			view.onAttach();
			view.onDisplay();
			return view;
		}
		if(view instanceof View){
			document.body.appendChild(view.htmlElement);
			return view;
		}
	};


	display.clear = function(view) {
		if(!view) return {display : display};

		if(view instanceof Controller ){
			if(view.views.root.htmlElement.parentNode === document.body)
				document.body.removeChild(view.views.root.htmlElement);
			return {display : display };
		}

		if(view instanceof View ){
			document.body.removeChild(view.htmlElement);
			return {display : display };
		}

		document.body.innerHTML = '';
		return {display : display };

	};

	function close(controller) {
	    controller.concrete.dom.parentNode.removeChild(controller.concrete.dom);
	};

	function isHTMLElement(object){
		if(!object) return false;
		if(object.tagName && object.tagName != '') return true;
		return false;
	};

	function _viewQueryMode(){
		return {
			id:function(id){
				var d = document.getElementById(id);
				if(d) return new View(d);
				return null;
			},
			query:function(query){
				var collection = document.querySelectorAll(query);
				if(!collection) return null;
				return {
					foreach:function(fn){},
					first:function(){
							return new View(collection[0]);
					}
				}
			}
		}
	}



/**
	Dom manipulation api
*/
function View(dom, args){
	if(typeof dom === 'string'){
		this.htmlElement = (function(d){
			var e = document.createElement(null);
			e.innerHTML = d;
			return e.children[0];
		})(dom);
	} else
		this.htmlElement = dom;

	if(!args || !args.simple){
		this.contentMap = buildContentMap(this.htmlElement);
	}
	else {
		this.isSimple = true;
	}
};

View.prototype.class = function(className){
	var self = this;
	return {
		remove: function(){
			removeClass(self.htmlElement,className)
			return self;
		},
		add:function(){
			addClass(self.htmlElement,className);
			return self;
		}
	}
};

View.prototype.attr = function(attr){
	for(var k in attr){
		this.htmlElement.setAttribute(k,attr[k]);
	}
	return this;
};

View.prototype.style = function(styleString){
	//var rules = CssTokenizer(styleString);
	this.htmlElement.setAttribute('style',styleString)
	return this;
};

View.prototype.clear = function(){
	this.htmlElement.innerHTML = '';
	return this;
};

View.prototype.child = function(name){
	if(!this.childMap) {
		this.childMap = Object.create(null);
		var childViews =this.htmlElement.querySelectorAll('[sjs-view]');
		for(var i=0; i<childViews.length; i++){
			var attr = childViews[i].getAttribute('sjs-view');
			this.childMap[attr] = new View(childViews[i]);
			this.childMap[attr].parent = this;
		}
	}
	return this.childMap[name];
};

View.prototype.controller = function(){
	return this.htmlElement.__sjs_controller__;
};

function addContent(content,key){
	if(!key) key = 'default';
	if(!this.contentMap[key]) return this;

	var target = this.contentMap[key].source;

	if(typeof content === 'string'){
		target.appendChild( document.createTextNode(content) );
		return this;
	}
	if(typeof content === 'number'){
		target.appendChild( document.createTextNode(content) );
		return this;
	}
	if(content instanceof View){
		target.appendChild( content.htmlElement );
		return this;
	}
	if(content instanceof Controller ){
		if(!content.views || !content.views.root) return this;
		target.appendChild( content.views.root.htmlElement);
		content.onAttach();
		content.onDisplay();
		return this;
	}
};

function replaceContent(content,key){
	if(!key) key = 'default';
	//coercive comparision, checks null and undefined
	if(this.contentMap[key] == null ) return this;

	if(	typeof content === 'string' ||
			typeof content === 'number' ||
			typeof content === 'boolean'){
			var target = this.contentMap[key].cache;
			if(!target) {
				this.contentMap[key].source.innerHTML = '';
				target = document.createTextNode(content);
				this.contentMap[key].cache = target;
				this.contentMap[key].source.appendChild(target);
			}
			target.nodeValue =content;
			return this;
	}

	if(content instanceof Controller ){
		var root = content.views.root;
		if(!root) return;
		this.contentMap[key].source.innerHTML = '';
		this.contentMap[key].source.appendChild(root.htmlElement);
		this.contentMap[key].cache = root.htmlElement;
		content.onAttach();
		content.onDisplay();
	}
	return this;
};


View.prototype.add = addContent;
View.prototype.replace = replaceContent;


View.prototype.position = function(){
		var self = this;
		return {
			abs:function(){
				return self;
			}
		}
};

View.prototype.reflow = function(){

};

function CssTokenizer(input){
	var t = new Tokenizer(input);
	var rules = []
	,	token = null;

	var acc = '';
	while(token = t.nextToken()){
		if(Tokenizer.isSpace(token)) continue;
		if(Tokenizer.isAlphaNum(token)) {
			acc += token; continue;
		}
		//rule value mode
		if(token == ':') {
			var rule = {property:acc, values:cssRuleValue(t)}
			rules.push(rule);
			acc = '';
			continue;
		}
	}
	return rules;
}

function composeCssRules(){
	var rules
	for(var i=0; i<rules.length; i++){
		var prop = rules[i].property;
	}
}


function cssRuleValue(tokenizer){
	var token = null
	,	acc = ''
	,	values = [];
	while(token = tokenizer.nextToken()){
		if(Tokenizer.isSpace(token) && acc != ''){
			values.push(acc); acc = ''; continue;
		}
		if(Tokenizer.isAlphaNum(token)) {
			acc += token; continue;
		}
		if(token == ';') {
			if(acc != '') values.push(acc);
			return values;
		}
	}
	return values;
}

function ClassTokenizer(input){
	var tokenizer = new Tokenizer(input)
	,	token = null;
	var classes = Object.create(null)
	,	acc = '';
	while(token = tokenizer.nextToken()){
		if(Tokenizer.isSpace(token)) {
			classes[acc] = 1;
			acc = '';
			continue;
		}
		acc += token;
	}
	if(acc != '') classes[acc] = 1;
	return classes;
};


function addClass(element, className){
	var current = ClassTokenizer(element.className)
	,	toAdd = ClassTokenizer(className)
	,	clean = element.className;

	for(var key in toAdd ){
		if(key in current) continue;
		clean += ' ' + key;
	}

	element.className = clean;
};

function removeClass(element, className){
	var current = ClassTokenizer(element.className)
	,	toRemove = ClassTokenizer(className)
	,	clean = '';
	for(var key in current){
		if(key in toRemove) continue;
		clean += ' ' + key;
	}
	element.className = clean;
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

	/**
		@param {object} instance - taget object instance to
		receive event configuration
	*/
	function Event(instance){
		if(!(this instanceof Event))
		return {
			attach:function(configuration){
				var keys = Object.keys(configuration);
				for(var i=0; i<keys.length; i++){
					var evt = configuration[keys[i]];
					if(!(evt instanceof Event) ) continue;
					evt.attach(instance, keys[i]);
				}
				return instance;
			}
		}


		this.eventType = 'multicast';
		this.isStop = false;
	};

	Event.prototype.transform = function(fn){
		var e = mixin(new Event(),this)
		e.transformer = fn;
		return e;
	};

	Event.prototype.stop = function(fn){
		var e = mixin(new Event(),this)
		e.transformer = fn;
		e.isStop = true;
		return e;
	};

	Event.multicast = (function(){
		var e = mixin(new Event(),this)
		e.eventType= 'multicast';

		e.stop = mixin(new Event(),e);
		e.stop.isStop = true;

		return e;
	})();

	Event.unicast = (function(){
		var e = mixin(new Event(),this)
		e.eventType= 'unicast';

		e.stop = mixin(new Event(),e);
		e.stop.isStop = true;

		return e;
	})();





	Event.prototype.attach = function(object, property, cancelBubble){

		var callbacks = [[]], instances = [[]];
		var cleanup = {fn:null, instance:null };
		var transformer = this.transformer;

		cancelBubble = this.isStop;

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

		MulticastEvent.__sjs_event__ = true;

		/*
			"This" keyword migrates between assigments
			important to preserve the original instance
		*/
		MulticastEvent.subscribe = function(callback, instance){
			if(!callback) return;
			if(typeof callback !== 'function') throw 'Event subscriber must be a function';

			if(!instance) instance = this;

			var idx = callbacks.length-1;

			for(var i=0; i<callbacks[idx].length; i++){
				if( callbacks[idx][i].callback === callback &&
					  instances[idx][i] === instance
				) return object;
			}

			callbacks[idx].push({callback:callback,is_async:false});
			instances[idx].push(instance);
			return object;
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
				if( callbacks[idx][i].callback == callback ) {
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
		MulticastEvent.__sjs_event_name__ = property;

		if(!object || !property) return MulticastEvent;

		/* handle object and property arguments */
		var val = object[property];

		if(val && val.__sjs_event__) return val;

		if(typeof val ===  'function') {
			MulticastEvent.subscribe(val, object);
		}

		/*
			if target object is a dom element
			collect event arguments
		*/
		if(isHTMLElement(object) || object === window) {
			/*
				wrap DOM event
			*/
			object[property] = function(e){

				if(!e) e = window.event;
				if(cancelBubble) {
					e.cancelBubble = true;
					if (e.stopPropagation) e.stopPropagation();
				}
				setTimeout((function(){
					MulticastEvent(this);
				}).bind(domEventArgs(e)),1);
			};
			object[property].__sjs_event__ = true;

			// expose subscribe method
			object[property].subscribe = function(){
				MulticastEvent.subscribe.apply(MulticastEvent,arguments);
			}

		} else if(object instanceof View){
			object[property] = MulticastEvent;

			object.htmlElement[property] = (function(e){
				if(!e) e = window.event;
				if(cancelBubble){
					e.cancelBubble = true;
					if (e.stopPropagation) e.stopPropagation();
				}
				var eventArgs = domEventArgs(e);
				eventArgs.view = object;
				setTimeout((function(){
					this.fn(this.args);
				}).bind({fn:this[property], args:eventArgs}),1);
				//this[property](eventArgs);
			}).bind(object);
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

	function Binding(propName, bindingType,prev){
		this.prop = propName;
		this.type = bindingType;
		this.direction = BINDING_DIRECTIONS.AUTO;
		this.prev = prev;
	}


	function createBinding(propName,prev){

		return {
			self:   		new Binding(propName,	BINDING_TYPES.SELF,prev),
			parent: 		new Binding(propName,	BINDING_TYPES.PARENT,prev),
			root:				new Binding(propName,	BINDING_TYPES.ROOT,prev),
			'type':			function(type){
						var b =	new Binding(propName, 	BINDING_TYPES.TYPE,prev);
						b.vartype = type;
						return b;
			 }
		}
	}
	/*
	 * !!! Bidirectional bindings are junk and not allowed, use event-based data contract instead
	 * */
	var binding =  function binding(args){
		 return createBinding(args);
	 }


	 Binding.prototype.binding = function binding(pn){
		return createBinding(pn,this);
	}


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

				var	parent = originInstance;
				// 1. component lookup
				var vartype = scope.components.lookup(this.vartype);
				// 2. imports lookup
				if(!vartype) vartype = scope.lookup(this.vartype);
				// 3. target not found
				if(!vartype) throw 'Unable to resolve binding target type:' + this.vartype;

				while(parent) {
					if(parent.__sjs_type__ === vartype.__sjs_type__ || (parent instanceof vartype)) return parent;
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

	var SplashScreenController = Class(function SplashScreenController(){
		this.super();
	}).extend(Controller);


	SplashScreenController.prototype.update = function(total, complete, itemname){
		throw 'SplashScreenController derived class must implement "update" method';
	}


	function _bootOptionA(){

	}

	function _bootOptionB(){

	}

	function _bootOptionC(){

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



function isExternalType(type){
		if(type[0] === '{') {
			var parts = type.substring(1,type.indexOf('}')).split(':');
			return {namespace:parts[0], filename:parts[1]}
		}
		return null;
}

/*

----------------------------------------------------------

	Templating Engine

*/

	/**
	 * Object descriptor
	 * @type: data type of the object to be created
	 * @parameters:	parameters to be passed to the object behind proxy
	 * */
	var proxy = function proxy(args){
		/*
		 * Scope object
		 * Includers scope - should be used for resolving bindings
		 * */
		var scope = this;

		if(args.__sjs_name__) {
			console.log("sjs  name: " + args.__sjs_name__);
		}

		var Proxy = function Proxy(proxyArgs){
			if(!(this instanceof Proxy) ) throw 'Proxy object must be invoked with [new] keyword';

			/* create instance of the proxy object
			 * local scope lookup takes priority
			 */
			var obj = scope.lookup(args.type);

			if(!obj) obj = scope.components.lookup(args.type);
			/* lone template is being included */
			if(!obj) obj = scope.templates[args.type];

			if(!obj) throw 'Proxy object type ' + args.type + ' is not found';
			if(typeof obj !== 'function') throw 'Proxy object type ' + args.type + ' is already an object';


			/* copy args*/
			var parameters = {};
			var keys = Object.keys(args);
			for(var i = 0; i < keys.length; i++ ){
				var key = keys[i];
				if(key == 'type') continue; /* skip type */
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
		Proxy.parameters 	= args;
		Proxy.__sjs_name__ 		= args.__sjs_name__;
		Proxy.__sjs_isproxy__ = true;

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

			if(key === 'controller') continue;
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

	/*
	*	do not allow duplicate content keys
	*/
	function buildContentMap(element){
		var contentNodes = element.querySelectorAll('[sjs-content]')
		,	cMap = {};

		if(!contentNodes) return;
		var node = element;
		for(var i=0; i<=contentNodes.length; i++){

			var key = node.getAttribute('sjs-content');
			if(cMap[key]) throw 'Duplicate content map key ' + key;
			cMap[key] = {source:node, cache:null};
			node = contentNodes[i];
		}

		return cMap;
	};

/**
	Controller class
*/
function Controller(){

		if(!this.children)	this.children = [];
		if(!this.__sjs_visual_children__) this.__sjs_visual_children__ = [];

		Event(this).attach({
			onAttach	:	Event.multicast,
			onDisplay	:	Event.multicast,
			onData		: Event.multicast
		});

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
				child.__sjs_is_attached__ = this.__sjs_is_attached__;
				if(typeof child.onAttach === 'function')
					child.onAttach();
			}

		},this);
	};

	Controller.prototype.initialize = function(){
		var fn = getFunctionName(this.constructor)
		if(fn === 'Controller') return;
		console.warn(fn + '.initialize is not implemented');
	};

	function abandonVisualParent(controller){
		var children = controller.__sjs_visual_parent__.__sjs_visual_children__;
		for(var i=0; i < children.length; i++){
			if(children[i] == controller) children.splice(i,1);
			break;
		}
		controller.__sjs_visual_parent__ = null;
	};

	function gainVisualParent(controller,parent){
		controller.__sjs_visual_parent__ = parent;
		var children = parent.__sjs_visual_children__;
		for(var i=0; i<children.length; i++){
			if(children[i] == controller) return;
		}
		children.push(controller);
	};


	function decodeContent(content){
		if(typeof content === 'string'){
			return document.createTextNode(content);
		}

		if(typeof content === 'number'){
			return document.createTextNode(content);
		}

		if(content instanceof Controller){
			//update visual parent
	//		abandonVisualParent(content);
	//		gainVisualParent(content, this);
			return content.views.root;
		}

		return null;
	};

	function invalidateContent(){
		this._lastWidth = null;
		this._lastHeight = null;
	};

	function _controllerContentMapper(content,callback){
		var view = this.views.root;
		var type = typeof(content);
		//no content map, simple view, default map must be present
		if(content instanceof Controller || content instanceof View ||
			 type == 'string' || type == 'number' || type == 'boolean') {
			callback.call(view, content);
			return this;
		} else {
		// composed content, represented by content object's properties
			var keys = Object.keys(content);
			for(var i=0; i<keys.length; i++){
				callback.call(view,content[keys[i]], keys[i]);
			}
		}
		return this;
	};

	//set content of the controller
	Controller.prototype.content = function(content){
		var self = this;
		return {
			replace: function(){_controllerContentMapper.call(self,content, replaceContent)},
			add: 		 function(){_controllerContentMapper.call(self,content, addContent)}
		}

/*
			if(!this.__sjs_content_map__)
			throw 'Unable to apply content, content map is not available, make sure "sjs-content-map" is not false for a given component';

			var keys = Object.keys(this.__sjs_content_map__);
			for(var key in  keys){
				var newNode = decodeContent.call(this,source[keys[key]]);
				if(!newNode) continue;

				var contentNode = this.__sjs_content_map__[keys[key]][0];

				//if child node is already added, skip
				if(contentNode.childNodes[0] == newNode)	return;

				if(contentNode.childNodes[0]) {
					contentNode.replaceChild(newNode,contentNode.childNodes[0]);
				} else {
					contentNode.appendChild(newNode);
				}

				invalidateContent.call(this);
			}
*/
	};

	//iterate over children and release event listeners
	Controller.prototype.dispose = function(){
			for(var i=0; i<this.children.length; i++){
				var child = this.children[i];
				if(child instanceof Controller){
					child.dispose();
				}
			}// end for children
			console.log('releasing events');
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
			var exp = dom.getAttribute('sjs-export');
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

	Template.prototype.addChild = function(child){
		this.children.push(child);
		var childId =  this.children.length-1;

		var a = document.createElement('a');
		a.setAttribute('data-sjs-tmp-anchor',child.type);
		a.setAttribute('data-sjs-child-id',	childId);



		return a;
	};



	function _processIncludeAnchors(dom, controller, scope, onInstance){
		var anchors = dom.querySelectorAll('[data-sjs-tmp-anchor]');

		for(var i=0; i < anchors.length; i++){

			var childId = anchors[i].getAttribute('data-sjs-child-id');
			var _Proxy 	= this.children[childId];

			var instance = new _Proxy({parent:controller, parentscope:scope});
			anchors[i].parentNode.replaceChild(instance.views.root.htmlElement, anchors[i]);
			if(typeof onInstance === 'function') {
				onInstance(instance);
			}
		}
	};

	/**
	 * @param {Controller} controllerInstance  - instance of a controller class that is associated with the template
	 * @param {object} parameters
	 	 @param {Namespace} scope - module scope
	 */
	Template.prototype.getInstance = function(controllerInstance, parameters, scope){

		var build = this.dom;

		var views = {};

		var deepClone = build.cloneNode(true);
		deepClone.normalize();



		/* process dom references */
		var elements = deepClone.querySelectorAll('[sjs-element]');
		var element = deepClone;

		if(controllerInstance)
		for(var i=0; i< elements.length; i++){
			element = elements[i];
			var view = new View(element,{simple:true});
			var ref = element.getAttribute('sjs-element');
			if(ref) {
				//allow multiple element references to a single element
				var parts = ref.split(' ');
				for(var p=0; p<parts.length; p++ ) {
					views[parts[p]] = view;
				}
			}
		}

		//get element marked "root"
		//var rootElement = controllerInstance.views.root;



	//	controllerInstance.__sjs_content_map__ = buildContentMap(instance.dom);

		/*
			build content map before child components are resolved
		*/
		var rootContentMap = buildContentMap(deepClone);

		/*
		 * Anchor elements with data-sjs-tmp-anchor attibute
		 * are placeholders for included templates
		 * Process clone and attach templates
		 * */
		 _processIncludeAnchors.call(this,deepClone,controllerInstance,scope);


		/*build views*/
		views.root = new View(deepClone.children[0],{simple:true});
		views.root.contentMap = rootContentMap;
		views.root.htmlElement.__sjs_controller__ = controllerInstance;
		controllerInstance.views = views;

		/*content applicator*/
		/*
	 * Handle content declaration
	 * Getcontent nodes
	 */
	 if(parameters.content)
	 controllerInstance.content(parameters.content).replace();

		//apply style
		if(views.root){
			if(parameters && parameters.class)
				views.root.class(parameters.class).add();
		}

	};


	var container = document.createElement('span');
	function extractTemplates(fileSource){
		//var start  = window.performance.now();

		if(!this.components)
			this.components = new Namespace(''); //component exports

		container.innerHTML = fileSource;

		var nodes = container.querySelectorAll('sjs-component');
		for(var i=0; i<nodes.length; i++){
			var node = nodes[i];
			this.components[node.attributes['sjs-type'].value] = new Template(node);
			this.components.length = i + 1;
		}

		//var end = window.performance.now();
		//perf.total += (end-start);
		//console.log('template collection performance step: ' +  (end-start) + ' total: ' + perf.total) ;
		return this.components;
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

	var RESERVED_ATTRIBUTES = ["type", "name", "singleton", "class", "width", "height", "layout", "controller"];

	function collectAttributes(node, filter){
		if(!node) return null;

		var attributes = node.attributes;
		if(!attributes) return '';

		var result = ''
		,	separator = '';

		for(var i=0; i<attributes.length; i++){
			var attr = attributes[i]
			,	name = propertyName(attr.name,true);

			if(RESERVED_ATTRIBUTES.indexOf(name) < 0) continue;

			if(name == 'name') {
				name = '__sjs_name__';
			}
			if(startsWith(attr.value,'binding(')){
				result = result + separator + name + ':' + attr.value;
				separator = ', ';
				continue;
			}



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
			json = 'proxy.call(scope,{'+ attributes +'})';
		}

		else {
			if(attributes) attributes = attributes + ',';

			json = 'proxy.call(scope,{' + attributes +
			node.innerHTML.substring(idx+1)
			+')'
		}

		if(replace === true)
			node.parentNode.replaceChild(document.createTextNode(json),node);

		return json;
	}

	function handle_SJS_ELEMENT(node, parent, replace){
		var type = node.getAttribute('sjs-type')
		,	attributes = collectAttributes(node,RESERVED_ATTRIBUTES);

		if(attributes) attributes = attributes + ', '

		var json = 'proxy.call(scope,{'+
			attributes +
			node.innerHTML.substring(node.innerHTML.indexOf('{')+1)
			+')'

		if(replace === true)
			node.parentNode.replaceChild(document.createTextNode(json),node);

		return json;
	}

	function handle_INLINE_HTML(node, parent, replace){
		var scope = this
		,	attributes = collectAttributes(node,RESERVED_ATTRIBUTES);

		var _type = scope.getNextTemplateName()
		,	json = '';

		if(attributes) attributes = ',' + attributes;
		else attributes = '';

		if(parent.tagName == 'SJS-ELEMENT')
			json = 'null, type:\'' + _type + '\'';
		else
			json = 'proxy.call(scope,{type:\''+ _type + '\''+ attributes +'})';

		if(replace === true)
			node.parentNode.replaceChild(document.createTextNode(json),node);

		/*
			build new template and store within scope
			run template compiler
		*/
		var sjs_node = document.createElement('sjs-component');

		sjs_node.appendChild(node);
		var template = new Template(sjs_node);
		template.type = _type;


		if(parent.tagName == 'SJS-ELEMENT'){
			sjs_node.attributes['sjs-controller'] = 'Controller';
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
			,	json = convertToProxyJson.call(scope, node, node.tagName)
			, 	fn = new Function("var binding = arguments[0].binding; var proxy = arguments[0].proxy; " +
								  "var scope = this; var window = null; var document = null; return " + json)

			var result = fn.call(scope,sjs());

			if(typeof result !==  'function'){
				result = proxy.call(scope,result);
			}

			var a = template.addChild(result);
			parent.replaceChild(a,node);
		}
	};




	function resolveBinding(binding, instance, key, scope){
		if(!binding) return;
		resolveBinding(binding.prev, instance, key, scope);

		var source = null;
		switch(binding.type){
		case BINDING_TYPES.SELF:
			break;

		case BINDING_TYPES.PARENT:
			if(!instance.parent) throw 'Cannot resolve parent binding, [instance.parent] is null';

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

			//1. component lookup
			var vartype = scope.components.lookup(binding.vartype);
			//2. imports lookup
			if(!vartype)
				vartype = scope.lookup(binding.vartype);
			//3. target not found
			if (!vartype) throw 'Unable to resolve binding target type: ' + binding.vartype;

			while(parent) {
				if(parent.__sjs_type__ === vartype.__sjs_type__ || (parent instanceof vartype)) {
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
		if(source.value() && source.value().__sjs_event__ &&
		  (!dest.value() || !dest.value().__sjs_event__)) {
			var _s = source;
			source = dest;
			dest = _s;
			_s = null;
		}

		/* Perform binding here */

		/*  this is event binding only allow functions to be bound to events */
		if(dest.value() && dest.value().__sjs_event__) {
			if(typeof source.value() !== 'function')
				throw 'Cannot establish binding between \''+ key + '\' and \'' + binding.prop + '\'. Check that properties are of types \'function\'';

			dest.instance[dest.path].subscribe(source.value(), source.instance);

			return;
		}

		if(source.value().__sjs_isproxy__ === true){
				dest.instance[dest.path] = source.instance[source.path];
		}
		else if(typeof source.value() === 'function'){
			dest.instance[dest.path] = 	function(){
					return source.instance[source.path].apply(source.instance,arguments);
				}
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
    //no components in this module
		if(!scope.components || scope.components.length < 1) return; //no templates in this module

		var keys = Object.keys(scope.components);

		for(var i=0; i< keys.length; i++) {
			var template = scope.components[keys[i]];
      if(! (template instanceof Template)) continue;
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

		resolveCustomElements.call(scope,template);

		var component = createComponent(template.controller, template, scope);
		scope.components[template.type] = component;

		return component;

	};


	function configureHierarchy(instance, args){
		if(!instance) return;

		var scope = this;

		instance.parent = args.parent;
		instance.__sjs_visual_parent__ = args.parent;

		if(!instance.parent) return;


		instance.parent.children.push(instance);
		instance.__sjs_visual_parent__.__sjs_visual_children__.push(instance);
	//	if(!args.ref) return;

		if(typeof args.__sjs_name__ == 'string') {
			instance.parent.children[args.__sjs_name__] = instance;
			return;
		}

		if(args.ref instanceof Binding){
			var ti = args.ref.getTargetInstance(instance,scope);
			if(!ti) throw 'Unable to locate target instance';
			ti.ref[args.ref.prop] = instance;
			return;
		}

		if(args['class'] instanceof Binding){
			var ti = args['class'].getTargetInstance(instance,scope);
			if(!ti) throw 'Unable to locate target instance';
			args['class'] = propertyValue(ti)(args['class'].prop).value;
			return;
		}

	//	throw 'Invalid [ref] value, must be a string or an instance of Binding';
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

/*
			var obj = Object.create(controller.prototype);
			obj.constructor = controller;
*/

			var obj = new controller(args);

			obj.__sjs_type__ = template.type;
			obj.children = [];
			obj.__sjs_visual_children__ = [];
			obj.scope = scope;

			obj.__sjs_args__ = args;

			/*
			 * assign reference to a parent and
			 * append to children array
			 * */
			configureHierarchy.call(args._includer_scope,obj,args);

			/*
				Auto-creating event casters
			*/
			//linkupEvents(obj);


			/*
			 * Bind declarative parameters
			 */
			bindDeclarations(args, obj, args._includer_scope);

			/*
				Instantiate Template
			*/
 			template.getInstance(obj, args, scope);


			obj.initialize();
			//controller.apply(obj, [args]);

/*		postpone singleton
			if(args.singleton) {
				args._includer_scope.singletons.constructors.push(this.constructor.component);
				args._includer_scope.singletons.instances.push(obj);
			}
*/
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
		Component.__sjs_type__ = template.type;

		return Component;
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
	 * Builds module and compiles late(s) from module definition.
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
		if(typeof m === 'function'){
			return Module({definition:m});
		}

		//dependent module definition
		if( typeof m === 'object' && typeof m.definition === 'function'){
			return Module(m);
		}

		//lookup module
		if(typeof m  === 'string'){
			var mdl = findModule(m);
			return function(callback){
				if(mdl != null) {
					if(typeof callback === 'function') callback(mdl);
					return mdl;
				}

				load([m],function(){
					if(typeof callback === 'function') callback(findModule(m));
				})

				return mdl;
			};
		}

		return sjsExports;}
	//core.debug = debug;
	return sjs;

})(window,document);
