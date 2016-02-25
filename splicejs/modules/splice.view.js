


definition:function(){


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


  /**
  */
  function ViewReflow(){

  }

  ViewReflow.prototype.default = function(){
  	return this;
  };

  ViewReflow.prototype.fitparent = function(){
  	return this;
  };

  ViewReflow.prototype.size = function(left, top, width, height){
  	var box = _box(this.htmlElement).unit()
  	, s = this.htmlElement.style;

  	s.width = (width - box.padding.left
  									- box.padding.right
  									- box.border.left
  									- box.border.right) + 'px';


  	return this;
  };


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
  	this.reflow = new ViewReflow(this);
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

  	var target = this.contentMap[key];
  	if(!target) return this;

  	var node = this.contentMap[key].source;
  	if(content instanceof View){
  		node.appendChild( content.htmlElement );
  	} else {
  		node.appendChild( document.createTextNode(content.toString()) );
  	}
  	target.n++;
  };

  function replaceContent(content,key){
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
  	return this;
  };

  function removeContent(content, key){
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


}
