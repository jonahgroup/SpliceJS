sjs({

	required:[
		{'SpliceJS.UI':'../splice.ui.js'},
		{'SpliceJS.Controls':'splice.controls.selectors.js'},
		{'SpliceJS.Controls':'splice.controls.listbox.js'},
		'splice.controls.dropdownlist.html'
	],

	definition:function(sjs){
		"use strict";

	var scope = this.scope
	,	exports = sjs.exports
	,	event = sjs.event
	,	Class = this.sjs.Class;

	var	UIControl = scope.SpliceJS.UI.UIControl;

		/**
	 * Drop down list
	 * */
	var DropDownListController = Class(function DropDownListController(args){
		this.super();

		event(this).attach({
			onDropDown : event.multicast,
			onListData : event.multicast,
			onDataItem : event.multicast
		});

	}).extend(UIControl);


	DropDownListController.prototype.initialize = function(){
		this.onDataItem.subscribe(function(item){
			this.children.selector.close();
		},this);
	};

	/**
		Override onDataIn handler to avoid calling onDataOut event
		DropDownList calls onDataOut event explicitry when
		drop-down function is activated
	*/
	DropDownListController.prototype.onDataIn = function(item){
	};

	DropDownListController.prototype.dropDown = function(){
		if(this.dataItem) {
			this.onDataOut(this.dataItem);
		}
		this.onDropDown();
	};

	DropDownListController.prototype.setSelectedItem = function(item){
		this.children.selector.dataIn(item);
	};


	/* scope exports for component consumption*/
	exports.scope(
		DropDownListController
	);

	/* module exports */
	exports.module(
		DropDownListController
	);

}});
