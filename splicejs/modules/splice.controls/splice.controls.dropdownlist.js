sjs.module({
prerequisite:[
  '/{sjshome}/modules/splice.module.extensions.js'
],
required:[
	{ Inheritance : '/{sjshome}/modules/splice.inheritance.js'},
	{ Data: '/{sjshome}/modules/splice.dataitem.js'},
	{ Events: '/{sjshome}/modules/splice.event.js'},
	{ Component: '/{sjshome}/modules/splice.component.core.js'},
	{'SpliceJS.UI':'../splice.ui.js'},
	{'SpliceJS.Controls':'splice.controls.selectors.js'},
	{'SpliceJS.Controls':'splice.controls.listbox.js'},
	'splice.controls.dropdownlist.html'
]
,
definition:function(scope){
	"use strict";

	var sjs = scope.sjs
	,	imports = scope.imports
	;

	var
		Class = imports.Inheritance.Class
	,	Events = imports.Events
	, 	MulticastEvent = imports.Events.MulticastEvent
	,	DataItem = imports.Data.DataItem
	,	UIControl = imports.SpliceJS.UI.UIControl
	,	DefineComponents = imports.Component.DefineComponents
	;

	
	var components = DefineComponents(scope);
	
	/**
	 * Drop down list
	 * */
	var DropDownListController = Class(function DropDownListController(args){
		this.base();

		Events.attach(this,{
			onDropDown 		: MulticastEvent,
			onListData 		: MulticastEvent,
			onDataItem 		: MulticastEvent,
			onItemSelected: MulticastEvent,
		});

		this.selectedItemPath = null;

	}).extend(UIControl);


	DropDownListController.prototype.onDataItemChanged = function(item){

	};

	DropDownListController.prototype.initialize = function(){
		this.onDataItem.subscribe(function(item){
			this.children.selector.close();
		},this);

		if(this.defaultSelectedItem){
			this.children.selector.dataIn(new DataItem(this.defaultSelectedItem));
		}

	};



	/**
		Override onDataIn handler to avoid calling onDataOut event
		DropDownList calls onDataOut event explicitry when
		drop-down function is activated
	*/
	DropDownListController.prototype.onDataIn = function(item){
	}

	DropDownListController.prototype.dropDown = function(){
		if(this.dataItem) {
			this.onDataOut(this.dataItem);
		}
		this.onDropDown();
	}

	DropDownListController.prototype.listItemSelected = function(item){
		this.children.selector.dataIn(item);
		this.children.selector.close();
		this.onItemSelected(item);
	}


	DropDownListController.prototype.setSelectedItem = function(item){
		this.children.selector.dataPath = this.selectedItemPath;
		this.children.selector.dataIn(item);
	};


	/* scope exports for component consumption*/
	scope.add(
		DropDownListController
	);

	/* module exports */
	scope.exports(
		DropDownListController
	);

}});
