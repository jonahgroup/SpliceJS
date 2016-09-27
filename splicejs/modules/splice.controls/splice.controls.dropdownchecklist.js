$js.module({
prerequisite:[
  '/{$jshome}/modules/splice.module.extensions.js'
],
imports:[
	{'SpliceJS.UI':'../splice.ui.js'},
	{'SpliceJS.Controls':'splice.controls.selectors.js'},
	{'SpliceJS.Controls':'splice.controls.checklistbox.js'},
	'splice.controls.dropdownchecklist.html'
],
definition:function(sjs){
		"use strict";

	var scope = this
	,	sjs = this.imports.$js;

	var	Class = this.sjs.Class
	,	Event = this.sjs.Event
	,	exports = sjs.exports;

	var	UIControl = scope.SpliceJS.UI.UIControl;

		/**
	 * Drop down list
	 * */
	var ListController = Class(function DropDownCheckListController(args){
		this.super();
		this.dom = this.concrete.dom;

		this.onDataIn.subscribe(function(item){
			this.onListData(item);
		},this);

		this.onDataItem.subscribe(function(item){
		//	this.ref.selector.close();
		},this);

	}).extend(UIControl);

	ListController.prototype.dropDown = function(){
		if(this.dataItem) {
			this.onListData(this.dataItem);
		}
		this.onDropDown();
	};

	ListController.prototype.setSelectedItem = function(item){
			this.ref.selector.dataIn(item);
	};

	ListController.prototype.onDropDown = Event;
	ListController.prototype.onListData = Event;
	ListController.prototype.onDataItem = Event;
	//ListController.prototype.onSelection = Event;


	/* module exports */
	return {
		DropDownCheckListController: ListController
	};

}});
