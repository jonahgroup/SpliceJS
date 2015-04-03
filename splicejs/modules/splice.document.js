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




_.Doc = new SengiDocument;



function SengiDocument(){}

SengiDocument.prototype.setTitle = function(documentTitle){
	document.title = documentTitle;
};


SengiDocument.prototype.dom = function(element){
	return new DomWrapper(element);
};


SengiDocument.prototype.elementPosition = function(element){

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


SengiDocument.prototype.elementSize = function(element){
	return {width:element.offsetWidth,height:element.offsetHeight};
};

SengiDocument.prototype.cloneNodeAndProperties = function(domSource, args){
	
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

SengiDocument.prototype.getHeight = function(){
	return document.documentElement.clientHeight;
};


SengiDocument.prototype.display = function(control,ondisplay){
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





/*
 * use this where treewalker is not supported
 * IE8 for example.
 * */
function dfs(dom, target, nodeType){
	if(!dom) return;
	if(dom.nodeType == nodeType) {target.push(dom); return;}
	
	for(var i=0; i < dom.childNodes.length; i++){
		var n = dom.childNodes[i];
		dfs(n,target,nodeType);
	}
}; 

SengiDocument.prototype.selectComments = function selectComments(dom){
	var nodes = new Array();
	//nodeType 8 is comment node
	dfs(dom,nodes,8);
	if(nodes.length < 1) nodes = null;
	return nodes;
};


SengiDocument.prototype.selectTextNodes = function selectTextNodes(dom){
	var nodes = new Array();
	//nodeType 3 is a text node
	dfs(dom,nodes,3);
	if(nodes.length < 1) nodes = null;
	return nodes;
};


SengiDocument.prototype.stopEventPropagation = function(event){
	event.cancelBubble = true;
	if(event.stopPropagation) event.stopPropagation();
};


function DomWrapper(domElement) {
	this.dom = domElement;
};

DomWrapper.prototype.replaceContent = function(newContent){
	
	this.dom.innerHTML = "";
	this.dom.appendChild(newContent);
};




var events = {};
_.Event = events;


events.onenter = function(e,callback){
	if(!e) var e = window.event; 
	if(!e) return;
	
	if(e.keyCode == 13){
		return { action: _.action.bind(e.srcElement)};
	}
	
	return {action:function(){}};
};

events.onevent = function(e,arguments){
	if(!e) var e = window.event; 
	if(!e) return;
	
	return { action: _.action.bind(e.srcElement)};
};

})(document);