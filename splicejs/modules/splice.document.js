/*
 * 
 * */
(function(document){

_.$ = function(id){ return document.getElementById(id);};


_.element = function(config){
	
	if(!config) return;
	if(!config.element) return;	
	var e = document.createElement(config.element);
	
	if(config.id) e.id = config.id;
	if(config.cssclass) e.className = config.cssclass;
	
	if(config.parent){
		config.parent.appendChild(e);
	}
	
	e.hide = function(){
		this.style.display = 'none';
	};
	
	e.show = function(){
		this.style.display = 'block';
	};
	
	e.reflow = function(l,t,w,h){
		var s = this.style;
		s.height 	= h + 'px';
		s.width 	= w + 'px';
		s.left 		= l + 'px';
		s.top 		= t + 'px';
		
	};
	
	return e;
};


_.className = function(node, className){
	var children = node.childNodes;
	var result = new Array();
	
	var matcher = new RegExp('([\\s+]|^)'+className+'([\\s+]|$)'); 
	
	for(var i=0; i<children.length; i++){
		if(matcher.test(children[i].className))
			result.push(children[i]);
	}
	
	if(result.length < 1) return null;
	return result;
};

function getValueUnit(value){
	if(!value) return null;

	value = value.toLowerCase();

	var index = value.indexOf('px');
	if(index >= 0) {
		return {
			value: 	1*value.substring(0,index), 
			unit: 	value.substring(index,value.length)
		};
	}
};

_.Doc = new Doc();

function Doc(){}


Doc.prototype.style = function(element){
	var css = window.getComputedStyle(element,null);

	var getValue = function(valueName){
		return getValueUnit(css.getPropertyValue(valueName));
	}

	return {
		
		height:getValue('height'),
		padding:{
			left: 	getValue('padding-left'),
			right:  getValue('padding-right'),
			top: 	getValue('padding-top'), 
			bottom: getValue('padding-bottom')
		}

	}

}


Doc.prototype.setTitle = function(documentTitle){
	document.title = documentTitle;
};


Doc.prototype.dom = function(element){
	return new DomWrapper(element);
};


Doc.prototype.elementPosition = function(element){

	var n = element;
	var location  = new Array(0,0);

	while (n != undefined) {
        
        location[0] += (n.offsetLeft)? n.offsetLeft : 0;
        location[1] += (n.offsetTop)?  n.offsetTop : 0;
        
        location[1] -= n.scrollTop;
        
        n = n.offsetParent;
	}
	return {x:location[0],y:location[1]};
};


Doc.prototype.elementSize = function(element){
	return {width:element.offsetWidth,height:element.offsetHeight};
};

Doc.prototype.cloneNodeAndProperties = function(domSource, args){
	
	// noop on void property lists
	if(!args.properties || args.properties.length < 1 ) return;
	
	var idHold = new Array();
	var sourceNodes = domSource.querySelectorAll(args.selectors);
	
	/* 
	 * Mandatory processing of the root node
	 * because querySelectorAll returns only children
	 * id source nodes 
	 * */
	var currentId = 1;
	for(var i=-1; i < sourceNodes.length; i++){
		
		var node = i==-1?domSource:sourceNodes[i];
		
		//check if node has any properties of interest properties
		for(var p = 0; p < args.properties.length; p++ ){
			// found property
			if(args.properties[p] in node) {
				var sgiId = node.getAttribute('data-sgi-id');
				if(!sgiId) { 
					sgiId = currentId;
					node.setAttribute('data-sgi-id',currentId++);
				}
				idHold[sgiId] = node;
			}
		} // property loop
	} // node loop
	
	var clonedDom = domSource.cloneNode(args.isDeep);
	
	var idedNodes = clonedDom.querySelectorAll('[data-sgi-id]');
	
	/*	
	 * traverse ided nodes 
	 * mandatory processing of the root node
	 * */
	for(var i=-1; i< idedNodes.length; i++){
		var node = i==-1?clonedDom:idedNodes[i];
		var sgid = node.getAttribute('data-sgi-id');
		
		var sourceNode = idHold[sgid];
		if(!sourceNode) continue;
		for(var p = 0; p < args.properties.length; p++ ){
			node[args.properties[p]] = sourceNode[args.properties[p]];
		}
		
		node.removeAttribute('data-sgi-id');
	}
	
	/* remove temp ids from the source dom 
	 * to avoid overlaps on concequtive cloning
	 * */
	var nodes = domSource.querySelectorAll('[data-sgi-id]');
	for(var i=0; i<nodes.length; i++){
		nodes[i].removeAttribute('data-sgi-id');
	}
	
	return clonedDom;
};

Doc.prototype.getHeight = function(){
	return document.documentElement.clientHeight;
};


Doc.prototype.display = function(control,ondisplay){
	if(!control) return;
	
	document.body.innerHTML = '';
	
	if(control.concrete && control.concrete.dom) {
		document.body.appendChild(control.concrete.dom);
		if(typeof ondisplay === 'function') ondisplay(control);
		if(typeof control.onAttach === 'function') control.onAttach();
		if(typeof control.onDisplay === 'function') control.onDisplay();
		return;
	}
	
	if(control.dom) {
		document.body.appendChild(control.dom);
		if(typeof ondisplay === 'function') ondisplay(control);
		return;
	}
};


Doc.prototype.$ = function(target){


	return {

		add:function(control){
			if(!control) return;
			
			if(control.concrete && control.concrete.dom) {
				target.appendChild(control.concrete.dom);
				if(typeof ondisplay === 'function') ondisplay(control);
				if(typeof control.onDisplay === 'function') control.onDisplay();
				return;
			}
			
			if(control.dom) {
				target.appendChild(control.dom);
				if(typeof ondisplay === 'function') ondisplay(control);
				return;
			}
		},



		embed:function(control){
			if(!control) return;
	
			target.innerHTML = '';
			
			if(control.concrete && control.concrete.dom) {
				target.appendChild(control.concrete.dom);
				if(typeof ondisplay === 'function') ondisplay(control);
				if(typeof control.onDisplay === 'function') control.onDisplay();
				return;
			}
			
			if(control.dom) {
				target.appendChild(control.dom);
				if(typeof ondisplay === 'function') ondisplay(control);
				return;
			}
		},
		
		/**
		 * size:{width:Number,height:Number};
		 */
		size:function(size) {
			var style = target.style;
			if(size) {
				style.width  = size.width  + 'px';
				style.height = size.height + 'px';
			}

			return {
				width: 		target.clientWidth,
				height: 	target.clientHeight	
			}
		},

	   /**
		* position:{left:Number, top:Number, bottom:Number, right:Number}
		*/
		position:function(pos){
			var style = target.style;
			if(pos) {
				if(pos.left) style.left = pos.left + 'px';
				if(pos.top)  style.top = pos.top + 'px';
			}

			return {
				left: 	target.offsetLeft,
				top: 	target.offsetTop
			}	
		}

	}
};




function isUnknownElement(node) {
	if(node instanceof window['HTMLUnknownElement']) return true;
	return false;
} 



/*
 * use this where treewalker is not supported
 * IE8 for example.
 * */
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

Doc.prototype.selectNodes = function selectNodes(dom,filterFn, nodesFn){
	var nodes = new Array();
	dfs(dom,nodes,filterFn, nodesFn);
	if(nodes.length < 1) nodes = null;
	return nodes;
};

Doc.prototype.selectComments = function selectComments(dom){
	var nodes = new Array();
	//nodeType 8 is comment node
	dfs(dom,nodes,function(node){ 
		if(node.nodeType === 8) return node; return null; 
	});
	if(nodes.length < 1) nodes = null;
	return nodes;
};


Doc.prototype.selectUnknownElements = function selectUnknownNodes(dom){
	var nodes = new Array();
	
	dfs(dom,nodes,
		function(node){
			if(isUnknownElement(node)) return node;
			return null;
		},
		function(node){
			if(isUnknownElement(node)) return [];
			else return node.childNodes;
		}
	);

	if(nodes.length < 1) nodes = null;
	return nodes;
};


Doc.prototype.selectElementNodes = function selectNonTextNodes(dom, filterFn){
	var nodes = new Array();
	//nodeType 3 is a text node
	dfs({childNodes:dom.childNodes},nodes,
		function(node){ 
			if(node.nodeType === 1) return node;
			return null; 
		},
		function(node){
			if(node.nodeType === 1) return [];
			return node.childNodes;
		}
	);
	if(nodes.length < 1) nodes = null;
	return nodes;
};

Doc.prototype.selectTextNodes = function selectTextNodes(dom,filterFn){
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


Doc.prototype.stopEventPropagation = function(event){
	event.cancelBubble = true;
	if(event.stopPropagation) event.stopPropagation();
};

Doc.prototype.firstNonText = function(dom){
	for(var i=0; i < dom.childNodes.length; i++){
		var n = dom.childNodes[i];
		if(n.nodeType != 3) return n;
	}
};

Doc.prototype.element = function(config){
if(!config) return;
	if(!config.element) return;	
	var e = document.createElement(config.element);
	
	if(config.id) e.id = config.id;
	if(config.cssclass) e.className = config.cssclass;
	
	if(config.parent){
		config.parent.appendChild(e);
	}
	
	e.hide = function(){
		this.style.display = 'none';
	};
	
	e.show = function(){
		this.style.display = 'block';
	};
	
	e.reflow = function(l,t,w,h){
		var s = this.style;
		s.height 	= h + 'px';
		s.width 	= w + 'px';
		s.left 		= l + 'px';
		s.top 		= t + 'px';
		
	};
	
	return e;
};

function DomWrapper(domElement) {
	this.dom = domElement;
};

DomWrapper.prototype.replaceContent = function(newContent){
	
	this.dom.innerHTML = "";
	this.dom.appendChild(newContent);
};

})(document);