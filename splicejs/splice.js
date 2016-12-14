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
	window.require = function require(m){
		if(m == 'splice.window.js') return window;
		if(m == 'splice.document.js') return document;
	}
}

(function(window, document, global,require){
"use strict";

if(!Object.keys) throw "Unsupported runtime";

window.require = function(module){
	var name = module + '.js';
	var keys = Object.keys(importsMap);
	for(var i=0; i<keys.length;i++){ 
		if(!keys[i].endsWith(name)) continue; 
		return importsMap[keys[i]].exports || importsMap[keys[i]];
	}
	return null;
}

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
importsMap = {}, currentFrame = null, specLoaders = [], PATH_VARIABLES = {},
loaderOrdinal = 0;

//reserved modules
importsMap['require.js'] = new ImportSpec('require.js','loaded');
importsMap['exports.js'] = new ImportSpec('exports.js','loaded');
importsMap['loader.js']  = new ImportSpec('loader.js','loaded');

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

function slice(s,regEx,skip){
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

function to(array,fn,deep){
	if(!array || (typeof fn != 'function') ) return deep;
	if(typeof array != 'object') return deep;	
	var	keys = Object.keys(array);
	for(var key in keys ){
		var item = null;
		if(typeof array[keys[key]] == 'object' )
			item = array[keys[key]];
		else 
			item = fn(array[keys[key]],keys[key],key,deep);
		
		if(deep instanceof Array) {
			if(deep[keys[key]] != undefined ) deep[keys[key]] = item; 
			else if(item) deep.push(item);
		} else {
			deep[keys[key]] = item;
		}
		if(typeof array[keys[key]] == 'object' )
			to(array[keys[key]],fn,deep[keys[key]]);
	}
	return deep;
}

function spv(url){
	var parts = slice(url,/{[^}{]+}/);
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
			if(url == 'loader.js') return url;

			url = url.replace(new RegExp(_not_pd_,"g"),_pd_);
			//resolve path variables
			url = spv(url);
			//not page context
			if(isAbsUrl(url)) return collapseUrl(url) ;
			//is application context
			if(url[0]=="/")
				return collapseUrl(config.appBase + url);
			//relative context
			return collapseUrl(ctx + url);
		}
	}
}

var fileExtRegex = /[0-9a-zA-Z-]+([.][0-9a-zA-Z]+)$/i;
function fileExt(f){
	var result = fileExtRegex.exec(f);
	return result!=null ? result[1] : null;
}


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
			loader.add(spec);

			//document script loader
			var filename = spec.fileName;
			var head = document.head || document.getElementsByTagName('head')[0];
			var script = document.createElement('script');
			script.setAttribute("type", "text/javascript");
			script.setAttribute("async","");
			script.setAttribute("src", filename);

			if(script.onload !== undefined){
				script.onload = function(e){
					loader.notify(spec);
					//spec.onloaded();
					//loader.onitemloaded(filename);
				};	
			} else if(script.onreadystatechange !== undefined){
				script.onreadystatechange = function(){
					if(script.readyState == 'loaded' || script.readyState == 'complete') {
						loader.notify(spec);
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
	},[]));
}

/*
	loader function
*/

function requireTemplate(imports){
	var scope = this;
	return (function(resolve,reject){
		scope.imports.$js.load(imports,function(){
		resolve(this);
		});
	}).bind(scope);
};


function applyImports(imports, exports){
	if(!imports) return;
	return to(imports,function(url,pk){
		if(url == 'exports.js') return exports;
		return importsMap[url]!=null ? importsMap[url].exports : {};
	},[]);
}

function dependencies(imports, ctx){
	if(!imports || imports.length <= 0) return {req:[],prereq:[]};
	var req = [], prereq=[];
	//iterate over import items and resolve their urls
	//reserved modules are not resolved
	to(imports,function(item,pk){
		var sp = item.split('|'),res = '';
		if(sp[0] == 'preload')
			return prereq[prereq.push(res = ctx.resolve(sp[1]))-1];
		else
			return req[req.push(res = ctx.resolve(item))-1];
	},imports);
	return {req:req,prereq:prereq};
}


function ImportSpec(fileName,status){
	this.fileName = fileName;
	this.status = status;
}
ImportSpec.prototype.execute = function(){ 
	this.isProcessed = true;
};


var _loaderStats = {
	pendingImports:0,	loadingIndicator:null,
	oncomplete:[], loaders:[],
	moduleSpec:null
};

//Asynchronous loader
function Loader(){
	this.id = loaderOrdinal++;
	this.pending = 0; this.root = null;
	this.queue = [];
}
Loader.prototype = {
	add:function(spec){
		//add to loaders
		addLoader(spec,this);	
	},
	notify:function(spec){
		notifyLoaders(spec);
	},	
	loadFrame:function(frame){
		var imports = frame;

		//assign root
		if(!this.root) this.root = imports;

		//loop through modules in the frame
		//skip the already loaded ones
		for(var i = 0; i < imports.length; i++){

			var filename = imports[i];
			var spec = importsMap[filename];

			//we are trying to load a module that is being
			//loaded by some other loader, go on a queue
			
			if(spec !=null && spec.status =="pending"){
				this.add(spec);
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
			
			var handler = _fileHandlers[fileType];

			//skip unknown files
			if(!handler) continue;

			//get import spec from the handler			
			spec = importsMap[filename] = handler.importSpec(filename); 

			this.pending++;

			//load file
			spec.status = 'pending';
			spec.loader = this;
			handler.load(this,spec);
		}
		return this.pending;
	},
	onitemloaded:function(item){
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

			//process resource spec that was just loaded
			//get current module context
			var ctx = context(item);

			var dep = dependencies(spec.__mdf__.imports,ctx);

			//resolve preloads
			spec.prereq = dep.prereq; 

			//	resolve required resources relative to
			spec.req = dep.req;


			//if preloads are present, save current frame and create new frame
			if(spec.prereq && spec.prereq.length > 0){
				this.loadFrame(spec.prereq);	
			} else if(spec.req && spec.req.length > 0) {
				this.loadFrame(spec.req);
			}
		}
		if(this.pending == 0) {
			processFrame(this,this.root);
		}
	}
}


function processFrame(loader,frame, oncomplete){
	if(!frame || frame.length == 0) {
		return;
	}
	
	var runCount = 0;
	for(var i=0; i<frame.length; i++){
		var url =  frame[i];

		var dfsStack = getDfsStack(loader.id);

		//skip dependency cycles
		isDependencyCycle(url,dfsStack);

		var spec = importsMap[url];

		var toLoad = {
			imports: to(spec.req,function(i){
				if(importsMap[i] && (
					importsMap[i].status == 'loaded' || importsMap[i].status == 'pending' )) 
					return null;
				return i;
			},[]),
			prereqs: to(spec.prereq,function(i){
				if(importsMap[i] && (
					importsMap[i].status == 'loaded' || importsMap[i].status == 'pending')) 
					return null;
				return i;
			},[])
		};


		var toExec = {
			imports: to(spec.req,function(i){
				if(importsMap[i] && importsMap[i].isProcessed) 
					return null;
				return i;
			},[]),
			prereqs: to(spec.prereq,function(i){
				if(importsMap[i] && importsMap[i].isProcessed) 
					return null;
				return i;
			},[])
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

function ModuleSpec(m){
	//module scope reference 
	this.__mdf__ = m;
}

ModuleSpec.prototype.execute = function(){
	this.isProcessed = true;
	this.exports = {};
	var	args = applyImports(this.__mdf__.imports,this.exports);
	//run the module definition	
	this.exports = mixin(this.exports, this.__mdf__.definition.apply({},args));
}

var pseudoCounter = 0;

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
			m.imports = args[0];
		}
		if(typeof(args[1]) === 'function'){
			m.definition = args[1];
		} 
	}
	return m;
}


//Moduler Definition Function
function mdf(){
	var	m = decodeMdf(arguments);

	// create module spec
	var spec = new ModuleSpec(m);

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

//set loader API
importsMap['loader.js'].exports = {
	add: function(ext,handler){
		if(_fileHandlers[ext]) throw 'handler ' + key + ' is already set';
		_fileHandlers[ext] = handler; 
	}, 
	list:function(){
		return mixin({},importsMap);
	},
	setvar:function(key, value){
		//path variable may be initialized
		if(PATH_VARIABLES[key]) throw 'Path variable may only be set once';
		PATH_VARIABLES[key] = value;
	},
	listvar:function(){
		return mixin({},PATH_VARIABLES);
	},
	addlistener:function(listener){

	},
	ImportSpec:ImportSpec
}

function start(config){
	if(config.sjsMain != null && config.sjsMain){
		load([config.sjsMain]);
	}
}

var main = null
, 	head = document.head || document.getElementsByTagName('head')[0];
// cycle through all script elements in document's head
for(var i=0; i < head.childNodes.length; i++){
	var node = head.childNodes[i];
	if(!node.getAttribute) continue;
	if(node.getAttribute('sjs-main') != null) {
		main = node; break;
	}
}

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


//set framework home
PATH_VARIABLES['{splice.home}'] = config.sjsHome;

//publish global binding
window.define = mdf;

if(config.mode == 'onload')
	window.onload = function(){ start(config);}
else if(config.mode == 'console')
	start(config);
else
	importsMap['loader.js'].exports.start = function(){start(config);}
})( 
	require('splice.window.js'), 
	require('splice.document.js'),
	(function(){
		try {return global;}
		catch(e) {return {};}
	})(),
	require
);
