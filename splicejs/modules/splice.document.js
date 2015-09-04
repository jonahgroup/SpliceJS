/* global sjs */
sjs({
definition:function(){

	var Tokenizer = this.Tokenizer;

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


	function style(element){
		var css = window.getComputedStyle(element,null);
	
		var getValue = function(valueName){
			return getValueUnit(css.getPropertyValue(valueName));
		}
	
		return {
			height: css.getPropertyValue('height'),
			padding:{
				left: 	getValue('padding-left'),
				right:  getValue('padding-right'),
				top: 	getValue('padding-top'), 
				bottom: getValue('padding-bottom')
			}
		}
	};


	function setTitle(documentTitle){
		document.title = documentTitle;
	};

	function isUnknownElement(node) {
		if(node instanceof window['HTMLUnknownElement']) return true;
		return false;
	}; 

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

	function selectNodes(dom,filterFn, nodesFn){
		var nodes = new Array();
		dfs(dom,nodes,filterFn, nodesFn);
		if(nodes.length < 1) nodes = null;
		return nodes;
	};

	function selectComments(dom){
		var nodes = new Array();
		//nodeType 8 is comment node
		dfs(dom,nodes,function(node){ 
			if(node.nodeType === 8) return node; return null; 
		});
		if(nodes.length < 1) nodes = null;
		return nodes;
	};

	function selectUnknownNodes(dom){
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


	function selectElementNodes(dom, filterFn){
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


	function firstNonText(dom){
		for(var i=0; i < dom.childNodes.length; i++){
			var n = dom.childNodes[i];
			if(n.nodeType != 3) return n;
		}
	};
	
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
	}
	
	
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
	
	function classOp(element){
		return { 
			remove: function(toRemove){
				removeClass(element,toRemove)
				return classOp(element);
			},
			add:function(toAdd){
				addClass(element,toAdd);
				return classOp(element); 
			},
			element:element
		}
	};

	function dom(element){
		if(!element) return null;
		return {
			append: function(child){
				element.appendChild(child.element);
				return dom(element);
			},
			replace:function(child){
				element.innerHTML = '';
				element.appendChild(child.element);
				return dom(element);	
			},
			size:	function(){
				return element.childNodes.length;
			},
			value:function(newvalue){
				//test node
				if(element.nodeType == 3) element.nodeValue = newvalue;
				return dom(element);
			},
			prop:function(prop,value){
				if(value == null || value == undefined) return element[prop];
				element[prop] = value;
				return dom(element);		
			},
			block:function(){
				element.style.display='block';
				return dom(element);
			},
			parent:function(sel){
					sel = sel.toUpperCase();
				var	node = element;
				
				while(node){
					if(node.nodeName === sel) return dom(node);
					node = node.parentNode;
				}
				return dom(null);
			},
			"class":classOp(element),
			
			element:element
		}	
	};

	dom.text = function(value){
		return dom(document.createTextNode(value));	
	};

	

	function create(name){
		return dom(document.createElement(name));	
	};



	function screenWidth(){
		return window.screen.width;
	}

	function screenHeight(){
		return window.screen.height;
	}

	return {
		style:style,
		select:{
			setTitle:		setTitle,
			firstNonText:	firstNonText,
			textNodes:		selectTextNodes,
			elementNodes:	selectElementNodes,
			unknownNodes:	selectUnknownNodes,
			commentNodes:	selectComments
		},
		screen:{
			width		:screenWidth,
			height		:screenHeight
		},
		window:{},
		create:create,
		dom:dom,
		
	}

}});
