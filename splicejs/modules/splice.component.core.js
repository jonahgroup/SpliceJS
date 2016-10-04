$js.module({
prerequisite:[
  '/{$jshome}/modules/splice.component.module.extensions.js'
],
imports:[
	{ Utils 	  : '/{$jshome}/modules/splice.util.js'},
  	{ Inheritance : '/{$jshome}/modules/splice.inheritance.js'},
  	{ Networking  : '/{$jshome}/modules/splice.network.js'},
  	{ Document    : '/{$jshome}/modules/splice.document.js'},
  	{ Syntax      : '/{$jshome}/modules/splice.syntax.js'},
  	{ Events      : '/{$jshome}/modules/splice.event.js'},
  	{ Views       : '/{$jshome}/modules/splice.view.js'},
  	{ Data        : '/{$jshome}/modules/splice.dataitem.js'}
],

definition:function(){
"use strict";

var scope = this;

var imports = scope.imports
, 	sjs = scope.imports.$js
;

var http = imports.Networking.http
, 	doc = imports.Document
, 	Tokenizer = imports.Syntax.Tokenizer
, 	View = imports.Views.View
, 	DataItem = imports.Data.DataItem
,	log	= imports.Utils.log
,	debug = imports.Utils.log.debug
;

var RESERVED_ATTRIBUTES = ["type", "name", "singleton", "class", "width", "height", "layout", "controller"];

if(!Function.prototype.bind) {
	if(!Function.prototype.apply) return;
	Function.prototype.bind = function(t){
		var foo = this;
		return function(){ foo.apply(t,arguments); };
	};
}


//Array.prototype.indexOf in IE9>
function indexOf(a,k){
	if(a.indexOf) return a.indexOf(k);
	for(var i=0; i<a.length; i++){
		if(a[i] == k) return i;
	}
	return -1;
}

function defineComponents(scope){
	if(!scope) throw 'scope parameter is expected';
	//get all html imports in current scope
	var resources = scope.__sjs_module_imports__;
	for(var i in resources){
		var ext = imports.Utils.File.ext(resources[i].url); 
		if( ext !== '.html') continue;

		var key = resources[i].url;
		var m = $js.module(key);

		extractComponents.call(scope,m.dom);
		compileTemplates(scope);
	}
	return scope.__sjs_components__;
};

  /*
  ----------------------------------------------------------
  	Templating Engine
  */

	/**
 	 * Object descriptor
	 * @type: data type of the object to be created
	 * @parameters:	parameters to be passed to the object behind proxy
	 * Proxy comes with scope attached in its closure 
	 * */
	var proxy = function proxy(args){
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

      //look in root scope
			var obj = scope.lookup(args.type);
      //look in the inmports
      if(!obj) obj = scope.imports.lookup(args.type);
      // looks in the components
			if(!obj) obj = scope.__sjs_components__.lookup(args.type);

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

			if(!obj.isComponent && false)
				return instantiate(obj, parameters);
			else
				return new obj(parameters);
		}

		Proxy.type 			= args.type;
		Proxy.parameters 	= args;
		Proxy.__sjs_name__ 		= args.__sjs_name__;
		Proxy.__sjs_isproxy__ = true;
		Proxy.toString = function(){
			return 'proxy: ' + args.type;
		}
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


	/** 
	 * DOM element selectors
	 * 
	 */
	function selectNodes(dom, sel, test){
		//works on all modern browsers
		var nodes = null;//dom.querySelectorAll('sjs-component');
		//nothing was returned by querySelectAll
		//1. no components
		//2. old browser <IE9
		if(!nodes || nodes.length == 0) nodes = new Array();
		else return nodes;

		if(typeof test !== 'function') return nodes;

		doc.dfs(dom,nodes,test);
		return nodes;
	}




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
  				} catch(ex){
            return;
            //throw ex;
          }

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
    //!!!!!!!!!!!!!!!!!!!!! MOVE TO ANOTHER MODULE !!!!!!!!!!!!!!!!!!!!!!!!!
  	function buildContentMap(element){
  		var contentNodes = selectNodes(element,'[sjs-content]', function(node){
			  if(!node.attributes) return null;
			  if(node.attributes['sjs-content']) return node;
			  return null;
		  })
		,	cMap = {};

  		if(!contentNodes) return;
  		var node = element;
  		for(var i=0; i<=contentNodes.length; i++){
  			var attr = node.getAttribute('sjs-content');
  			if(!attr) {
  				node = contentNodes[i];
  				continue;
  			}
  			var keys = attr.split(' ');
  			for(var k=0; k<keys.length; k++){
  				var key = keys[k];
  				if(cMap[key]) throw 'Duplicate content map key ' + key;
  				cMap[key] = {source:node, cache:null, n:0};
  			}
  			node = contentNodes[i];
  		}
  		return cMap;
  	};


    function _propertyValueLocator(path){
  				var npath = path.split('.')
  				,	result = this;

  				//loop over path parts
  				for(var i=0; i < npath.length-1; i++ ){
  					result = result[npath[i]];
  					if(result == null) log.warn('Property ' + path + ' is not found in object ' + result);
  				}
  				var p = npath[npath.length - 1];
  				if(result && result[p] == undefined) log.warn('Property ' + path + ' is not found in object ' + result);

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

  	function Binding(propName, bindingType,prev){
  		this.prop = propName;
  		this._type = BINDING_TYPES.PARENT;
  		this.direction = 3;// auto BINDING_DIRECTIONS.AUTO;
  		this.prev = prev;

      //fallback fill
      this.parent = this;
  	}

    Binding.prototype.type = function(type){
      this._type = BINDING_TYPES.TYPE;
      this.vartype = type;
      return this;
    }

  	/**
  	 *	@scope|Namespace - component scope
  	 */
  	Binding.prototype.getTargetInstance = function getTargetInstance(originInstance, scope){

  		switch(this._type){

  			case BINDING_TYPES.PARENT:
  				if(!originInstance.parent) throw 'Unable to locate parent instance';
  			return originInstance.parent;


  			case BINDING_TYPES.TYPE:
  				/*locate var type */

  				var	parent = originInstance;
  				// 1. component lookup
  				var vartype = scope.__sjs_components__.lookup(this.vartype);
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

    /*
   * !!! Bidirectional bindings are junk and not allowed, use event-based data contract instead
   * */
  function binding(np){
     return new Binding(np);
  }



/** 
 * Base controller class that handles component's lifecycle
*/
function Controller(){
	this.views = {};
	if(!this.children)	this.children = [];
  	if(!this.__sjs_visual_children__) this.__sjs_visual_children__ = [];
};

Controller.prototype = {
	onAttach : function(){
		//Controller is attached to the DOM
	},
	onDisplay : function(){
		//Controller is being displayed
	},
	onRemove : function(){
		//Called when component is removed from the DOM tree
	},
	onDispose : function(){
		//Controller is being disposed
	},
	onBeforeBinding : function(){
		//Called just before binding resolution
	},
	onBindingsReady : function(){
		//Bindings have been resolved
	},
	onTemplateReady : function(){
		//Template is ready and child controls are initialized
	},
	onReflow:function(top, left, width, height, isBubble){
		//Called when component's size information is required of provided
		//in some layout situation size could be calculated starting with a child
	}
}

Controller.prototype.toString = function(){
	return getFunctionName(this.constructor);
};

Controller.prototype.initialize = function(){
	var fn = imports.Utils.fname(this.constructor)
	if(fn === 'Controller') return;
	log.warn(fn + '.initialize is not implemented');
};
/** 
 * Display target must be either a view or another controller
 * If target is a controller instance then current root 
 * is added to the targets root by default or into location
 * specified under sjs-element attribute when target is a view
 * */	
Controller.prototype.display = function(target){
	if(target instanceof Controller)
		target = target.views.root; 	

	View.display(this.views.root,target);

	this.onAttach();	
	this.onDisplay();
	if(!this.children) return;
		for(var i=0; i< this.children.length; i++){
		var child = this.children[i];
		if(typeof child.onAttach === 'function')
			child.onAttach();
		if(typeof child.onDisplay === 'function')
			child.onDisplay();
	}
	return this;	
}

Controller.prototype.remove = function(){
	View.remove(this.views.root);
	this.onRemove();
}

Controller.prototype.reflow = function(){

} 

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

  /*
  if(content instanceof Controller ){
  	var root = content.views.root;
  	if(!root) return;
  	this.contentMap[key].source.innerHTML = '';
  	this.contentMap[key].source.appendChild(root.htmlElement);
  	this.contentMap[key].cache = root.htmlElement;
  	content.onAttach();
  	content.onDisplay();
  }

  */

function _applyContent(content, key, callback){
	var view = this.views.root;
	var result = 0;

	if(content == null) return result;

	if(key != null && view.contentMap[key] == null)
		return result = -1;

	//proxy content
	if(content.__sjs_isproxy__ === true ){
		return _applyContent.call(this,new content({parent:this}), key, callback);
	}

	//no content map, simple view, default map must be present
	if(content instanceof Controller) {
		if(!content.views || !content.views.root) return this;
		callback.call(view,content.views.root, key);
		return result;
	}
	callback.call(view, content, key);
	return result;
}

function _controllerContentMapper(content,callback){
	if(content == null) return;
	var type = typeof(content),
	isContent = 0;

	if( type == 'object' &&
			!(content instanceof Controller) && !(content instanceof View) ) {
		// composed content, represented by content object's properties
		var keys = Object.keys(content);
		if(!keys || keys.length < 1) {
			_applyContent.call(this,content.toString(), null, callback);
			return;
		}
		for(var i=0; i<keys.length; i++){
			isContent +=_applyContent.call(this,content[keys[i]], keys[i], callback);
		}
		if(isContent < 0){
			_applyContent.call(this,content.toString(), null, callback);
		}
		return this;
	}
	_applyContent.call(this,content, null, callback);
	return this;
};

//set content of the controller
Controller.prototype.content = function(content){
	var self = this;
	return {
		replace: function(){_controllerContentMapper.call(self,content, View.replaceContent)},
		add: 		 function(){_controllerContentMapper.call(self,content, View.addContent)},
		remove:  function(){_controllerContentMapper.call(self,content, View.removeContent)}
	}
};

//iterate over children and release event listeners
Controller.prototype.dispose = function(){
	for(var i=0; i<this.children.length; i++){
		var child = this.children[i];
		if(child instanceof Controller){
			child.dispose();
		}
	}// end for children
	log.info('releasing events');
};


  	function Template(dom){
      if(typeof dom == 'string')  dom = constructTemplate(dom);

  		if(!dom) throw 'Template constructor argument must be a DOM element';
  		this.dom = dom;
  		this.dom.normalize();

  		/* template attributes */
  		this.type = dom.getAttribute('sjs-type');
  		this.controller = dom.getAttribute('sjs-controller');

  		//export attribute exists
  		if(this.dom.attributes['sjs-export']) {
  			var exp = dom.getAttribute('sjs-export');
  			if(!exp) this._export = this.type;
  			else this._export = exp;
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

    Template.prototype.compile = function(scope){
      var template = this;
       /*
      * Run notations and scripts to form a
      * final template DOM
      * */
     _resolveCustomElements.call(scope,template);

     var component = createComponent(template.controller, template, scope);
     scope.components[template.type] = component;
     // export only components and
     if(component.isComponent && component.template._export != null)
       scope.__sjs_module_exports__[
           component.template._export?component.template._export:template.type
       ] = component;
     return component;
    };



  	Template.prototype.processIncludeAnchors = function(dom, controller, scope){
  		var anchors = selectNodes(dom,'[data-sjs-tmp-anchor]', function(node){
			  if(!node.attributes) return null;
			  if(node.attributes['data-sjs-tmp-anchor']) return node;
			  return null;
		});  
  		for(var i=0; i < anchors.length; i++){

  			var childId = anchors[i].getAttribute('data-sjs-child-id');
  			var _Proxy 	= this.children[childId];

  			var instance = new _Proxy({parent:controller, parentscope:scope});
  			if(!instance.views || !instance.views.root) continue;
  			anchors[i].parentNode.replaceChild(instance.views.root.htmlElement, anchors[i]);
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
  		var elements = selectNodes(deepClone,'[sjs-element]', function(node){
			  if(!node.attributes) return null;
			  if(node.attributes['sjs-element']) return node;
			  return null;
		}); 
		  
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
  		 this.processIncludeAnchors(deepClone,controllerInstance,scope);


  		/*build views*/
  		views.root = new View(deepClone.children[0],{simple:true});
  		views.root.contentMap = rootContentMap;
      // what does view.root.isSimple do?????
      if(views.root.htmlElement)
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
  			if(parameters && parameters['class'])
  				views.root.cl(parameters['class']).add();
  		}

  	};


  	var container = document.createElement('span');


  	function extractComponents(dom){
  		//var start  = window.performance.now();
		if(!this.__sjs_components__) this.add('__sjs_components__',new sjs.namespace());
  		
		var nodes = selectNodes(dom,'sjs-component',function(node){
			if(node.tagName == 'SJS-COMPONENT') return node;
			return null;
		});
		  	
		for(var i=0; i<nodes.length; i++){
  			var node = nodes[i];
  			this.__sjs_components__[node.attributes['sjs-type'].value] = new Template(node);
  			this.__sjs_components__.length = i + 1;
  		}

  		//var end = window.performance.now();
  		//perf.total += (end-start);
  		//log.info('template collection performance step: ' +  (end-start) + ' total: ' + perf.total) ;
  		return this.__sjs_components__;
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



  	function collectAttributes(node, filter){
  		if(!node) return null;

  		var attributes = node.attributes;
  		if(!attributes) return '';

  		var result = ''
  		,	separator = '';

  		for(var i=0; i<attributes.length; i++){
  			var attr = attributes[i]
  			,	name = propertyName(attr.name,true);

  			if(indexOf(RESERVED_ATTRIBUTES,name) < 0) continue;

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


  		var _type = '__inlineTemplate__'+(scope.__sjs_components__.sequence++)
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

  		var	elements = 	doc.select.nodes({childNodes:dom.childNodes},
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





  	function _resolveCustomElements(template){

  		var scope = this;

  		/* select top level includes */
  		var inclusions = [];

  		var nodes = doc.select.nodes({childNodes:template.dom.childNodes},
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

  			var result = fn.call(scope,{proxy:proxy, binding:binding});

  			if(typeof result !==  'function'){
  				result = proxy.call(scope,result);
  			}

  			var a = template.addChild(result);
  			parent.replaceChild(a,node);
  		}
  	};




  	function resolveBinding(binding, instance, key, scope){
  		if(!binding) return;
  		//resolveBinding(binding.prev, instance, key, scope);

  		var source = null;
      var sourceInstance = null;
      //target of the binding
      var target = new DataItem(instance).path(key);

  		switch(binding._type){
  		case BINDING_TYPES.SELF:
  			break;

  		case BINDING_TYPES.PARENT:
  			if(!instance.parent) throw 'Cannot resolve parent binding, [instance.parent] is null';
        //resolve binding through dataitem
        source = new DataItem(instance.parent).path(binding.prop);
        sourceInstance = instance.parent;
  			break;

  		case BINDING_TYPES.FIRST_PARENT:
  			break;

  		case BINDING_TYPES.ROOT:
  			break;

  		case BINDING_TYPES.TYPE:
  			log.debug('Resolving binding to type: ' + binding.vartype);
  			var parent = instance;
        //find the type
  			//1. component lookup
  			var vartype = scope.__sjs_components__.lookup(binding.vartype);
  			//2. imports lookup
  			if(!vartype)
  				vartype = scope.lookup(binding.vartype);
  			//3. target not found
  			if (!vartype) throw 'Unable to resolve binding target type: ' + binding.vartype;

  			while(parent) {
  				if(parent.__sjs_type__ === vartype.__sjs_type__ || (parent instanceof vartype)) {
  					log.debug('Found instance of type: ' + binding.vartype);
            source = new DataItem(parent).path(binding.prop);
            sourceInstance = parent;
  					break;
  				}
  				parent = parent.parent;
  			}
        break;
  		} //end switch statement

  		if(!source) throw 'Cannot resolve binding source';

      var sourceValue = source.getValue();
      var targetValue = target.getValue();
      /*
        definition: source is a property reference residing in the controller class
      */



      //1. if source is event, subscribe to it
      if(sourceValue && sourceValue.__sjs_event__ === true &&
        typeof(targetValue) == 'function'){
        sourceValue.subscribe(targetValue,instance);
        return;
      }

      //2. if target is event subscribe to it
      if(targetValue && targetValue.__sjs_event__ === true &&
        typeof(sourceValue) == 'function'){
        targetValue.subscribe(sourceValue,sourceInstance);
        return;
      }

      if(targetValue && targetValue.__sjs_event__ &&
         sourceValue && sourceValue.__sjs_event__ ){
        targetValue.subscribe(sourceValue,sourceInstance);
        return;
      }

      //3.
      if(typeof(targetValue) == 'function' && typeof(sourceValue) != 'function'){
        source.subscribe(targetValue,instance);
        return;
      }

      //4. value to value binding
      target.setValue(sourceValue);

      log.info('---- target source ------');

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
  		if(!scope.__sjs_components__ || scope.__sjs_components__.length < 1) return; //no templates in this module

  		var keys = Object.keys(scope.__sjs_components__);

  		for(var i=0; i< keys.length; i++) {
  			var template = scope.__sjs_components__[keys[i]];
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
		_resolveCustomElements.call(scope,template);

		var component = createComponent(template.controller, template, scope);
		scope.__sjs_components__[template.type] = component;
        // export only components and
        if(component.isComponent && component.template._export != null)
          scope.__sjs_module_exports__[
              component.template._export?component.template._export:template.type
          ] = component;
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
  			var controller = null;
        if(_controller) {
            controller = scope.lookup(_controller);
            if(!controller)
            controller = scope.imports.lookup(_controller);
        }


  			/* assign default */
  			if(!controller) controller = Controller;
  			if(controller.isComponent) controller = controller.controller();

  			args = args || {};

/*
  			if(args._includer_scope) {
  				var idof = args._includer_scope.singletons.constructors.indexOf(this.constructor.component);
  				if(idof >=0) {
  					var inst =  args._includer_scope.singletons.instances[idof];
  					return inst;
  				}
  			}
*/
  /*
  			var obj = Object.create(controller.prototype);
  			obj.constructor = controller;
  */

  			var obj = new controller(args);

  			obj.__sjs_type__ = template.type;
        	obj.__sjs_visual_children__ = [];
        	obj.__sjs_args__ = args;
        	obj.children = [];
  			obj.scope = scope;

  			/*
  			 * assign reference to a parent and
  			 * append to children array
  			 * */
  			configureHierarchy.call(args._includer_scope,obj,args);
  			/*
  			 * Bind declarative parameters
  			 */
			obj.onBeforeBinding();  
  			bindDeclarations(args, obj, args._includer_scope);
  			obj.onBindingsReady();
			  
			/*
  				Instantiate Template
  			*/
   			template.getInstance(obj, args, scope);
			obj.onTemplateReady();   

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


    scope.exports(
      Template, Controller, 
	  defineComponents, compileTemplate,
      {Proxy:proxy}
    );

}
});
