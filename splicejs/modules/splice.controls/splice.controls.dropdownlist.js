sjs({

	required:[
		{'SpliceJS.UI':'../splice.ui.js'},
		{'SpliceJS.Controls':'splice.controls.selectors.js'},
		{'SpliceJS.Controls':'splice.controls.listbox.js'},
		'splice.controls.dropdownlist.html'
	],

	definition:function(){

		var scope = this.scope
		,	Class = this.sjs.Class
		,	Event = this.sjs.Event;

		var	UIControl = scope.SpliceJS.UI.UIControl;

		/**
	 * Drop down list
	 * */
	var ListController = Class.extend(UIControl)(function DropDownListController(args){
		this.super();
		this.dom = this.concrete.dom;

	});

	ListController.prototype.onDropDown = Event;


	/* module exports */
	return {
		DropDownListController: ListController
	};

}});
