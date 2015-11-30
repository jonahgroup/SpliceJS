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
/*
		this.onDataIn.subscribe(function(item,path){
			this.onListData(item,path);
		},this);
*/
		this.onDataItem.subscribe(function(item){
			this.ref.selector.close();
		},this);
	};


	DropDownListController.prototype.onDataIn = function(){
		//do nothing
	};

	DropDownListController.prototype.dropDown = function(){
		if(this.dataItem) {
			//this.onListData(this.dataItem);
			this.onDataOut(this.dataItem, this.dataPath);
		}
		this.onDropDown();
	};

	DropDownListController.prototype.setSelectedItem = function(item){
		if(this.dataPath){
			this.ref.selector.dataIn(sjs.propvalue(item)(this.dataPath).value);
		} else {
			this.ref.selector.dataIn(item);
		}
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
