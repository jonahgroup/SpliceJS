sjs({
	
	required:[
		{'SpliceJS.UI':'../splice.ui.js'},
		{'SpliceJS.Controls':'splice.controls.selectors.js'},
		{'SpliceJS.Controls':'splice.controls.listbox.js'},
		'splice.controls.dropdownlist.html'
	],
	
	definition:function(){
		
		var scope = this.scope
		,	Class = this.sjs.Class;
		
		var	UIControl = scope.SpliceJS.UI.UIControl;
		
		/**
	 * Drop down list
	 * */
	Class.extend(UIControl)(function DropDownListController(args){
		this.super();
		this.dom = this.concrete.dom;
	});


	/* module exports */	
	return {};	
		
}});