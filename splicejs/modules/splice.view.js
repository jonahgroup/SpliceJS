$js.module ({
imports:[
    { Inheritance : '/{$jshome}/modules/splice.inheritance.js'},
    { Syntax : '/{$jshome}/modules/splice.syntax.js'},
    { Document  : '/{$jshome}/modules/splice.document.js'},
    { Events : '/{$jshome}/modules/splice.event.js'}
]
,
definition:function(){
 	"use strict";
	 
	var scope = this;

  var	sjs = scope.sjs
  , 	imports = scope.imports
  ;

  var Tokenizer = imports.Syntax.Tokenizer
  , 	Document = imports.Document
  ,  	Class = imports.Inheritance.Class
  ,  	Events = imports.Events
  ;

	/**
	 * Runs Depth-First-Search on DOM tree 
	 */
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
	}

  function selectNodes(dom,filterFn, nodesFn){
  	var nodes = new Array();
    dfs(dom,nodes,filterFn, nodesFn);
    if(nodes.length < 1) nodes = null;
    return nodes;
  }

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


function display(view,target){
	target = target || document.body;
	
	if(target instanceof View)
		target = target.htmlElement;
	
	target.appendChild(view.htmlElement);
	view.visualParent = target;
	return view;
}

function remove(view){
	view.visualParent.removeChild(view.htmlElement);
}

  	display.clear = function(view) {
  		if(!view) return {display : display};

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

  function _box(element){

  	var css = window.getComputedStyle(element,null);

  	var w  = css.getPropertyValue('width')
  	,	h  = css.getPropertyValue('height')
  	,	pl = css.getPropertyValue('padding-left')
  	,	pt = css.getPropertyValue('padding-top')
  	,	pr = css.getPropertyValue('padding-right')
  	,	pb = css.getPropertyValue('padding-bottom')
  	, bl = css.getPropertyValue('border-left-width')
  	,	bt = css.getPropertyValue('border-top-width')
  	,	br = css.getPropertyValue('border-right-width')
  	,	bb = css.getPropertyValue('border-bottom-width')
  	,	ml = css.getPropertyValue('margin-left')
  	,	mt = css.getPropertyValue('margin-top')
  	,	mr = css.getPropertyValue('margin-right')
  	,	mb = css.getPropertyValue('margin-bottom');

  	return {
  		height:	h,
  		width:	w,
  		padding: {left:pl, top:pt, right:pr, bottom:pb},
  		border:  {left:bl, top:bt, right:br, bottom:bb},
  		margin:  {left:ml, top:mt, right:mr, bottom:mb},
  		unit:function(){return {
  				height:	+_unit(h),
  				width:	+_unit(w),
  				padding: {left: +_unit(pl), top: +_unit(pt), right: +_unit(pr), bottom: +_unit(pb)},
  				border:  {left: +_unit(bl), top: +_unit(bt), right: +_unit(br), bottom: +_unit(bb)},
  				margin:  {left: +_unit(ml), top: +_unit(mt), right: +_unit(mr), bottom: +_unit(mb)}
  			}
  		}
  	}
  };



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



    	function domEventArgs(e){
    		return {
    			mouse: mousePosition(e),
    		  source: e.srcElement,
          domEvent:e,     // source event
    			cancel: function(){
                	this.cancelled = true;
                	e.__jsj_cancelled = true;
                }
    		}
    	};


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



  /**
  */
  function ViewReflow(){
  }

  ViewReflow.prototype.simple = function(){
  	return this;
  }

  ViewReflow.prototype.fitparent = function(){
  	return this;
  }

  ViewReflow.prototype.size = function(left, top, width, height){
  	var box = _box(this.htmlElement).unit()
  	, s = this.htmlElement.style;

  	s.width = (width - box.padding.left
  									- box.padding.right
  									- box.border.left
  									- box.border.right) + 'px';


  	return this;
  }






  /*
      -----------------------------------------------------------------
      Dom Event
  */
  var DomMulticastEvent = Class(function DomMulticastEvent(){
  }).extend(Events.BaseEvent);


  var DomMulticastStopEvent = Class(function DomMulticastStopEvent(){
    this.base();
    this.stopPropagation = true;
  }).extend(DomMulticastEvent);

  DomMulticastEvent.prototype.attach = function(instance, property){
    if(!Document.isHTMLElement(instance) && !(instance instanceof View) && !(instance == window))
      throw "Cannot attach DomMulticastEvent target instance if not HTMLElement or not an instance of View ";
    var evt = Events.createMulticastRunner();


    if(this.stopPropagation === true) {
      var fn = evt;
      evt = function(e){
        if(!e) e = window.event;
        _cancelBubble(e);
        setTimeout(function(){
          fn(this.args);
        }.bind({args:_domEventArgs(e)}),1);
      };
      evt.subscribe = function(){
        fn.subscribe.apply(fn,arguments);
      };
    }


    instance[property] = evt;
    if(instance instanceof View) {
      instance.htmlElement[property] = evt;
    }
    return evt;
  }

  function _cancelBubble(e){
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();
  }

  function _domEventArgs(e){
    return {
      mouse: mousePosition(e),
      source: e.srcElement,
      domEvent:e,     // source event
      cancel: function(){
              this.cancelled = true;
              e.__jsj_cancelled = true;
            }
    }
  };



  /*
      -----------------------------------------------------------------
  */
  /**
  	Dom manipulation api
  */
  function View(dom, args){
    if(!(this instanceof View)){
      return new View(dom,args);
    }
  	if(typeof dom === 'string'){
  		this.htmlElement = (function(d){
  			var e = document.createElement('span');
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
  	this.reflow = new ViewReflow(this);
  };

  View.prototype.cl = function(className){
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

  View.prototype.content = function(content,key){
    return View.addContent.call(this,content,key);
  }

  View.addContent = function addContent(content,key){
  	if(!key) key = 'default';

  	var target = this.contentMap[key];
  	if(!target) return this;

  	var node = this.contentMap[key].source;
  	if(content instanceof View){
  		node.appendChild( content.htmlElement );
  	} else {
  		node.appendChild( document.createTextNode(content.toString()) );
  	}
  	target.n++;
    return this;
  };

  View.replaceContent = function replaceContent(content,key){
  	if(content == null) return this;
  	if(!key) key = 'default';
  	//coercive comparision, checks null and undefined
  	var target = this.contentMap[key];
  	if( target == null ) return this;

  	if(content instanceof View){
  		//content is already set
  		if(target.source.children[0] == content.htmlElement) return this;
  		target.source.innerHTML = '';
  		target.cache = null;
  		target.source.appendChild(content.htmlElement);
  		target.n = 1;
  		return this;
  	}
  	else{
  		var node = target.cache;
  		if(!node) {
  			node = document.createTextNode(content.toString());
  			target.source.innerHTML = '';
  			target.cache = node;
  			target.source.appendChild(node);
  			target.n = 1;
  		}
  		node.nodeValue = content.toString();
  		return this;
  	}
  	
  };

  View.removeContent = function removeContent(content, key){
  	if(!key) key = 'default';

  	var target = this.contentMap[key];
  	if( target == null || target.n == 0 ) return this;

  	if(target.n == 1){
  		target.source.innerHTML = '';
  		target.cache = null;
  		target.n = 0;
  	} else {
  		if(content instanceof View){
  			//look for nodes to remove
  			for(var i=0; i< target.source.childNodes.length; i++){
  				var node = target.source.childNodes[i];
  				if(node == content.htmlElement) {
  					target.source.removeChild(node);
  				}
  			}
  		} else {

  		}
  	}
  	var node = target.cache;
  };

  View.display = display;
	View.remove = remove;

  View.prototype.add = View.addContent;
  View.prototype.replace = View.replaceContent;


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

  scope.exports(
    View, {
      DomMulticastEvent:new DomMulticastEvent(),
      DomMulticastStopEvent: new DomMulticastStopEvent()
    }
  );
}
});
