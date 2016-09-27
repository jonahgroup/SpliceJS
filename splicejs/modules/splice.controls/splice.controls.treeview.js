$js.module({
prerequisite:[
	'/{$jshome}/modules/splice.module.extensions.js'
],
imports:[
	{ Inheritance : '/{$jshome}/modules/splice.inheritance.js'},
	{ Events			: '/{$jshome}/modules/splice.event.js'},
	{'SpliceJS.UI':'../splice.ui.js'},
	{'SpliceJS.Controls':'splice.controls.scrollpanel.js'},
	'splice.controls.treeview.css',
	'splice.controls.treeview.html'
]
,
definition:function(){
	var scope = this;
	
	var
		sjs = scope.imports.$js
    ,   imports = scope.imports
	;

	var
		Class       = imports.Inheritance.Class
	,	UIControl 	= imports.SpliceJS.UI.UIControl
	,	Event       = imports.Events.event;
	;

	var TreeView = Class( function TreeViewController(){
		this.base();
		this.onDataIn.subscribe(renderTree, this);
	}).extend(UIControl);


	var Tree = Class(function TreeController(){
		this.base();

		this.onDataIn.subscribe(function(data){
			this.elements.treeRoot.innerHTML = data;
			this.onTreeRefresh();
		},this);
	}).extend(UIControl);

	Tree.prototype.onTreeRefresh = Event;


	function renderTree(data){
		var str = parseTree(data);
		this.ref.tree.dataIn(str);
	}


	function breakout(node){
		return new Array(
				node.substr(0,node.indexOf('|')),
				node.substr(node.indexOf('|')+1)
		);
	};


	function parseTree(json, filter){

		/*this is array, also root node*/
		var str = '';
		for(var i=0; i < json.length; i++){

			if(typeof json[i] == 'object') str += parseTree(json[i],filter);
			else {
				var b = breakout(json[i]);
				if( (filter && b[1].toLowerCase().indexOf(filter.toLowerCase()) > -1 ) || !filter)
				str += '<li><div id="'+b[0]+'" class="-splicejs-tree-item">'+b[1]+'</div></li>';
			}
		}

		if(json.length > 0) return str;

		/*parse JSON tree representation */
		for(prop in json ){
			if(typeof json[prop] == 'object' ) {
				var b = breakout(prop);
				var tmp = '<li><div id="'+b[0]+'" class="-splicejs-tree-item">'+
					'<div class="-sc-tree-expandor -sc-tree-node-expanded"></div>'+b[1]+'</div><ul>';
				var subitems = parseTree(json[prop],filter);

				if( (filter && b[1].toLowerCase().indexOf(filter.toLowerCase()) > -1 ) || !filter || subitems.length > 5)
					str += tmp + subitems + '</ul></li>';
			}
		}

		return str;
	}

	
}


});
