
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
_.Module = (function(document){	

	//enable strict mode
	"use strict"; 
	
	
	var Scope = function Scope(path){
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
		
	}
	
	/* Proxy Object */
	_.Obj = Obj;

	
	var Concrete = _.Namespace('SpliceJS.Modular').Class(function Concrete(dom){
		
		this.dom = dom;


		if(!this.concrete) return;
		
		var self = this;
		this.concrete.dom.onclick = function(){
			self.onClick(self);
		}
	});
	
	Concrete.prototype.onClick = _.Event;


	Concrete.prototype.export = function(){
		return this.dom;
	};

	Concrete.prototype.applyContent = function(content){
		
		var deepClone = this.dom;
		var tieInstance = this.tieInstance;

		var contentNodes = _.Doc.selectTextNodes(deepClone, function(node){
			if(node.nodeValue.indexOf('@') === 0) //starts with 
				return node;
			return null;
		});	
		

		if(contentNodes) {
			for(var i=0; i < contentNodes.length; i++){
				var value = contentNodes[i].nodeValue; 
				value = value.substring(1,value.length);

				var obj = content[value];
				var newNode = null;

				if(typeof obj === 'function') {
					var contentInstance = new obj({parent:tieInstance});
					if(contentInstance.concrete) 
						newNode = contentInstance.concrete.dom; 
					
				}

				if(typeof obj === 'string'){
					newNode = document.createTextNode(obj);		
				}

				if(typeof obj === 'number'){
					newNode = document.createTextNode(obj);			
				}

				if(newNode) contentNodes[i].parentNode.replaceChild(
						newNode, 
						contentNodes[i]
				);	
			}
		}
	};

	
	var Template = _.Namespace('SpliceJS.Modular').Class(function Template(dom){
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
	
	Template.prototype.clone = function(){
		var deepClone = _.Doc.cloneNodeAndProperties(
				 this.dom,{
					 selectors:['[data-sgi-module],[data-sgi-api]'], 
					 properties:['_config'],
					 isDeep:true
				 });
		return new Template(deepClone);
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
			firstElement = this.dom.removeChild(firstElement);
			this.dom = firstElement;
			this.dom.normalize();
		}
	}
	
	
	function buildComponents(dom,tieInstance,scope){

		/* 	process nested elements 
			element tag name are not not case sensetive
		*/
		var nested = _.Doc.selectUnknownElements(dom);

		for(var i=0; nested!=null && i < nested.length; i++){

			var node = nested[i];
			var parent = node.parentNode;

			var idx = node.tagName;
			
			var obj = _.Namespace.lookupIndex(idx);
			if(!obj) continue;

			var parameters = {type:idx};
			for(var j=0; j < node.attributes.length; j++){
				var attr = node.attributes[j];
				parameters[attr.name] = attr.value;
			}


			/* process content */
			var proxy = _.Obj.call(scope,parameters);


			var c_instance = new proxy({parent:tieInstance});

			parent.replaceChild((c_instance.concrete.dom || c_instance.dom), node);

			_.debug.log(node.tagName);
		}
	}


	/**
	 * @tieInstance - instance of a tie class that is associated with the template
	 * */
	Template.prototype.getInstance = function(tieInstance, parameters, scope){
		
		 
		var build = this.dom;
		 
		//Clone node retaining _config property
		var deepClone = _.Doc.cloneNodeAndProperties(
				 build,{
					 selectors:['[data-sjs-module],[data-sjs-api]'], 
					 properties:['_config','_template'],
					 isDeep:true
				 });
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
		instance.applyContent(parameters.content);


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
			
			
			var c_instance = new proxy({parent:tieInstance});
			
			var exportDom = c_instance.concrete.export();
			
			/*multiple child nodes*/
			if(exportDom instanceof Array) {
				var parentNode = anchors[i].parentNode;
				var child = exportDom[0]; 
				
				parentNode.replaceChild(child, anchors[i]);

				for( var i = 1; i < exportDom.length; i++){
					var sibling = child.nextSibling;
					var child = exportDom[i];
					parentNode.insertBefore(child,sibling);
				}	
			}
			else {	
				anchors[i].parentNode.replaceChild((c_instance.concrete.dom || c_instance.dom), anchors[i]);
			}
		}
		
		return instance;
	};
	

	
	
	
	
	/*
	 * Alter include behavior to understand templates
	 * */
	var originalInclude = _.include;
	_.include = function(resources, oncomplete, onitemloaded){
		
		var handler = function(){

			var path = _.getPath(_.currentlyLoading.name).path;
			var scope = new Scope(path);

			if(typeof onitemloaded === 'function')
			onitemloaded.apply(this,arguments);
			
			var arg = arguments[0];
			if(!arg) return;
			if(arg.ext !== 'htmlt') return;
			
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
	}
	
	
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
				throw 'Origin property '+ key +' is not a functions. Events may only bind to functions';

			dest.instance[dest.path].subscribe(source.value(), source.instance);

			return;
		}

		if(typeof source.value() === 'function')
			dest.instance[dest.path] = 	function(){
					return source.instance[source.path].apply(source.instance,arguments);
				}
				
		else
			dest.instance[dest.path] = source.instance[source.path];
		

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
					_.debug.log('Found event object');
					obj[key] = _.Event.create();
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
	 * Global module map, to keep track of all the loaded modules.
	 * */
	var _modules = new Array(); //module cache	
	

	/**
	 * Builds module and compiles template(s) from module definition. 
	 * The templates will be compiled recursively, 
	 * where inner templates are compiled first and then outer. 
	 * Any scripts embedded into template will be evaluated and 
	 * their result be injected into DOM, by replacing underlying script tag.
	 * @param moduleDefinition
	 */
	function define(moduleDefinition){
		
		var path = _.getPath(_.currentlyLoading.name).path;

		var required 	= _.home(moduleDefinition.required,path);
		var moduleName 	= moduleDefinition.name;
		var definition  = moduleDefinition.definition;
	
		/* required collection is always an Array */
		required = required instanceof Array ? required : null;

		var scope = new Scope(path);

		scope.createComponent = function(tie,template){return createComponent(tie,template,this);};
			
		_.debug.log(path);

		var templateDefinitions = new Array();
		
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
			var t = extractTemplates.call(scope,template.data);
			
			for(var i=0; i< t.length; i++){
				templateDefinitions[t[i].spec.type] = t[i];
			}
		};
						
		/*
		 * Module has no required includes
		 * */
		if(!required || required.length < 1) {
			definition(); 
			return;
		}
		
		/* 
		 * Load dependencies
		 * */
		 originalInclude.call(_,required, function(){	
			
			/*
			 * Define a module
			 * and create template scope 
			 * for template compilation
			 * */
			
			
			definition.call(scope,scope);
			scope.templates = templateDefinitions;
			

			/* 
			 * Templates are compiled after module has been defined
			 * 
			 * */
			compileTemplates(scope);
			
		},collectTemplates);
	};




	function ModularApi(){};
	ModularApi.prototype = {
	
			constructor:ModularApi,
	
			
			isLoaded : function(moduleName){
				if(_modules[moduleName]) return true;
				else return false;
			},
			
			get : function(moduleName){
				var module = _modules[moduleName];
				if(module) return module;
				throw 'Module ' + moduleName + ' is not defined';
			},
				
			list : function(){
				var keys = new Array();
				for (var key in _modules) {	
					// don't list prototype properties
					if(_modules[key] && _modules.hasOwnProperty(key)) keys.push(key); 
				}
				return keys;
			}
	};
	
		
	function separateDescriptor(descriptor){
		return descriptor.substring(
				descriptor.indexOf('@template:')+'@template:'.length,
				descriptor.length - 3);
	};
	
	function applyPath(src){
		var path = this.path;
		var regex = /<img\s+src="(\S+)"\s*/igm;
	
		var match = null;
		var asrc = '';
		
		var lastMatch = 0;

		while(  match = regex.exec( src ) ){
			var apath = _.absPath(_.home(match[1],path));
			
			var left = src.substring(lastMatch, match.index);
						

			asrc = asrc + left + '<img src="' + apath + '" ';
			lastMatch += match.index + match[0].length;

			_.debug.log(apath);
		}

		asrc = asrc + src.substring(lastMatch, src.length);
		return asrc;
	}



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
	
	
	
	
	function ScriptExtractorRunner(sourceText){
		this.source = sourceText;
		this.template = new Array();
		
		
		//pull all the scripts from source
		var start = /<script>/igm; 	//script start RE
		var end = /<\/script>/igm; 	//script end RE
		
		var startIndex = -1 *'</script>'.length ;
		var closingIndex = startIndex;
		
		var match = null;
				
		var subsource = this.source;
		
		while( match = start.exec( subsource ) ){
			
			
			this.template.push( this.source.substring(closingIndex + '</script>'.length, match.index) );
			 
			
			startIndex = match.index;
			
			/* script within script tag or <script> tag in the output string */
			if(startIndex < closingIndex) continue;
						
			match = end.exec( subsource );
			closingIndex = match.index;
			
			this.template.push({
				src:subsource.substring(startIndex + '<script>'.length, closingIndex)
			});
		}
		
		this.template.push( this.source.substring(closingIndex + '</script>'.length) );
		
		start = null;
		end = null;
		this.source = null;
	}
	
	/** 
	 * Runs scripts found in the source text
	 * Script are run sequentially
	 */
	ScriptExtractorRunner.prototype.run = function(onresult){
		
		
		var finalResult = '';
		for(var i=0; i < this.template.length; i++){
			if(this.template[i].src){
				eval('var result = ' + this.template[i].src + ';');
				if(typeof(onresult) === 'function' ) onresult(result);
				finalResult += result; 
			}
			else finalResult += this.template[i];
		}

		return finalResult;
	};
	

	function ScriptDomRunner(dom){
		this.scripts = dom.querySelectorAll('script');
		
	};
	
	ScriptDomRunner.prototype.run = function(){
		if(!this.scripts || this.scripts.length < 1) return;
		_.debug.log('Running dom scripts');
		for(var i=0; i < this.scripts.length; i++){
			var src = this.scripts[i].innerText ? this.scripts[i].innerText:this.scripts[i].innerHTML;
			/* not supported in IE8, at least in the way its written below
			 * todo find out why...
			var foo = new Function('return ' + src + '');
			 var result = foo();
			 */

			if (this.scripts[i].type.indexOf('javascript') > 0){
				var result = null;
				eval('result = ' + src + ';');

				if(!result) continue;

				var script = this.scripts[i];
				var parent = script.parentNode;

				switch(typeof result){
					case 'number':
					case 'string':
						result = document.createTextNode(result);
						break;
				}

				parent.replaceChild(result,script);
				_.debug.log(result);
			}else{
				_.debug.log('Custom content script tag. Skip.')
			}

		}
	};
	
	function applyScope(source){
		var objscop = /_.Obj(\([\s\S]+\))/im; //!!! inefficient will match from the begining
		var match = null;
		
		while(match = objscop.exec(source)){
			_.debug.log('Found match ');
			
			source = source.substring(0,match.index + 5) + '.call(scope,' +
					 source.substring(match.index + 6,source.length);
			match.index = 0; // !!!inefficient, matching from the begining on every cycle
		}
	
		return source;
	
	};
	

	function convertToProxyJson(dom, tagName){
		
		var scope = this;


		var tags = _.Doc.selectNodes({childNodes:dom.childNodes},
				function(node){
					if(node.nodeType == 1 && node.tagName != 'SJS-INCLUDE') return node;
				},
				function(node){
					if(node.nodeType == 1 && node.tagName != 'SJS-INCLUDE') return [];
					return node.childNodes;
				});

		//process tags as new implicit templates
		if(tags != null){
			for(var i=0; i<tags.length; i++){
				var tag = tags[i];

				/* generate template name */
				var inlineTemplateName = scope.getNextTemplateName();


				var placeholder = document.createElement('sjs-include');
				placeholder.appendChild(document.createTextNode('{type:\'' + inlineTemplateName +'\'}'));
				tag.parentNode.replaceChild(placeholder, tag);

				/* 
					build new template and store within scope 
					run template compiler
				*/
				var wrapper = document.createElement('span');
				wrapper.appendChild(tag);

				var template = new Template(wrapper);
				/* copy template declaration attributes */		
				template.declaration = {type:inlineTemplateName};

				compileTemplate.call(scope,template);
			}
		}

		//process include elements
		var elements = 	_.Doc.selectNodes({childNodes:dom.childNodes},
				function(node){
					if(node.tagName == 'SJS-INCLUDE') return node;
				},
				function(node){
					if(node.tagName == 'SJS-INCLUDE') return [];
					return node.childNodes;	
				}
			);

		if(!elements) return dom.innerHTML;
		
		for(var i=0; i<elements.length; i++){
			var element = elements[i];
			if(element.tagName === 'SJS-INCLUDE'){
				//create new template and repeat parsing
				var text = '_.Obj.call(scope,'+convertToProxyJson(element)+')';
				element.parentNode.replaceChild(document.createTextNode(text),element);
			}
		}

		var json = dom.innerHTML;

		//append implied type for sjs-element
		if(tagName == 'SJS-ELEMENT'){
			var ind = json.indexOf('{');
			json = '{ type:\'SpliceJS.Controls.UIElement\',' + json.substring(ind+1);
		}

		return json;
	};

	function ResolveCustomElements(template){

		var scope = this;

		/* select top level includes */
		var inclusions = [];

		var nodes = _.Doc.selectNodes({childNodes:template.dom.childNodes},
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

	}



	function AnnotationRunner(template){
		
		var scope = this;
		
		var notations = _.Doc.selectComments(template.dom);
		
		var include  = /@include:\s*(\{[\s\S]+\})/im;
		
				
		_.debug.log('Template annotations found: ' + (notations ? notations.length : 0));
		if(!notations) return;
			
		for(var i=0; i < notations.length; i++ ){
			var notation = notations[i];
			var parent = notation.parentNode;
			var desc = notation.nodeValue;
			
			/* 
			 * Include declaration 
			 * */
			var match = include.exec(desc);
			desc = match?match[1]:'';
			
			/*
			 * some sorcery here 
			 * to allow local scope access to object proxies
			 * */
			desc = applyScope(desc);
			
			var result = null; 
			eval('result = ' + desc);
			
			if(!result) throw 'Invalid include declaration';
				
			if(typeof result !==  'function'){				
				result = _.Obj.call(scope,result);
			}
								
			var childId = template.addChild(result);
				
			var a = document.createElement('a');
			a.setAttribute('data-sjs-tmp-anchor',result.type);
			a.setAttribute('data-sjs-child-id',	childId);
				
			parent.replaceChild(a,notation);
			
		}
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


			var html = declaration.src;
			var wrapper = document.createElement('span');
			wrapper.innerHTML = html;

			var template = new Template(wrapper);

			/* copy template declaration attributes */		
			template.declaration = declaration.spec;

			compileTemplate.call(scope,template);
		}
	}
	

	
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
		ResolveCustomElements.call(scope,template);

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
					  scope[template_name] ? scope[template_name] : Concrete;
			
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
		
		var tie 	= tie_name ? (_.Namespace.lookup(tie_name) || scope[tie_name]) : Concrete;	
		
		if(tie && tie.isComponent) tie = tie.tie;
		
		var component = createComponent(tie, template, scope);
		var ns = _.Namespace(split_name.namespace);
		ns.add(split_name.name,component);
		
		return scope.templates[template.declaration.type] = component;
	}
		

	
	
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



	
	var Multicaster = function Multicaster(){
		
		var _caster = function _caster() {
			
			var hC = {handlers:[], instances:[]};
		
			this.Multicaster = function Multicaster(){
				for(var i=0; i<hC.handlers.length; i++){
					if(typeof hC.handlers[i] !== 'function') continue;
					hC.handlers[i].apply(hC.instances[i],arguments);
				}
			};
		
			this.Multicaster.addHandler = function(instance, handler){
				hC.handlers.push(handler);
				hC.instances.push(instance);
			};
		}
		
		
		return (new _caster()).Multicaster;
		
	}
	_.Multicaster = Multicaster;
	
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
	
	/* assigna global reference */
	_.Binding = Binding;
	
	_.Dom = function Dom(domText){
		this.domText = domText;
	};
	
	return define;
})(document);