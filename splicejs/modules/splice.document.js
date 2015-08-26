_.Module({
definition:function(){

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


	return {
		style:style,
		select:{
			setTitle:		setTitle,
			firstNonText:	firstNonText,
			textNodes:		selectTextNodes,
			elementNodes:	selectElementNodes,
			unknownNodes:	selectUnknownNodes,
			commentNodes:	selectComments
		}
	}

}});
