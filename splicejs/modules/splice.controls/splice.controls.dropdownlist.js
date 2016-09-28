$js.module({
/*
	DropdownList control 
*/
prerequisite:[
	'/{$jshome}/modules/splice.module.extensions.js'
],
imports:[
	{ Inheritance : '/{$jshome}/modules/splice.inheritance.js'},
	{ Data: '/{$jshome}/modules/splice.dataitem.js'},
	{ Events: '/{$jshome}/modules/splice.event.js'},
	{ Component: '/{$jshome}/modules/splice.component.core.js'},
	{'SpliceJS.UI':'../splice.ui.js'},
	{'SpliceJS.Controls':'splice.controls.selectors.js'},
	{'SpliceJS.Controls':'splice.controls.listbox.js'},
	'splice.controls.dropdownlist.html'
],
definition:function(){
	"use strict";

	var scope = this
	,	imports = scope.imports;

	var sjs = scope.imports.$js
	,	log = scope.imports.$js.log;

	var	Class = imports.Inheritance.Class
	,	Events = imports.Events
	, 	MulticastEvent = imports.Events.MulticastEvent
	,	DataItem = imports.Data.DataItem
	,	UIControl = imports.SpliceJS.UI.UIControl
	,	Component = imports.Component
	;

	/*
		generate components based on template declaration
		within template files .html
	*/
	var components = Component.defineComponents(scope);
	
	/**
	 * DropDownList
	 * sjs-include parameters are passed as constructor arguments
	 * */
	var DropDownListController = Class(function DropDownListController(args){
		this.base();

		Events.attach(this,{
			onDropDown 		: MulticastEvent,
			onListData 		: MulticastEvent,
			onDataItem 		: MulticastEvent,
			onItemSelected	: MulticastEvent
		});
		
		this.selectedItemPath = null;
	
		
		this.selectorItemTemplate = args.selectorItemTemplate;
		this.listItemPath = args.listItemPath;

	}).extend(UIControl);


	DropDownListController.prototype.onDataItemChanged = function(item){
		log.info('DropDownListController: DataItem changed');	
	};

	DropDownListController.prototype.initialize = function(){
		this.onDataItem.subscribe(function(item){
			this.children.selector.close();
		},this);

		if(this.selectorItemTemplate){
			this.children.selector.setItemTemplate(this.selectorItemTemplate);
		}

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
		this.children.selector.dataIn(item.path(this.selectedItemPath));
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
