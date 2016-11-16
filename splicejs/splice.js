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

(function(window, document, global){

"use strict";

//plug console if it does not exist
var console = window.console || {error:function(){}};

//path delimiter
var _platform_ = window.__sjs_platform__;
if(!_platform_) _platform_ = 'WEB';

var _pd_ = '/'; //WEB
if(_platform_ == 'UNX') _pd_ = '/';
else if(_platform_ == 'WIN') _pd_ = '\\';

//_not_pd_ is used for in-string replacement must be correctly escaped
var _not_pd_ = _pd_ == '/'?'\\\\':'/';

var config = {platform: _platform_},
	//version qualifier
	regexVer = /([a-z]+:)*(([0-9]*\.[0-9]*\.[0-9]*)|\*)*-*(([0-9]*\.[0-9]*\.[0-9]*)|\*)*/,
	addedScript = null,	currentModuleSpec = null,
	importsMap = new Object(null), currentFrame = null, frameStack = new Array();


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
		throw 'Application entry point is not defined, "splice.js" script must have "sjs-main" attribute';
	}

	mixin(config, {
		appBase: 	context(window.location.href).path,
		sjsHome:	context(main.getAttribute('src')).path,
		sjsMain:	main.getAttribute('sjs-main'),
		version:	main.getAttribute('sjs-version'),
		mode:		main.getAttribute('sjs-start-mode'),
		mFormat:	main.getAttribute('sjs-module-format'),
		debug:    	main.getAttribute('sjs-debug') == 'true' ? true:false
	});
	//set default start mode to onload
	config.mode = config.mode || 'onload';

	//setup reserved modules
	importsMap['require.js'] = new ImportSpec('require.js','loaded');
	importsMap['exports.js'] = new ImportSpec('exports.js','loaded');
	
	onLoad(config);	
}

function mixin(_t, _s){
	if(!_s) return _t;
	var keys = Object.keys(_s);
	if(	_s == window || _s == document || _t == window || _t == document){
		return _t;
	}
	for(var key in keys){
		var p = _s[keys[key]];
		_t[keys[key]] = p;
	}
	return _t;
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
		throw Error('second argument not supported');
		}
		if (typeof prototype != 'object') {
		throw TypeError('argument must be an object');
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

function _parseVersion(version, isWild){
	if(!version) return null;
	var v = {target:'*'}, a = version.split(':');

	if(a.length == 2) v.target = _trim(a[0]);
	a = a[a.length-1].split('-');

	v.min = _trim(!a[0]?(isWild?'*':undefined):a[0]);
	v.max = _trim(!a[1]?(isWild?'*':undefined):a[1]);
	return v;
}

var PATH_VARIABLES = {};
function setPathVar(key, value){
	//path variable may be initialized
	if(PATH_VARIABLES[key]) throw 'Path variable may only be set once';
	PATH_VARIABLES[key] = value;
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
		if(parts[i] === '.') continue;
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
}

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
	//context must end with /
	var ctx = null;

	if(contextUrl) {
		ctx = contextUrl.replace(new RegExp(_not_pd_,"g"),_pd_);
		ctx = ctx.substring(0,ctx.lastIndexOf(_pd_)+1);
	}

	if(!ctx && config.appBase) ctx = config.appBase;

	if(ctx != null && ctx && ctx.substr(ctx.length-1) != _pd_)
		throw 'context URL must end with "'+ _pd_ +'"';

	return {
		isAbs: isAbsUrl(ctx),
		path:ctx,
		source:contextUrl,
		resolve:function(url){
			if(!url) return null;
			var ext = fileExt(url); 
			//no extension or something looks like extension but does not have a handler
			//gets a default .js extension
			//does not apply for special resouce names, starting with !
			if(url[0]!='!' && ext != '.js'){
				url = url + '.js';
			}
			if(url[0]=='!'){
				url = url.substring(1);
			}

			if(url == 'require.js') return url;
			if(url == 'exports.js') return url;

			url = url.replace(new RegExp(_not_pd_,"g"),_pd_);
			//resolve path variables
			url = spv(url);
			//not page context
			if(isAbsUrl(url)) return collapseUrl(url) ;
			return collapseUrl(ctx + url);
		}
	}
}

var fileExtRegex = /[0-9a-zA-Z-]+([.][0-9a-zA-Z]+)$/i;
function fileExt(f){
	var result = fileExtRegex.exec(f);
	return result!=null ? result[1] : null;
}

//some browsers do not support trim function on strings
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
if(typeof foo != 'function') throw 'unable to obtain function name, argument is not a function'
//match function name
var match = /function(\s*[A-Za-z0-9_\$]*)\(/.exec(foo.toString());
//if no match found try ES6 function-class match
if(!match)
	match  = /function class(\s*[A-Za-z0-9_\$]*\s*)\{/.exec(foo.toString());
if(!match) 
	match  = /class(\s*[A-Za-z0-9_\$]*\s*)\{/.exec(foo.toString());


if(!match) return 'anonymous';


var name = _trim(match[1]);
	if(!name) return 'anonymous';
	return name;
}


function _namespaceAdd(path,obj,isSealed){
	if(!path) return this;
	if(this.__sjs_seal__[path]) throw 'namespace ' +path +' is sealed';
	var parts = path.split('.');
	var target = this;
	for(var i=0; i<parts.length-1; i++){
		if(target[parts[i]] == null) target[parts[i]] = Object.create(null);
		target = target[parts[i]];
	}
	if(target[parts[parts.length-1]] != null) throw "namespace conflict: " + path;
	target[parts[parts.length-1]] = obj;

	if(isSealed == true) this.__sjs_seal__[path] = true;
}


function Namespace(){
	if(!(this instanceof Namespace) ) return new Namespace();
	this.sequence = 0;
	this.__sjs_seal__ = {};
	this.children = null;
}

Namespace.prototype = {
	add : function(path, obj, isSealed){
		if(typeof(path)=='object' || typeof(path) == 'function'){
			for(var i=0; i < arguments.length; i++){
				var arg = arguments[i];

				if(typeof arg === 'function' ){
					_namespaceAdd.call(this, fname(arg),arg,isSealed);
					continue;
				}

				if(typeof arg == 'object') {
					var keys = Object.keys(arg);
					for(var key in keys){
						_namespaceAdd.call(this, keys[key],arg[keys[key]],isSealed);
					}
					continue;
				}
			}
			return this;
		}

		if(typeof(path) == 'string'){
			_namespaceAdd.call(this, path,obj,isSealed);
		}
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

function currentScript(){
	if(document.currentScript) return document.currentScript.src;
	if(addedScript) {
		return addedScript;
	}
	if(document.scripts) {
		for(var i=document.scripts.length-1; i>=0; i--){
			var s = document.scripts[i]; 
			if(s.readyState && s.readyState == 'interactive') { 
				return s.src; 
			}
		}
	}
	return null;
}

var specLoaders = [];
function notifyLoaders(spec){
	var loaders = specLoaders[spec.fileName];
	for(var i=0; i<loaders.length; i++){
		loaders[i].onitemloaded(spec.fileName);
	}
}
function addLoader(spec,loader){
	var loaders = specLoaders[spec.fileName];
	if(!loaders) {
		loaders = specLoaders[spec.fileName] = [];
	}
	loaders.push(loader);
}
var _fileHandlers = {
	'.js': {
		importSpec:function(filename){
			return new ImportSpec(filename);
		},
		load: function(loader,spec){
			//add to loaders
			addLoader(spec,loader);

			//document script loader
			var filename = spec.fileName;
			var head = document.head || document.getElementsByTagName('head')[0];
			var script = document.createElement('script');
			script.setAttribute("type", "text/javascript");
			script.setAttribute("async","");
			script.setAttribute("src", filename);

			if(script.onload !== undefined){
				script.onload = function(e){
					notifyLoaders(spec)
					//spec.onloaded();
					//loader.onitemloaded(filename);
				};	
			} else if(script.onreadystatechange !== undefined){
				script.onreadystatechange = function(){
					if(script.readyState == 'loaded' || script.readyState == 'complete') {
						notifyLoaders(spec);
						//spec.onloaded();
						//loader.onitemloaded(filename);
					}
				}
			}
			addedScript = script.src;
			head.appendChild(script);
			addedScript = null;
		}
	}
};

function load(resources){
	// get base context
	var ctx = context();

	//setup frame
	// check if resources are abs urls, if not resolve to abs url
	// place resource urls onto a frame 
	new Loader().loadFrame(to(resources,function(i){
		if(!isAbsUrl(i)) return ctx.resolve(i);
		return i;
	}));
}

/*
	loader function
*/
function applyImports(imports){
	var scope = this;
	if(!scope.imports) scope.add('imports',new Namespace());
	if(!imports || imports.length <= 0) return;

	for(var i=0; i<imports.length; i++){
		if(!imports[i].namespace) continue;
		var ns = imports[i].namespace;
		var x = importsMap[imports[i].url];
		if(!x || !x.scope) continue;
		x = x.scope.__sjs_module_exports__;
		var keys = Object.keys(x);
		for(var key in keys){
			scope.add('imports.'+ns+'.'+keys[key], x[keys[key]]);
		}
	}
	
}

function ScopedPromise(exer,scope){
	this.onok = null;
	this.onfail = null;
	this.scope = scope;
	//resolve
	exer((function(okResult){
		//ok
		if(this.onok != null) this.onok(okResult);
		else this.okResult = okResult;
	}).bind(this),
	//reject 
	(function(failResult){
		//fail
		if(this.onfail != null) this.onfail(failResult);
		else this.failResult = failResult;
	}).bind(this));
}
ScopedPromise.prototype.then = function(fn){
	this.onok = fn;
	if(this.okResult !== undefined) fn(this.okResult);
	return this;
}
ScopedPromise.prototype['catch'] = function(fn){
	this.onfail = fn;
	if(this.failResult !== undefined) fn(this.failResult);
	return this;
}

function requireTemplate(imports){
	var scope = this;
	return new ScopedPromise(function(resolve,reject){
		scope.imports.$js.load(imports,function(){
		resolve(this);
		});
	},scope);
};


function applyImportArguments(imports){
	var scope = this;
	var result = [];
	for(var i=0; i<imports.length; i++){
		
		if(imports[i].url == 'require.js'){
			
			var fn = function(imports){
				//scope object has been passed
				if(imports instanceof Namespace){
					return requireTemplate.bind(imports);
				}
				//bind closure scope
				return requireTemplate.call(scope,imports);
			};
			//retain module scope
			fn.scope = scope;
			result.push(fn);
			continue;
		}
		
		if(imports[i].url == 'exports.js'){
			result.push(this.__sjs_module_exports__);
			continue;
		}

		var x = importsMap[imports[i].url];
		//some imports specs do not have scope objects
		if(!x || !x.scope) continue;
		result.push(x.scope.__sjs_module_exports__);
	}
	return result;
}

function _exports(scope){
	scope.__sjs_module_exports__ = Object.create(null);
	return function(){
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

function _vercomp(v1,v2){
	if(v1 == '*' || v2 == '*') return 0;
	if(!v1 || !v2) return undefined;

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


function ImportItem(ns,url){
	this.namespace = ns;
	this.url = url;
}

function qualifyImport(url){
	if(!url) return null;
	var parts = url.split('|');
	//nothing to qualify its just a URL
	if(parts.length == 1) return url;
	
	//unable to qualify url since config version is not present
	if(!config.version) return null;
	

	//parse config version
	var rc = regexVer.exec(config.version);
	//no mercy for invalid syntax
	if(!rc) throw 'invalid version configuration parameter: ' + config.version;

	//only version quallifier is supported
	//qualify version at parts[0]
	var r = regexVer.exec(_trim(parts[0]));
	
	//no mercy for invalid syntax	
	if(r == null) throw 'invalid version qualifier: ' + url; 

	//target platform
	var v = {target : r[1],	min : r[2], max : r[4] || r[2]=='*'?'*':r[4]}; 
	var vc = {target : rc[1], min : rc[2], max : rc[4]};

	//targets dont match
	if((v.target || null) != (vc.target || null)) return null;

	var pass = (_vercomp(v.min, vc.min) <= 0 &&  _vercomp(v.max, vc.min) >= 0);
	if(pass) 	return _trim(parts[parts.length -1]);
	return null;
}

function _dependencies(items, ctx){
	if(!items || items.length <= 0) return null;
	var r = {resources:[], imports:[]},
	appCtx = context(config.appBase);

	//iterate over import items and resolve their urls
	//reserved modules are not resolved
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
		}  //no namespace includes
		else {
			url = item;
		}

		//check if import qualifes based on the url modifiers |
		if(!(url = qualifyImport(url))) continue;

		//this means that our url is relative to application context
		//i.e. absolute to application's base url
		if(url[0] == '/') {
			url = appCtx.resolve(url.substr(1));
		}
		else {
			url = ctx.resolve(url);
		}

		r.resources.push(url);
		r.imports.push(new ImportItem(ns,url));
	}
	return r.imports;
}

function ImportSpec(fileName,status){
	this.imports = null;
	this.preloads = null;
	this.fileName = fileName;
	this.status = status;
}
ImportSpec.prototype = { 
	execute : function(){
		this.isProcessed = true;
	}
}


var _loaderStats = {
	pendingImports:0,	loadingIndicator:null,
	oncomplete:[], loaders:[],
	moduleSpec:null
};


function to(array,fn){
	if(!array) return new Array();
	if(typeof fn != 'function') return new Array();
	var result = new Array()
	,	keys = Object.keys(array);
	for(var key in keys ){
		var item = fn(array[keys[key]]);
		//dont insert null or undefined
		if(item == null) continue;
		result.push(item);
	}
	return result;
}

/*
	Asynchronous loader
*/
var loaderOrdinal = 0;
function Loader(){
	this.id = loaderOrdinal++;
	this.pending = 0; this.root = null;
	this.queue = [];
}
Loader.prototype = {
	loadFrame:function(frame){
		var imports = frame;

		//assign root
		if(!this.root) this.root = imports;

		//loop through modules in the frame
		//skip the already loaded ones
		for(var i = 0; i < imports.length; i++){
			var filename = imports[i];

			if(filename instanceof ImportItem){
				filename = filename.url;
			}

			var spec = importsMap[filename];

			//we are trying to load a module that is being
			//loaded by some other loader, go on a queue
			
			if(spec !=null && spec.status =="in-progress"){
				addLoader(spec,this);
				this.pending++;
				continue;
			}

			//resource has already been loaded
			//check for null and undefined 
			if(spec != null) continue; 
			
			
			//update splash screen if available
			if(_loaderStats.loadingIndicator){
				_loaderStats.loadingIndicator.update(0,0,filename);
			}

			//get handler for current file
			var fileType = fileExt(filename);
			if(!fileType) { 
				fileType = '.js';
				filename = filename + '.js'; 
			}
			var handler = _fileHandlers[fileType];

			//skip unknown files
			if(!handler) continue;

			//get import spec from the handler			
			spec = importsMap[filename] = handler.importSpec(filename); 

			this.pending++;

			//load file
			spec.status = 'in-progress';
			spec.loader = this;
			handler.load(this,spec);
		}
		return this.pending;
	},
	onitemloaded:function(item, ctxScope){
		var spec = importsMap[item];
		//clear current module spec, resource loaded next may not be a module
		if(spec instanceof ImportSpec && currentModuleSpec ) {
			spec = importsMap[item] = currentModuleSpec;
			currentModuleSpec = null;
		}
		
		this.pending--;

		//mark import spec as loaded 
		spec.status = 'loaded';


		//process dependencies for module specs
		if(spec instanceof ModuleSpec){

			//validate module structure
			validateModuleFormat(spec);

			//set scope URI
			spec.scope.__sjs_uri__ = item;  

			//process resource spec that was just loaded
			//get current module context
			var ctx = context(ctxScope ? ctxScope.__sjs_uri__ : spec.scope.__sjs_uri__);

			//resolve preloads
			var prereqs = spec.preloads = _dependencies(spec.__sjs_module__.preload,ctx);

			//	resolve required resources relative to
			//	current context
			var	imports = spec.imports = spec.scope.__sjs_module_imports__ = _dependencies(spec.__sjs_module__.imports,ctx);


			//if preloads are present, save current frame and create new frame
			if(prereqs && prereqs.length > 0){
				this.loadFrame(prereqs);	
			} else if(imports && imports.length > 0) {
				this.loadFrame(imports);
			}
		}
		if(this.pending == 0) {
			processFrame(this,this.root);
		}
	}
}

function validateModuleFormat(spec){
	if(!spec.__sjs_module__) throw 'null module in ' + spec.fileName;
	if(!spec.__sjs_module__.definition) throw 'Module must contain "definition" function in: ' + spec.fileName;
}

function processFrame(loader,frame, oncomplete){
	if(!frame || frame.length == 0) {
		return;
	}
	
	var runCount = 0;
	for(var i=0; i<frame.length; i++){
		var url =  frame[i];
		if(url instanceof ImportItem) url = url.url;

		var dfsStack = getDfsStack(loader.id);

		//skip dependency cycles
		isDependencyCycle(url,dfsStack);

		var spec = importsMap[url];

		var toLoad = {
			imports: to(spec.imports,function(i){
				if(importsMap[i.url] && (
					importsMap[i.url].status == 'loaded' || importsMap[i.url].status == 'in-progress' )) 
					return null;
				return i;
			}),
			prereqs: to(spec.preloads,function(i){
				if(importsMap[i.url] && (
					importsMap[i.url].status == 'loaded' || importsMap[i.url].status == 'in-progress')) 
					return null;
				return i;
			})
		};


		var toExec = {
			imports: to(spec.imports,function(i){
				if(importsMap[i.url] && importsMap[i.url].isProcessed) 
					return null;
				return i;
			}),
			prereqs: to(spec.preloads,function(i){
				if(importsMap[i.url] && importsMap[i.url].isProcessed) 
					return null;
				return i;
			})
		};

		//load prereqs if any
		if(toLoad.prereqs.length > 0) {
			loader.loadFrame(toLoad.prereqs);
			continue;
		}

		var pEx = 0, pIm = 0;

		//run preloads
		if(toExec.prereqs.length > 0) {
			//add current url onto stack to detect branching
			dfsStack.push(url);
			pEx = processFrame(loader,toExec.prereqs);
			//pop the top on branch exit
			dfsStack.pop();
			if(pEx < toExec.prereqs.length ) continue;
		}

		//load remaining imports 
		if(toLoad.imports.length > 0) {
			loader.loadFrame(toLoad.imports);
			continue;
		}

		//run imports
		if(toExec.imports.length > 0) {
			//add current url onto stack to detect branching
			dfsStack.push(url);
			pIm = processFrame(loader,toExec.imports);
			//pop the top on branch exit
			dfsStack.pop();
			if(pIm < toExec.imports.length ) continue;
		}

		//nothing to load nothing to run then run the spec
		if(	toExec.imports.length + toExec.prereqs.length - pEx - pIm === 0) {
			if(!spec.isProcessed) spec.execute();
			runCount++;
		}
	}
	return runCount;
}

var dfsStacks = [];
function getDfsStack(loaderId){
	var stack = dfsStacks[loaderId];
	if(!stack) 
		stack = dfsStacks[loaderId] = [];
	return stack;	
}
function isDependencyCycle(spec,stack){
	var isCycle = false;
	for(var i=(stack.length -2); i>=0; i--){
		if(spec === stack[i]) {
			isCycle = true;
			break;
		}
	}
	

	if(!isCycle) return false;
	//print cycle and throw exception
	if(isCycle === true) {
		console.error(spec);
		for(var i=(stack.length-1); i>=0; i--){
			console.error(stack[i]);
		}
		throw 'cyclical module dependency';
	}
	return isCycle;
}

/*
	Module processor
*/
function ModuleSpec(scope,m){
	//module scope reference 
	this.scope = scope;
	this.__sjs_module__ = m;
}

ModuleSpec.prototype.execute = function(){
	this.isProcessed = true;

	//setup module scope
	initScope(this.scope,this);

	///
	if(this.preloads)
		applyImports.call(this.scope,this.preloads);
	
	var args = [];
	if(this.imports) {
		applyImports.call(this.scope,this.imports);
		args = applyImportArguments.call(this.scope,this.imports);
	}

	//run the module definition	
	this.__sjs_module__.definition.apply(this.scope,args);
}
var pseudoCounter = 0;
function initScope(scope, moduleSpec){

	scope.add('imports',new Namespace());
	scope.add('exports',_exports(scope));

	scope.imports.add('$js',mixin(Object.create(null),_core),true);

	scope.imports.$js.document = document;
	scope.imports.$js.window = window;
	scope.imports.$js.namespace = Namespace;
	
	//module scope calls only
	scope.imports.$js.setLoadingIndicator = function(splash){
		_loaderStats.loadingIndicator = splash;
		return splash;
	};
	/**
	 * resources:string[] - module or other resources paths
	 * all preloads are expected to be defined within the module
	 * being loaded
	 * 
	 */
	
	scope.imports.$js.load = function(resources,callback){
				
		//get pseudo module name
		var pseudoName = '__sjs_pseudom__' + pseudoCounter++; 
		var parentScope = scope;
		//compose pseudo module
		mdl({
			name : pseudoName,
			imports : resources,
			definition : function(){

				//get loaded and processed spec
				var spec = importsMap[pseudoName];
				applyImports.call(parentScope,spec.imports);
				
				if(typeof callback === 'function'){
					callback.call(parentScope);
				}
				//do not store pseudo modules into the global map
				delete importsMap[pseudoName]; 
			}
		});

		var loader = new Loader();
		loader.pending = 1;
		loader.root = [pseudoName];
		loader.onitemloaded(pseudoName,parentScope);
	};

	scope.imports.$js.setvar = function(n, v){
		setPathVar(n,v);
	};

	scope.imports.$js.context = context(scope.__sjs_uri__);
	scope.imports.$js.ImportSpec = ImportSpec;
	scope.imports.$js.extension = extension;

	return scope;
}

function importsAndPreloads(a){
	var imports = []
	,	preload = [];

	for(var i=0; i<a.length; i++){
		var item = a[i]; 
		var fileName = null;
		if(typeof item == 'object'){
			fileName = item[Object.keys(item)[0]];
		} 
		if(typeof item == 'string'){
			fileName = item;
		}
		if(!fileName) continue;

		var sp = fileName.split('|');
		if(sp[0] == 'preload') {
			if(typeof item == 'object') {
				item[Object.keys(item)[0]] = sp[1];
				preload.push(item);
			} else {
				preload.push(sp[1]);
			}
		}
		else 
			imports.push(item);	
	}
	return [imports,preload];
}

function decodeMdf(args){
	var m = {};
	if(args.length == 1) {
		//annonymous body only module
		if(typeof(args[0]) === 'function'){
			m.definition = args[0];
			return m;
		} else {
			throw 'Invalid module definition';
		}
	}
	//name, function
	//dependency, function
	if(args.length == 2) {
		//module and no dependencies
		if(typeof(args[0]) === 'string') {
			m.name = args[0];
		} 
		else if( args[0] instanceof Array){
			var d = importsAndPreloads(args[0]);
			m.imports = d[0];
			m.preload = d[1];
		}
		if(typeof(args[1]) === 'function'){
			m.definition = args[1];
		} 
	}
	return m;
}

/*
	Loads a module
	m - module descriptor
	string, array, array, function
*/
function mdl(){
	var m = arguments[0];

	if(typeof(m) === 'string') {
		var m = importsMap[m]; 
		if(!m) throw 'Invalid resource lookup, resource ['+arguments[0]+'] is not loaded'
		return m;
	}

	//not an object definition
	if(typeof(m) !== 'object' || (m instanceof Array))
		m = decodeMdf(arguments);

	/*init module scope*/
	var scope = new Namespace(null);

	// create module spec
	var spec = new ModuleSpec(scope,m);

	//get current script
	var current = currentScript();

	if(current) { 
		spec.fileName = current;
		importsMap[current] = spec; 
	} 
	else if(m.name){
		spec.fileName = m.name;
		importsMap[m.name] = spec;
	}
	else {
		currentModuleSpec = spec;
	}

	if(!m.preloads && !m.imports)	spec.execute();
	
	
}

mdl.list= function list(){
	return mixin({},importsMap);
}

function addTo(s,t,unq){
	var keys = Object.keys(s);
	for(var key in keys) {
		if(t[keys[key]]) { 
			if(unq === true) throw 'key ' + key + ' is already set';
			continue;
		}
		t[keys[key]] = s[keys[key]];
	}
}

var extension = mixin(Object.create(null), {
	loader: function(obj){
		//check if file handler is already set and do not 
		//allow setting it again - by setting true flag on addTo
		addTo(obj,_fileHandlers,true);
	}
});

function start(config){
	//load main modules
	if(config.sjsMain != null && config.sjsMain){
		load([config.sjsMain]);
	}
}

var _core = mixin(Object.create(null),{	
	'module'    : mdl
});

//publish global binding
window.$js = global.$js = _core;
window.define = mdl;

//entry point
loadConfiguration(function(config){
    PATH_VARIABLES['{$jshome}'] = config.sjsHome;

    if(config.mode == 'onload'){
        window.onload = function(){ start(config);}
    }
    else if(config.mode == 'console'){
        start(config);
    }
    else {
        _core.start = function(){start(config);}
    }
});
})( (require('splice.window.js')), (require('splice.document.js')),(function(){
	try {return global;}
	catch(e) {return {};}
})());
