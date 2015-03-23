_.Module = (function(document){	
	//enable strict mode
	"use strict"; 
	
	_.Doc.display = function(control,ondisplay){
		if(!control) return;
		
		document.body.innerHTML = '';
		
		if(control.concrete && control.concrete.dom) {
			document.body.appendChild(control.concrete.dom);
			if(typeof ondisplay === 'function') ondisplay(control);
			return;
		}
		
		if(control.dom) {
			document.body.appendChild(control.dom);
			if(typeof ondisplay === 'function') ondisplay(control);
			return;
		}
	}
	
	
	_.Animate = function(obj){
		if(!obj) return;
		
		return {
			opacity:function(from, to, duration){
			new _.StoryBoard([
			new _.Animation(0 | from, 100 | to, (duration | 300), _.Animation.cubicEaseIn, 
					function(value){
  						obj.style.opacity = value * 0.1 / 10;
  					}
  			)]).animate();
				
			}
		}
	}
	
	
	var Concrete = _.Namespace('SpliceJS.Modular').Class(function Concrete(dom){
		this.dom = dom;
		
		/* tie instances hashmap */
		this.ref = Object.create(null);
		
		/* elements hashmap */
		this.elements = Object.create(null);
		
	});
	
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
	
	
	Template.prototype.getInstance = function(tieInstance,incParam){
		
		 
		var build = this.dom;
		 
		//Clone node retaining _config property
		var deepClone = _.Doc.cloneNodeAndProperties(
				 build,{
					 selectors:['[data-sgi-module],[data-sgi-api]'], 
					 properties:['_config','_template'],
					 isDeep:true
				 });
		deepClone.normalize();
		 
		var instance = new Concrete(deepClone);
		
		
		deepClone._concrete = instance; // DOM get a reference to the concrete instance
		
		/* process dom references */
		var elements = deepClone.querySelectorAll('[data-sp-ref]');
		var element = deepClone;
		
		if(tieInstance)
		for(var i=-1; i< elements.length; i++){
			
			if(i > -1) element = elements[i];
			
			var ref = element.getAttribute('data-sp-ref'); 
			if(ref) tieInstance.elements[ref] = element; 	
		}
		
		
		/* Attach include arguments 
		 * before calling a constructor
		 * */
		
		/* attache name reference */
		if(incParam && incParam.ref){
			tieInstance.parent.ref[incParam.ref] = tieInstance;
		}

		
		/* process include parameters */
		var parameters = incParam?incParam.parameters:null;
		
		if(parameters) {
		var keys = Object.keys(parameters);
		for(var k=0; k< keys.length; k++) {
			
			var key = keys[k];
			
			_.debug.log("Processing include property: " + key);
			
			/* remaining parameters are for the child instance */
			if(parameters[key] instanceof _.Binding) {
				var binding = parameters[key]; 
				resolveBinding(binding, tieInstance, key);
				continue;
			}
			
			/* default property assignment */
			tieInstance[key] = parameters[key];
			
		}
		}

		
		
		
		/* 
		 * Anchor elements with data-splice-tmp-anchor attibute
		 * are placeholders for included templates
		 * Process clone and attach templates 
		 * */
		var anchors = deepClone.querySelectorAll('[data-splice-tmp-anchor]');
		
		for(var i=0; i < anchors.length; i++){
			
			var childId = anchors[i].getAttribute('data-splice-child-id');
			var include = this.children[childId];
			
			var coupler = _.Namespace.lookup(include.name);
			
			/*
			 * Child instance
			 * Include parameters are passed to 
			 * the constructor as arguments
			 * */
			var c_instance = new (coupler.invokeByParent(tieInstance,include))(include.parameters);		
			anchors[i].parentNode.replaceChild((c_instance.dom || c_instance.concrete.dom), anchors[i]);
			
		}
		
		return instance;
	};
	
	/*
	 * Alter include behavior to understand templates
	 * */
	var originalInclude = _.include;
	_.include = function(resources, oncomplete, onitemloaded){
		
		var handler = function(){
			if(typeof onitemloaded === 'function')
			onitemloaded.apply(this,arguments);
			
			var arg = arguments[0];
			if(!arg) return;
			if(arg.ext !== 'htmlt') return;
			
			var t = extractTemplates(arg.data);
			if(!t) return;
			
			var templates = {};
			for(var i=0; i< t.length; i++){
				templates[t[i].spec.name] = t[i];
			}
			
			compileTemplates({templates:templates});
			_.info.log(arg.filename);
		}
		originalInclude.call(_,resources, oncomplete,handler);
	}
	
	
	function resolveBinding(binding, instance, key){
		if( !(binding instanceof _.Binding) ) throw 'May to resolve binding, source property is not a binding object';
		
		var result = null;
		
		switch(binding.type){
		case _.Binding.SELF:
			break;
		
		case _.Binding.PARENT:
			if(!instance.parent) throw 'Cannot resolve parent binding, instance parent is not null';
			result = { instance: instance.parent,
					   prop:instance.parent[binding.prop]};
			break;
			
		case _.Binding.FIRST_PARENT:
			break;
			
		case _.Binding.ROOT:
			break;
		}
		
		/* Assignment direction */
		switch(binding.direction){
		case _.Binding.Direction.TO:
			if(typeof instance[key] === 'function')
				result.instance[binding.prop] = function(){
					instance[key].apply(instance,arguments);
				}
			else
				result.instance[binding.prop] = instance[key];
			break;
			
		case _.Binding.Direction.FROM:
			if(typeof instance[key] === 'function')
				instance[key] = function(){
					result.instance[binding.prop].apply(result.instance,arguments);
				}
			else
				instance[key] = result.instance[binding.prop]; 
			break;
		}	
	}
	
	
	/* 
	 * !!!! try wrapping this into some crazy closure thing !!!!! 
	 * to allow passing include parameters,etc...
	 * */
	function createCoupler(tie, template){
		/*
		 * Coupler function is assigned to the variable of the same name
		 * "Coupler" because otherwise in IE8 instanceof operation on "this"
		 * implicit object does not return true on this instanceof Coupler
		 * IE8 seems to evaluare the operator against the name of the
		 * function that created the object
		 * */
		var Coupler = function Coupler(){
			if(this instanceof Coupler) {
				if(typeof tie === 'function'){
					var obj = Object.create(tie.prototype);
					obj.constructor = tie;
					
					obj.ref = {};
					obj.elements = {};
					
					obj.concrete = template.getInstance(obj);
					
					
					tie.apply(obj, arguments);
					return obj; 
				}
				return template.getInstance();
			}
			throw 'Coupler function must be invoked with [new] keyword';
		};
		
		if(tie) Coupler.base = tie.base;
		
		Coupler.invokeByParent = function(parent,incParam){
			return function Coupler(){
				if(this instanceof Coupler) {
					if(typeof tie === 'function'){
						var obj = Object.create(tie.prototype);
						obj.constructor = tie;
						
						obj.ref = {};
						obj.elements = {};						
						obj.parent = parent;
						obj.concrete = template.getInstance(obj,incParam);
						
						tie.apply(obj, arguments);
						return obj; 
					}
					return template.getInstance();
				}
				throw 'Coupler function must be invoked with [new] keyword';
			};
		};
		
		Coupler.isCoupler = true;
		Coupler.template = template;
		Coupler.tie = tie;
		
		return Coupler;
	}; 
	
	
	/**
	 * Global module map, to keep track of all the loaded modules.
	 * */
	var _modules = new Array(); //module cache	
	
	function ModularApi(){};
	ModularApi.prototype = {
	
			constructor:ModularApi,
	
			/**
			 * Builds module and compiles template(s) from module definition. 
			 * The templates will be compiled recursively, 
			 * where inner templates are compiled first and then outer. 
			 * Any scripts embedded into template will be evaluated and 
			 * their result be injected into DOM, by replacing underlying script tag.
			 * @param moduleDefinition
			 */
			define : function(moduleDefinition, ondefined){
				
				var required 	= moduleDefinition.required;
				var moduleName 	= moduleDefinition.name;
				var definition  = moduleDefinition.definition;
			
				var node = _.currentlyLoading;
								
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
					var t = extractTemplates(template.data);
					
					for(var i=0; i< t.length; i++){
						templateDefinitions[t[i].spec.name] = t[i];
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
					definition();
					var scope = {
						templates:templateDefinitions
					};
					
					/* 
					 * Templates are compiled after module has been defined
					 * 
					 * */
					compileTemplates(scope);
					
					/*
					 * Invoke callback when definition is
					 * complete
					 * */
					if(typeof(ondefined) === 'function') ondefined(m);
					
				},collectTemplates);
			},
			
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
	
	function extractTemplates(fileSource){
		
		var regex = /<!--\s+@template:{.*}\s+-->/igm; 	//script start RE
		var match = null;
		
		var lastMatch = null;
		var templates = new Array();
		while( match = regex.exec( fileSource ) ){
			
			/* multiple templates in the file
			 * next one is found
			 * */
			if(lastMatch != null) {
				var templateSource = fileSource.substring(lastMatch.index + lastMatch.descriptor.length, match.index);
				
				var desc = lastMatch.descriptor;
				desc = desc.substring(	desc.indexOf('@template:')+'@template:'.length,	desc.length - 3);
				
				/* 
				 * source execution through Function constructor 
				 * avoid strict mode variable declarion restrictions
				 * */
				var attributes = (new Function('return  '+desc+' ;'))();
				//var result = null;
				//eval('result = ' + desc);
				
				templates.push({
					src:templateSource,
					spec:attributes 
					/* 
					 * attributes are parameters specified in the @template declaration
					 * in the form or JSON literal, it is evaluated as is
					 * hence must be of correct syntax
					 *  */
				});
			}
			
			lastMatch = {descriptor:match[0],index:match.index };
		}
		
		/* last of the only template*/
		if(lastMatch != null) {
			var templateSource = fileSource.substring(lastMatch.index + lastMatch.descriptor.length, fileSource.length);
			
			var desc = lastMatch.descriptor;
			desc = desc.substring(	desc.indexOf('@template:')+'@template:'.length,	desc.length - 3);
						
			var result = (new Function('return  '+desc+' ;'))();
			/*
			var result = null;
			eval('result='+desc);
			*/
			templates.push({
				src:templateSource,
				spec:result
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
	

	
	function AnnotationRunner(template){
		
		var notations = _.Doc.selectComments(template.dom);
		
		var include  = /@include:\s*(\{[\s\S]+\})/im;
				
		_.debug.log('Template annotations found: ' + (notations ? notations.length : 0));
		if(!notations) return function(){};
		return function(module){
			
			for(var i=0; i < notations.length; i++ ){
				var notation = notations[i];
				var parent = notation.parentNode;
				var desc = notation.nodeValue;
				
				/* Include declaration */
				var match = include.exec(desc);
				desc = match?match[1]:'';
				
				var result = null; 
				eval('result = ' + desc);
				
				if(result){
					var childTemplate = includeTemplate.call(module,result);
					if(!childTemplate) {_.debug.log('Could not include template '); return;}
					
					var childName = childTemplate.declaration.name;
					var childId = template.addChild(result);
					
					var a = document.createElement('a');
					a.setAttribute('data-splice-tmp-anchor',childName);
					a.setAttribute('data-splice-child-id',childId);
					
					parent.replaceChild(a,notation);
					
				}
			}
		}
	}


	function includeTemplate(args){
		if(!args) throw 'Unspecified include arguments';
		if(!args.name) throw 'Invalid include argument, unspecified template name:' + args; 
			
		var module = this; //reffers to current module
		
		/* lookup template by name*/
		var template = _.Namespace.lookup(args.name);
		if(!template || (
		   !(template instanceof Template) && !template.isCoupler)) { //template is not compiled compile template
		
			var declaration = module.templates[args.name];
			template = compileTemplate.call(module,declaration);
		}
		if(template.isCoupler) template = template.template;
 		
		return template;
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
	function compileTemplate(declaration,moduleName){
		
		if(declaration.build) return declaration.build;
		
		
		if(!moduleName) moduleName = this.name;
		
		var module = this;
		
		var html = declaration.src;
		var wrapper = document.createElement('span');
		wrapper.innerHTML = html;
		
		var template = new Template(wrapper);
		
		
		
		/*
		 * Run notations and scripts to form a 
		 * final template DOM
		 * */
		_.debug.log('Processing template notations for module: ' + moduleName);		
		AnnotationRunner(template)(module);
		
		_.debug.log('Processing template scripts for module: ' + moduleName);
		new ScriptDomRunner(wrapper).run({module:moduleName});

		
		template.normalize();
		
		/*
		 * setting module reference
		 * */
		template.dom.setAttribute('data-sgi-module',moduleName);
		

		/* copy template declaration attributes */		
		template.declaration = declaration.spec;
		
		declaration.build = template;
		
		/* Attempt Template-to-Code coupling */
		if(template.declaration){
			var name = template.declaration.name;
			var tie  = template.declaration.tie; 
			
			var splitname = _.splitQualifiedName(name);
			if(!splitname.namespace || splitname.namespace === '') return template;
			
			var nameLookup 	= _.Namespace.lookup(name);
			
			/* 
			 * found object by the same name 
			 * */
			if(nameLookup instanceof Template) throw 'Template declaration name: '+ name + ' already exists!';
			if(nameLookup && typeof nameLookup !== 'function') throw 'Template declaration name: '+ name + ' is ocupied by another object!'; 
			
			if(nameLookup && !tie) tie = name;
			/* 
			 * If no tie code, add template object to a namespace
			 * and return
			 * */
			
			var tieLookup 	= (!tie)?null:_.Namespace.lookup(tie);	
			
			var coupler = createCoupler(tieLookup, template);
			var ns = _.Namespace(splitname.namespace);
			ns.add(splitname.name,coupler);
		}
		
		
		return template;
	}
		

	
	/*
	 * Compiles template within a given loading scope
	 * 
	 * */
	function compileTemplates(module){
		var templateSource = module.templates;
		var keys = Object.keys(templateSource);
		
		for(var i=0; i< keys.length; i++) {
			var key = keys[i];
			if(!templateSource[key]) continue;
			compileTemplate.call(module,templateSource[key],module.name);
		}
	}
	
	
	
	/* 
	 * !!! Bidirectional bindings are not allowed 
	 * */
	var Binding = function Binding(propName,type,dir){
		if(!(this instanceof Binding)) return new Binding(propName, type, dir);
		
		this.prop = propName;
		this.type = type;
		this.direction = dir;
		
	};
	
	
	Binding.From = function(propName){
		return {
			Self:   		new Binding(propName,	Binding.SELF,   Binding.Direction.FROM),
			Parent: 		new Binding(propName,	Binding.PARENT, Binding.Direction.FROM),
			FirstParent: 	new Binding(propName,	Binding.FIRST_PARENT, Binding.Direction.FROM),
			Root:			new Binding(propName,	Binding.ROOT, Binding.Direction.FROM)
		}
	};
	
	Binding.To = function(propName){
		return {
			Self:   		new Binding(propName, 	Binding.SELF,   Binding.Direction.TO),
			Parent: 		new Binding(propName, 	Binding.PARENT, Binding.Direction.TO),
			FirstParent: 	new Binding(propName, 	Binding.FIRST_PARENT, Binding.Direction.TO),
			Root:			new Binding(propName, 	Binding.ROOT, 	Binding.Direction.TO)
		}
	};
	
	
	/*
	 *	Binding type constants 
	 * */
	
	Binding.Direction = {
			FROM : 1,
	/* Left assignment */
			TO: 2
	};
	/* Right assignment */
	
	Binding.SELF 			= 1;
	/* Look for properties within immediate instance */
	
	Binding.PARENT 		= 2;
	/* Look for properties within direct parent of the immediate instance*/
	
	Binding.FIRST_PARENT 	= 3;
	/* Look for properties within a first parent  where property if found */
	
	Binding.ROOT 			= 4;
	/* Look for properties within a root of the parent chain */
	
	/* assigna global reference */
	_.Binding = Binding;
	
	_.Dom = function Dom(domText){
		this.domText = domText;
	};
	
	return (new ModularApi()).define;
})(document);