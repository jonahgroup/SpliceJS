sjs({
	
	required:[
		{'SpliceJS.UI':'../splice.ui.js'},
		{'SpliceJS.Controls':'splice.controls.selectors.js'},
		{'SpliceJS.Controls':'splice.controls.listbox.js'},
		'splice.controls.dropdownlist.html'
	],
	
	definition:function(){
		
		var Component = this.framework.Component
		,	UIControl = this.SpliceJS.UI.UIControl;
		
		/**
	 * Drop down list
	 * */
	var DropDownList = Component('DropDownList')(function DropDownList(args){
		UIControl.call(this);
		this.dom = this.concrete.dom;
	}).extend(UIControl); 


	/* module exports */	
	return {
		
		DropDownList: DropDownList
			
	}	
		
}});