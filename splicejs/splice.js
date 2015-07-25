

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

	var URL_CACHE = new Array();	

	/*
	  	Bootloading files
	*/
	var BOOT_SOURCE = [];
	var LOADER_PROGRESS = {total:0, complete:0};

	var FILE_EXTENSIONS = {
		javascript: '.js', 
		template: 	'.html',
		style: 		'.css',
		route: 		'.sjsroute', 
	};


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

	CSS Parser

*/

var CSSParser = function(){

	var SPACE = 'SPACE', COMMENT = 'COMMENT', IDENTIFIER = 'IDENTIFIER', 
		OPEN_BRACKET = 'OPEN_BRACKET', CLOSE_BRACKET = 'CLOSE_BRACKET',
		OPEN_BRACE = 'OPEN_BRACE', CLOSE_BRACE='CLOSE_BRACE',
		OPEN_PARENTHESIS = 'OPEN_PARENTHESIS', CLOSE_PARENTHESIS='CLOSE_PARENTHESIS',
		COLON = 'COLON', SEMICOLON = 'SEMICOLON', COMMA = 'COMMA', OPERATOR = 'OPERATOR';

	var SELECTOR = 1, OPENSCOPE = 2, CLOSESCOPE = 3, RULE = 4;	

	var CSSLexer = function CSSLexer(input){
		
		this.i = 0;
		this.input = input;
		this.c = input[0];
	};

	CSSLexer.prototype.consume = function(){
		var cons = this.c;
		this.c = this.input[++this.i];

		return cons;
	};

	CSSLexer.prototype.lookahead = function(n){
		return this.input[this.i+n];
	}

	CSSLexer.prototype.getNextToken = function(){

			if(this.c == undefined) return null;

			var a = space(this);
			if(a) return a;

			if(a = comment(this)) 		return a;
			
			if(a = identifier(this)) 	return a;

			if(a = bracket(this)) 		return a;

			if(a = brace(this)) 		return a;

			if(a = parenthesis(this)) 	return a;
			
			if(a = colon(this)) 		return a;

			if(a = semicolon(this)) 	return a;

			if(a = comma(this)) 		return a;

			if(a = operator(this))		return a;

	};


	function isSpace(c){
		if(	c === ' ' 	|| 
			c === '\n'	||
			c === '\r'  ||	
			c === '\t') return true;
	};


	function space(lex){
		if(isSpace(lex.c)) return [SPACE, lex.consume()];
	}


	function comment(lex){
		var c 	= lex.c;
		var c1 	= lex.lookahead(1);
		var comment = '';

		if(c == '/' && c1 == '*') {
			comment += lex.consume();
			c = lex.c;
			while(c && c != '/') {
				comment += lex.consume();
				c = lex.c;
			}
			comment += lex.consume();
		}
		if(!comment || comment == '') return null;
		return [COMMENT, comment];
	}


	function identifier(lex){

		var c = lex.c;
		var code = c.charCodeAt();

		var result = '';

		while(	c == '.' || c == '#' || c =='-'  || 
				c == '%' || c == '*' ||
				(code >= 48 && code <= 57)	||	/*0-9*/ 
				(code >= 65 && code <= 90 ) || 	/*A-Z*/
				(code >= 97 && code <= 122) 	/*a-z*/ ){
			
			result += lex.consume();

			c = lex.c;
			code = c.charCodeAt();
			
		}

		if(!result || result == '') return null;
		return [IDENTIFIER, result];
	}
	
	function operator(lex) {
		if(lex.c == '=') return [OPERATOR, lex.consume()];
	}

	function bracket(lex){
		if(lex.c == '[') return [OPEN_BRACKET,  lex.consume()];
		if(lex.c == ']') return [CLOSE_BRACKET, lex.consume()];
	}

	function brace(lex){
		if(lex.c == '{') return [OPEN_BRACE,  lex.consume()];
		if(lex.c == '}') return [CLOSE_BRACE, lex.consume()];
	}

	function parenthesis(lex) {
		if(lex.c == '(') return [OPEN_PARENTHESIS, lex.consume()];
		if(lex.c == ')') return [CLOSE_PARENTHESIS,lex.consume()];
	}

	function colon(lex){
		if(lex.c == ':') return [COLON, lex.consume()];
	}

	function semicolon(lex){
		if(lex.c == ';') return [SEMICOLON, lex.consume()];
	}

	function comma(lex){
		if(lex.c == ',') return [COMMA, lex.consume()];	
	}



	
	var CSSParser = function(input){

		this.lexer =  new CSSLexer(input);
		this.consume();

	}

	CSSParser.prototype.consume = function(){
	
		var token = this.token;
		var t = this.lexer.getNextToken();
		
		if(!t) { this.token = null; return token; }

		if(t[0] == COMMENT) this.consume(); //skip comments
		this.token = {type:t[0], text:t[1]};

		return token;
	}


	CSSParser.prototype.nextStatement = function(){

		if(!this.token) return null;

		whitespace(this);

		var grp =  stylegroup(this);
		if(grp) {
			var group = {
				isRuleGroup:true,
				key:grp.key,
				rules:[]
			};
			whitespace(this);
			this.match(OPEN_BRACE); this.consume();

				do {
				whitespace(this);

				var rule =  stylerule(this);

				whitespace(this);   
				group.rules.push(rule);

				} while(this.token.type == IDENTIFIER);

			this.match(CLOSE_BRACE); this.consume();

			return group;
		}
		
		var rule =  stylerule(this);

		if(!rule) return null;		   

		return rule;
	}

	CSSParser.prototype.match = function(type){
		if(!this.token) return;

		for(var i=0; i<arguments.length; i++){
			if(this.token.type == arguments[i]) return;
		}
		
		throw 'Invalid syntax';
	}


	function whitespace(parser){
		if(!parser.token) return;
		while( parser.token &&	(
				parser.token.type == SPACE || 
				parser.token.type == COMMENT)
			) parser.consume();
	}


	function stylegroup(parser) {
		if(!parser.token) return;
		if(!parser.token.type == IDENTIFIER || 
			parser.token.text.toUpperCase() != 'SJS-STYLE') return;

		parser.consume();	
		parser.match(OPEN_BRACKET); parser.consume();
		parser.match(IDENTIFIER); 	parser.consume();
		parser.match(OPERATOR); 	parser.consume();
		parser.match(IDENTIFIER); var key = parser.consume().text;
		parser.match(CLOSE_BRACKET); parser.consume();	

		return {key:key}; 	
	}


	function selector(parser){
		if(!parser.token) return null;
		var text = '';
		while(parser.token.type == IDENTIFIER) {
			text += parser.consume().text; 
			parser.match(SPACE, OPEN_BRACE, COLON);
			
			if(parser.token.type == COLON) {
				text += parser.consume().text;
				parser.match(IDENTIFIER);
				continue;
			}

			if(parser.token.type == SPACE) {
				text += parser.consume().text;
				whitespace(parser);
			}

		}
		return text;
	};


	function propertystyle(parser){
		if(!parser.token) return;

		var rr = [];

		whitespace(parser);

		var r = '';
		parser.match(IDENTIFIER);
			r += parser.consume().text;
		whitespace(parser);
		parser.match(COLON);
			rr[0] = r;
			r += parser.consume().text;
		whitespace(parser);
		parser.match(IDENTIFIER);
		var style = '';
		while(parser.token.type == IDENTIFIER || 
		      parser.token.type == SPACE) {
				var x = parser.consume().text;
				style += x;
				r += x;

				if(parser.token.type == OPEN_PARENTHESIS){
					x = multivalue(parser);
					style += x;
					r += x;
				}	
		}

		whitespace(parser);

		parser.match(SEMICOLON);
			rr[1]= style;
			r += parser.consume().text;

		whitespace(parser);

		rr[2] = formatCSSProperty(rr[0]);
		return rr;
	}

	function multivalue(parser){
		if(!parser.token) return;

		var result = parser.consume().text;
		whitespace(parser);
		while(	parser.token.type == IDENTIFIER || 
				parser.token.type == SPACE ||
				parser.token.type == COMMA ){
			result += parser.consume().text;
		}
		parser.match(CLOSE_PARENTHESIS);
			result += parser.consume().text;

		return result;
	}

	function stylerule(parser){

		var sel =  selector(parser);
	    parser.match(OPEN_BRACE);  parser.consume();
		var stl =  styles(parser);
	    parser.match(CLOSE_BRACE); parser.consume();

	    if(!sel || !stl) return null;		   

		return {selector:sel, styles:stl};
	}


	function styles(parser){
		if(!parser.token) return;

		var r = null;
		var result = [];
		while(r = propertystyle(parser)){
			result.push(r);
			if(parser.token.type == CLOSE_BRACE) break;
		}
		whitespace(parser);
		
		return result;
	}


	function parse(input,oncomplete){
		if(!oncomplete || typeof(oncomplete)!= 'function' ) return;

		var parser = new CSSParser(input);
		
		var statement = null, counter = 0, result = [];

		while(statement = parser.nextStatement()){
			
			if(statement.isRuleGroup) {
				result[statement.key] = statement.rules;
			}	
			else {
				result.push(statement);
			}

			counter++;
			if(counter > 100000) break;
			
		}

		oncomplete(result);
	}

	return function(input){
		return function(oncomplete){
			if(!oncomplete || typeof(oncomplete)!= 'function' ) return;
			parse(input, oncomplete);
		}
	}; 

}();


function cssComposeStyle(rules){

	var r = '';
	for (var i =0; i <  rules.length; i++) {
		r+= ' ' + rules[i];
	};

	return r;
}

function cssMergeStyle(a, b) {
	if(a == b) return b;
	if(a == null) a = '';
	if(b == null) b = '';
	return a + ' ' + b;
}

function formatCSSProperty(property){

	var result = '';
	for(var i=0; i<property.length; i++){
		var c = property[i];
		if(c == '-') {
			c = property[++i].toUpperCase();
		}
		result +=  c;
	}
	return result;
}	


function applyStyleProperties(style, rules){
	for(var i=0; i<rules.length; i++){
		style[rules[i][2]] = rules[i][1];
	}
}


function applyCSSRules(rules, element, parentId){

	for(var i=0; i<rules.length; i++){
		var rule = rules[i];
		var elements = element.querySelectorAll(rule.selector);		

		for (var n = 0; n < elements.length; n++) {
			var process = false; 

			if(parentId) {
				var p = elements[n];
				while(p) {
					if(p.id == parentId) { process = true; break;}
					if(p == element) break;
					p = p.parentNode;
				}
			} else {
				process = true;
			}

			if(!process) continue; 
			var style = elements[n].style;
			applyStyleProperties(style,rule.styles);
			
		}

	}

	_.debug.log('Working on CSS Rules');
};


/*
	
----------------------------------------------------------

	Routing FIle Parser

*/

var RouteParser = function(){


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


	function applyPath(src){
		var path = this.path;
		var regex = /<img\s+src="(\S+)"\s*/igm;
	
		var match = null;
		var asrc = '';
		
		var lastMatch = 0;

		while(  match = regex.exec( src ) ){
			var apath = absPath(_.home(match[1],path));
			
			var left = src.substring(lastMatch, match.index);
						

			asrc = asrc + left + '<img src="' + apath + '" ';
			lastMatch += match.index + match[0].length;

			core.debug.log(apath);
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

	function isHTMLElement(object){
		if(!object) return false;
		if(object.tagName && object.tagName != '') return true;
		return false;
	};


	function required(typeName){
		return function(callback){
			core.include([typeName],callback);
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

	 	var params = '';
        var separator = '';
        if(config.data)
        for(var d=0; d < config.data.length; d++){
        	params += separator + config.data[d].name + '=' + encodeURIComponent(config.data[d].value);
           	separator = '&';
        }

        var requestURL = config.url;

        if(params.length > 0 && type === 'GET'){
        	requestURL = requestURL + "?" + params;
        }

		this.transport.open(type,requestURL,true);
		this.transport.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded charset=utf-8');

        //in ie8 onreadystatechange is attached to a quasy window object
        var self = this;
        
        this.transport.onload = function(){
        	var response = {text:self.transport.responseText, xml:self.transport.responseXML};
        	if(config.onok)	config.onok(response);
        }

		this.transport.send(params); 
		return this;
	};

	

	HttpRequest.post = function(config){
		return new HttpRequest().request('POST',config);
	};

	HttpRequest.get = function(config){
		return new HttpRequest().request('GET',config);
	};


/*
	
----------------------------------------------------------
	
	SpliceJS Event Model

*/
	
	var Event = function Event(){};

	function mousePosition(e){
        //http://www.quirksmode.org/js/events_properties.html#position
		var posx = 0;
		var posy = 0;
		
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
	}

	function eventArgs(e){
		return {
			mouse:mousePosition(e)
		}		
	};

	Event.create = function(object, property){

		

		var callbacks = [[]], instances = [[]];
		var cleanup = {fn:null, instance:null };

		var MulticastEvent = function MulticastEvent(){
			var idx = callbacks.length-1;
			for(var i=0; i < callbacks[idx].length; i++) {
				callbacks[idx][i].apply(instances[idx][i],arguments);
			}
			if(typeof cleanup.fn === 'function') {
				cleanup.fn.call(cleanup.instance);
			}

			cleanup.fn 		 = null;
			cleanup.instance = null;
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
			
			callbacks[idx].push(callback);
			instances[idx].push(instance);
			return this;
		};

		MulticastEvent.unsubscribe = function(callback){
			var idx = callbacks.length-1;
			for(var i=0; i < callbacks[idx].length; i++) {
				if( callbacks[idx][i] == callback ) {
					core.debug.log('unsubscribing...');
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
			object[property] = function(e){

				if(!e) e = window.event;

				MulticastEvent(eventArgs(e));
			}
			object[property].subscribe = function(){
				MulticastEvent.subscribe(arguments);
			}			
		}
		else { 
			object[property] = MulticastEvent;
		}
		
		return MulticastEvent;
	};
	Event.attach = Event.create;

	core.Event = Event;



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
	}
	
	/* 
	 * !!! Bidirectional bindings are not allowed, use event-based data contract instead 
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

				if(!vartype) vartype = _.Namespace.lookup(this.vartype);

				if(!vartype) throw 'Unable to resolve binding target type';
			
				
				while(parent) {

					if(parent instanceof vartype) return parent;

					parent = parent.parent;
				}

			break;
		}

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
	 *	Binding type constants 
	 * */
	
	Binding.Direction = {
			FROM : 1,
		/* Left assignment */
			TO: 2,
		/* 
			determine binding based on the type of objects 
			use right assignment by default
		*/	
			AUTO: 3
	};
	/* Right assignment */
	
	Binding.SELF 			= 1;
	/* Look for properties within immediate instance */
	
	Binding.PARENT 			= 2;
	/* Look for properties within direct parent of the immediate instance*/
	
	Binding.FIRST_PARENT 	= 3;
	/* Look for properties within a first parent  where property if found */
	
	Binding.ROOT 			= 4;
	/* Look for properties within a root of the parent chain */
	
	Binding.TYPE 			= 5;
	/* Indicates type lookup lookup */


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
		
		var mainPageHtml = document.body.innerHTML;
		document.body.innerHTML = '';

		if(BOOT_SOURCE.length > 1) {
			core.include(BOOT_SOURCE, function(){
				if(typeof(core.run) === 'function') { 	core.run();  return; }	
				var scope = new Scope();
				var template = constructTemplate(mainPageHtml);
				template.declaration = {type:'MainPage'};

				var component = compileTemplate.call(scope,template);
				display(new component());

			})
		}
		else {
			if(typeof(core.run) === 'function') { core.run(); return; }
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
	
	
	

	
	
	
	function Iterator(collection){
		this.data = collection;
		this.i = -1;
	};

	Iterator.prototype.next = function(){
		return this.data[++this.i];
	};
	
	


	core.getLoaderProgress = function(){
		return LOADER_PROGRESS;
	}


	
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
		//filename = window.SPLICE_PUBLIC_ROOT +'/'+filename;
		var relativeFileName = filename; 
		filename = _.absPath(filename);

		/*
		 * */

		if(	endsWith(filename, FILE_EXTENSIONS.style) 		|| 
			endsWith(filename, FILE_EXTENSIONS.javascript)  || 
			endsWith(filename, FILE_EXTENSIONS.template) 	|| 
			endsWith(filename, FILE_EXTENSIONS.route) )
		if(URL_CACHE[filename] === true){
			core.debug.log('File ' + filename + ' is already loaded, skipping...');
			loader.progress--; 
			LOADER_PROGRESS.complete++;
			loader.loadNext(watcher);
			return;
		}
		
		core.debug.log('Loading: ' + filename);
		
		var head = document.getElementsByTagName('head')[0];
		
		/*
		 * Load CSS Files - global
		 * */
		if(endsWith(filename, FILE_EXTENSIONS.style) && !loader.cssIsLocal){
			
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
		 * Load CSS Files - local
		 * */
		if(endsWith(filename, FILE_EXTENSIONS.style) && loader.cssIsLocal == true){
			core.debug.log('Loading CSS Locally');
			watcher.notifyCurrentlyLoading({name:relativeFileName,obj:null});
			HttpRequest.get({
				url: filename,
				onok:function(response){
					URL_CACHE[filename] = true;

					CSSParser(response.text)(
						function(rules){
							loader.onitemloaded({ext: FILE_EXTENSIONS.style, filename:filename, data:rules});
							loader.progress--; 
							LOADER_PROGRESS.complete++;
							loader.loadNext(watcher);
						}
					);
				}
			});
			return;
		}


		/*
		 * Load javascript files
		 * */
		if(endsWith(filename, FILE_EXTENSIONS.javascript)) {
			var script = document.createElement('script');
			
			//tell Splice what is loading
			watcher.notifyCurrentlyLoading({name:relativeFileName,obj:script});
			
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
		 * Load html templates
		 * */
		if(endsWith(filename, FILE_EXTENSIONS.template)){
			//tell Splice what is loading
			watcher.notifyCurrentlyLoading({name:relativeFileName,obj:null});
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
		 	watcher.notifyCurrentlyLoading({name:relativeFileName,obj:null});
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
	
	

	core.dumpUrlCache = function (){ 
		var cache = [];
		for(var key in URL_CACHE){
			if( URL_CACHE.hasOwnProperty(key)) {
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
	


/*

----------------------------------------------------------

	Templating Engine

*/
	
	var Scope = function Scope(path){
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
		 * */
		var scope = this;
		
		var Proxy = function Proxy(proxyArgs){
			if(!(this instanceof Proxy) ) throw 'Proxy object must be invoked with [new] keyword';
		
			/* create instance of the proxy object
			 * local scope lookup takes priority
			 */
			var obj = null;
			
			if(!obj) try {
				obj = scope.templates[args.type];
			} catch(ex) {}
					  
			if(!obj) try {
				obj = scope[args.type]; 
			} catch(ex) {}
			

			if(!obj) try {
				obj = _.Namespace.lookup(args.type);
			} catch(ex) {}

			
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


	



	var Controller = core.Namespace('SpliceJS.Core').Class(function Controller(){


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

	});

	Controller.prototype.onAttach 	= Event;
	Controller.prototype.onDisplay 	= Event;
	Controller.prototype.onDomChanged = Event;
	

	var Concrete = core.Namespace('SpliceJS.Modular').Class(function Concrete(dom){
		this.dom = dom;
	});
	

	Concrete.prototype.export = function(){
		return this.dom;
	};

	Concrete.prototype.applyContent = function(content, suspendNotify){
		
		var deepClone = this.dom;
		var tieInstance = this.tieInstance;

		
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
				var contentInstance = new obj({parent:tieInstance});
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

	
	var Template = core.Class(function Template(dom){
		this.dom = dom;
		dom._template = this;
		/*
		 * Object references to child templates
		 * child DOM tree have already been merged with parent
		 * this array will hold objects with soft references to
		 * templates DOMs
		 * */
		this.children = [];
		
	});
		
	Template.prototype.addChild = function(childTemplate){
		this.children.push(childTemplate);
		return this.children.length-1;
	};
	
	Template.prototype.setBinding = function(target){
		this.dom._binding = target;
		target._binding = this.dom;
	};
	
	Template.prototype.getBinding = function(){
		return this.dom._binding;
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
	Template.prototype.getInstance = function(tieInstance, parameters, scope){
		
		var build = this.dom;
		
		var deepClone = build.cloneNode(true);
		deepClone.normalize();

		 
		var instance = new Concrete(deepClone);
		instance.tieInstance = tieInstance;
		
		deepClone._concrete = instance; // DOM get a reference to the concrete instance
		
		/* process dom references */
		var elements = deepClone.querySelectorAll('[data-sjs-element]');
	
		var element = deepClone;
		if(tieInstance)
		for(var i=-1; i< elements.length; i++){
			
			if(i > -1) element = elements[i];
			
			var ref = element.getAttribute('data-sjs-element'); 
			if(ref) tieInstance.elements[ref] = element; 	
		}
		
		
	
	   /*
		* Handle content declaration
		* Getcontent nodes
		*/	
		if(parameters.content) 
		instance.applyContent(parameters.content, true);


		if(typeof tieInstance.handleContent === 'function'){
			tieInstance.handleContent(parameters.content);
		}


		


		/* 
		 * Anchor elements with data-sjs-tmp-anchor attibute
		 * are placeholders for included templates
		 * Process clone and attach templates 
		 * */
		var anchors = deepClone.querySelectorAll('[data-sjs-tmp-anchor]');
		

		for(var i=0; i < anchors.length; i++){
			
			var childId = anchors[i].getAttribute('data-sjs-child-id');
			var proxy 	= this.children[childId];
			
			
			var c_instance = new proxy({parent:tieInstance, parentscope:scope});
			
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



	function extractTemplates(fileSource){
		
		var scope = this;

		//var regex = /<!--\s+@(template|selector)\s*:\s*({.*})\s+-->/igm; 	//script start RE
		var regex = 	/<sjs-template(\s*.*\s*)>([\s\S]+?)<\/sjs-template>/igm;
		var attrRegex = /(\S+)="(\S+?)"/igm;

		var match = null;
		
		var lastMatch = null;
		var templates = new Array();

		//match a single template at a time
		while( match = regex.exec( fileSource ) ){
			
			
			var attr = match[1];
			var body = match[2];
			

			//convert attributes to object respresentation
			var attrMatch = null;	
			var attributes = {};

			while(attrMatch = attrRegex.exec(attr)){

				var prop 	= attrMatch[1];
				var value 	= attrMatch[2];

				attributes[prop] = value;
			}
								
			templates.push({
				src:applyPath.call(scope,body),
				spec:attributes 
					/* 
					 * attributes are parameters specified in the @template declaration
					 * in the form or JSON literal, it is evaluated as is
					 * hence must be of the correct JSON syntax
					 *  */
			});
		}
		return templates;
	};


	function handle_SJS_INCLUDE(node, parent, replace){
		var type = node.getAttribute('type'),
			json = '';

		var idx = node.innerHTML.indexOf('{');
		if( idx < 0){
			json = '_.Obj.call(scope,{type:\''+type+'\'})';
		}
			
		else {	
			json = '_.Obj.call(scope,{type:\''+type+'\','+
			node.innerHTML.substring(idx+1)
			+')'
		}

		if(replace === true)
			node.parentNode.replaceChild(document.createTextNode(json),node);

		return json;
	}

	function handle_SJS_ELEMENT(node, parent, replace){
		var type = node.getAttribute('type');

		var json = '_.Obj.call(scope,{'+
			node.innerHTML.substring(node.innerHTML.indexOf('{')+1)
			+')'
		
		if(replace === true)
			node.parentNode.replaceChild(document.createTextNode(json),node);
	
		return json;
	}	

	function handle_INLINE_HTML(node, parent, replace){
		var scope = this;

		var type = scope.getNextTemplateName(),
			json = '';

		if(parent.tagName == 'SJS-ELEMENT')
			json = 'null, type:\'' + type + '\''; 			
		else
			json = '_.Obj.call(scope,{type:\''+ type + '\'})';

		if(replace === true)
			node.parentNode.replaceChild(document.createTextNode(json),node);

		/* 
			build new template and store within scope 
			run template compiler
		*/
		var wrapper = document.createElement('span');
		wrapper.appendChild(node);
		var template = new Template(wrapper);
		template.normalize();


		if(parent.tagName == 'SJS-ELEMENT'){
			template.declaration = {type:type, tie:'SpliceJS.Controls.UIElement'};
		}
		else {
			template.declaration = {type:type};
		}

		compileTemplate.call(scope, template);

		return json
	}	

	function convertToProxyJson(dom, parent, replace){
		
		var scope = this;

		if(	dom.tagName != 'SJS-INCLUDE' && 
			dom.tagName != 'SJS-ELEMENT')
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
			
			var node = nodes[i];
			var parent = node.parentNode;

			var json = convertToProxyJson.call(scope,node, node.tagName);

			var result = null; 
			eval('result = ' + json);

			if(typeof result !==  'function'){				
				result = _.Obj.call(scope,result);
			}

			var childId = template.addChild(result);

			var a = document.createElement('a');
			a.setAttribute('data-sjs-tmp-anchor',result.type);
			a.setAttribute('data-sjs-child-id',	childId);
			
			parent.replaceChild(a,node);
		}
	};




	function resolveBinding(binding, instance, key, scope){
		if( !(binding instanceof _.Binding) ) throw 'Cannot resolve binding, source property is not a binding object';
		
		var source = null;
		
		switch(binding.type){
		case _.Binding.SELF:
			break;
		
		case _.Binding.PARENT:
			if(!instance.parent) throw 'Cannot resolve parent binding, instance parent is not null';
			
			var v = Binding.Value(instance.parent);

			source = { 
						instance: 	v.instance(binding.prop),
						path: 	  	v.path(binding.prop),
						value: 		function(){return this.instance[this.path];}
					};
			break;
			
		case _.Binding.FIRST_PARENT:
			break;
			
		case _.Binding.ROOT:
			break;
			
		case _.Binding.TYPE:
			_.debug.log('Resolving binding to type: ' + binding.vartype);
			var parent = instance;
			
			var vartype = _.Namespace.lookup(binding.vartype);
			if(!vartype) throw 'Unable to resolve binding target type';
			
			while(parent) {
				if(parent instanceof vartype) {
					_.debug.log('Found instance of type: ' + binding.vartype);
					
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
		if(dest.value() === _.Event )  { dest.instance[dest.path] 	  = _.Event.create(); }
		if(source.value() === _.Event) { source.instance[source.path] = _.Event.create(); }


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
	
		var wrapper = document.createElement('span');
		wrapper.innerHTML = html;

		return new Template(wrapper);
	}


	/*
	 * Compiles template within a given loading scope
	 * 
	 * */
	function compileTemplates(scope){
		var templateSource = scope.templates;
		var keys = Object.keys(templateSource);
		
		for(var i=0; i< keys.length; i++) {
			var key = keys[i];
			if(!templateSource[key]) continue;


			var declaration = templateSource[key];

			var template = constructTemplate(declaration.src);

			/* copy template declaration attributes */		
			template.declaration = declaration.spec;

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

		
		var scope = this;


		/*
		 * Run notations and scripts to form a 
		 * final template DOM
		 * */
		_.debug.log('Processing template notations for module: ');		
		//AnnotationRunner.call(scope,template);
		resolveCustomElements.call(scope,template);

		//_.debug.log('Processing template scripts for module: ' );
		//new ScriptDomRunner(template.dom).run({module:''});
		
		template.normalize();

		

		
		var template_name 			 = template.declaration.type;
		var template_component_index = template.declaration.type.toUpperCase();
		var tie_name  				 = template.declaration.tie; 
		
		var split_name 	= _.splitQualifiedName(template_name);
		var split_tie 	= _.splitQualifiedName(tie_name);
		
		
		/* 
		 * 4 options
		 * 
		 * local 	local
		 * local 	global
		 * 
		 * 
		 * global 	local
		 * global 	global
		 * */
		
		
		/* 
		 * this is a local scope template declaration 
		 * local templates may only couple with explicitly defined ties
		 * same-name linkage is not possible,
		 !!! unless implicit tie is also within the local scope
		 * */
		if(!split_name.namespace || split_name.namespace === '') { 	
			template.isLocal = true;
			
			var tie = tie_name ? (_.Namespace.lookup(tie_name) || scope[tie_name]) : 
					  scope[template_name] ? scope[template_name] : Controller;
			
			if(tie && tie.isComponent) tie = tie.tie;
			


			return scope.templates[template.declaration.type] = 
				   scope.compindex[template_component_index] =
				   createComponent(tie,template, scope);
		
		}

		/*
		 * Namespace bound template declaration
		 * allow same-name binding
		 * */
		
		
		var nameLookup 	= _.Namespace.lookup(template_name);
		
		/* 
		 * found object by the same name 
		 * */
		if(nameLookup && typeof nameLookup !== 'function') throw 'Template declaration name: '+ name + ' is ocupied by another object!'; 
		
		if(nameLookup && !tie) tie_name = template_name;
		/* 
		 * If no tie code, add template object to a namespace
		 * and return
		 * */
		
		var tie 	= tie_name ? (_.Namespace.lookup(tie_name) || scope[tie_name]) : Controller;	
		
		if(tie && tie.isComponent) tie = tie.tie;
		
		var component = createComponent(tie, template, scope);
		var ns = _.Namespace(split_name.namespace);
		ns.add(split_name.name,component);
		
		return scope.templates[template.declaration.type] = component;
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

		throw 'Invalid [ref] value, must be a string or an instance of _.Binding';
	}

	
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
			
			
			obj.ref = {};
			obj.elements = {};
			obj.children = [];
			
			/* 
			 * assign reference to a parent and 
			 * append to children array
			 * */
			configureHierarchy.call(scope,obj,args);
			

			/*
				Auto-creating event casters
				
			*/
			for(var key in  obj){
				if(obj[key] == _.Event){
					_.debug.log('Found event object');
					obj[key] = _.Event.create();
				}	
			}	


			/* inherit CSS scope from the template declaration */
			if(template && template.declaration.css) {
				obj['templateCSS'] = template.declaration.css;
			}


			obj.scope = scope;	

			
			/*
				Instantiate Template
			*/

			if(template)
			obj.concrete = template.getInstance(obj, args, scope);



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
						resolveBinding(parameters[key], tieInstance, key, scope);
						continue;
					}
				
					/* default property assignment */
					tieInstance[key] = parameters[key];
				}
			}



			tie.apply(obj, [args]);

			
			if(obj.applyCSSRules) obj.applyCSSRules();

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
	


	
	/*
	 * Alter include behavior to understand templates
	 * */
	var originalInclude = core.include;
	core.include = function(resources, oncomplete, onitemloaded){
		
		var handler = function(){

			var path = _.getPath(_.currentlyLoading.name).path;
			var scope = new Scope(path);

			if(typeof onitemloaded === 'function')
			onitemloaded.apply(this,arguments);
			
			var arg = arguments[0];
			if(!arg) return;
			if(arg.ext !== FILE_EXTENSIONS.template) return;
			
			var t = extractTemplates.call(scope,arg.data);
			if(!t) return;
			
			var templates = {};
			for(var i=0; i< t.length; i++){
				templates[t[i].spec.type] = t[i];
			}
			scope.templates = templates;
			compileTemplates(scope);
		}
		originalInclude.call(_,resources, oncomplete,handler);
	};
	


var Module = 
	/**
	 * Builds module and compiles template(s) from module definition. 
	 * The templates will be compiled recursively, 
	 * where inner templates are compiled first and then outer. 
	 * Any scripts embedded into template will be evaluated and 
	 * their result be injected into DOM, by replacing underlying script tag.
	 * @param moduleDefinition
	 */
	function Module(moduleDefinition){
		
		var path = _.getPath(_.currentlyLoading.name).path;

		var required 	= _.home(moduleDefinition.required,path);
		var moduleName 	= moduleDefinition.name;
		var definition  = moduleDefinition.definition;

		var cssIsLocal = moduleDefinition.cssIsLocal;
	
		/* required collection is always an Array */
		required = required instanceof Array ? required : null;

		var scope = new Scope(path);

		scope.createComponent = function(tie,template){return createComponent(tie,template,this);};
			
		_.debug.log(path);

		var templateDefinitions = new Array();
		var cssRules = [];
		
		/*
		 * Handler to receive template file sources
		 * each file may container any number of templates
		 * template are then extracted into templateDefinitions
		 * and assigned to module instance
		 * 
		 * Template compiler is called on module instance 
		 * */
		var collectTemplates = function(template){
			/* template is a template file as loaded
			 * extract template information
			 * */
			if(!template) return;

			if(template.ext == FILE_EXTENSIONS.template) {
				var t = extractTemplates.call(scope,template.data);
				
				for(var i=0; i< t.length; i++){
					templateDefinitions[t[i].spec.type] = t[i];
				}
			}

			//css is configured for local loading
			if(template.ext == FILE_EXTENSIONS.style && cssIsLocal == true){
				cssRules.push(template.data);
			}
		};
						
		/*
		 * Module has no required includes
		 * */
		if(!required || required.length < 1) {
			definition(); 
			return;
		}
		
		// flag is CSS is loaded into a local scope only
		required.cssIsLocal = cssIsLocal;

		/* 
		 * Load dependencies
		 * */
		 originalInclude.call(core, required, function(){	
			
			/*
			 * Define a module
			 * and create template scope 
			 * for template compilation
			 *
			 * Some modules may be simple dependency aggregators 
			 * in which case definition function is not available 
			 **/
			
			if(typeof definition === 'function') definition.call(scope,scope);
			
			scope.templates = templateDefinitions;
			scope.cssrules = cssRules;
			

			/* 
			 * Templates are compiled after module has been defined
			 * 
			 * */
			compileTemplates(scope);
			
		},collectTemplates);
	};






/*

--------------------------------------

	Core exports

*/
	
	//core.debug = debug;

	core.absPath = absPath;
	core.getPath = getPath;

	core.Obj = Obj;
	core.Binding = Binding;

	core.HttpRequest = HttpRequest;	
	core.Module = Module;
	core.CSS = {
		parser: 	CSSParser,
		applyRules: applyCSSRules
	};

	core.display = display;

	core.required = required;

	return core;

})(window,document);


