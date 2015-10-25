sjs({

	required:[
		{'SpliceJS.UI':'../splice.ui.js'},
		{'SpliceJS.Controls':'splice.controls.selectors.js'},
		{'SpliceJS.Controls':'splice.controls.listbox.js'},
		'splice.controls.dropdownlist.html'
	],

	definition:function(sjs){

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

		this.onDataIn.subscribe(function(item){
			this.onListData(item);
		},this);

		this.onDataItem.subscribe(function(item){
			this.ref.selector.close();
		},this);

	});

	ListController.prototype.dropDown = function(){
		if(this.dataItem) {
			this.onListData(this.dataItem);
		}
		this.onDropDown();
	};

	ListController.prototype.setSelectedItem = function(item){
		if(this.dataPath){
			this.ref.selector.dataIn(sjs.propvalue(item)(this.dataPath).value);
		} else {
			this.ref.selector.dataIn(item);
		}
	};

	ListController.prototype.onDropDown = Event;
	ListController.prototype.onListData = Event;
	ListController.prototype.onDataItem = Event;


	/* module exports */
	return {
		DropDownListController: ListController
	};

}});
