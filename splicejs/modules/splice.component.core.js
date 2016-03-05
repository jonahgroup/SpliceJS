sjs.module({
required:[
  '/{sjshome}/modules/splice.network.js'
],
definition:function(sjs){


  /*
  ----------------------------------------------------------
  	HTML File Handler
  */
  var htmlHandler = function(filename, loader){
    loader.loadNext();
  };

  /*
  ----------------------------------------------------------
  	CSS File Handler
  */
  var cssHandler = function(filename,loader){
    sjs.log.info('Loading css file');

    var style = document.createElement('link');
    style.setAttribute('href',filename);

    document.head.appendChild(style);
    loader.loadNext();
  };


  sjs.extension({'.css':cssHandler}).loader();
  sjs.extension({'.html':cssHandler}).loader();

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










  function isExternalType(type){
  		if(type[0] === '{') {
  			var parts = type.substring(1,type.indexOf('}')).split(':');
  			return {namespace:parts[0], filename:parts[1]}
  		}
  		return null;
  }



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


  /**
  	Controller class
  */
  function Controller(){

  		this.views = {};

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

  	Controller.prototype.toString = function(){
  		return getFunctionName(this.constructor);
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
  			replace: function(){_controllerContentMapper.call(self,content, replaceContent)},
  			add: 		 function(){_controllerContentMapper.call(self,content, addContent)},
  			remove:  function(){_controllerContentMapper.call(self,content, removeContent)}
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



  	function _processIncludeAnchors(dom, controller, scope){
  		var anchors = dom.querySelectorAll('[data-sjs-tmp-anchor]');

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

    //component module loader
    function component(def){
      sjs.log.info('This is a component loader');
      if(typeof def.definition == 'function'){
        def.definition(sjs.core());
      }
    }
    sjs.extension({component:component}).add();
}})