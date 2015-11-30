sjs({

required:[
	{'SpliceJS.UI':'../splice.ui.js'},
	{'SpliceJS.Controls':'splice.controls.scrollpanel.js'},
	{'Doc':'{sjshome}/modules/splice.document.js'},
	'splice.controls.listbox.css',
	'splice.controls.listbox.html'
],

definition:function(sjs){


	var Class = this.sjs.Class
	,		event = sjs.event
	,		exports = sjs.exports
	,		debug = this.sjs.debug
	, 	components = this.scope.components;

	var	UIControl = this.scope.SpliceJS.UI.UIControl
	,		dom = this.scope.Doc.dom;

	var ListBoxController = Class(function ListBoxController(){
			this.super();
			this.listItems = [];

			event(this).attach({
				onListItem : event.multicast,
				onDataItem : event.multicast,
				onResize   : event.multicast
			});
	}).extend(UIControl);


	ListBoxController.prototype.initialize = function(){
			event(this.views.root).attach({	onmousedown	:	event.unicast.stop	})
			.onmousedown.subscribe(_itemClick,this);

			if(this.ref.contentClient) {
				this.dom = this.ref.contentClient.views.root;
			}
			else {
				this.dom = this.views.root;
			}

			if(!this.itemTemplate) this.itemTemplate = DefaultListItem;
	};

	/**
		Private
	*/
	function _itemClick(args){
		var parent = args.source;
		while(parent){
			if(parent.__sjs_item_index__ != null) break;
			parent = parent.parentNode;
		}
		//no data item index found
		if(parent == null) return;

		var idx = parent.__sjs_item_index__;
		console.log(this.dataItem[idx]);

		//notify list items listener
		this.onListItem(this.listItems[idx]);

		//notify on data item
		this.onDataItem(this.dataItem[idx]);
	};


	ListBoxController.prototype.onDataIn = function(inData){
		var dataItem = inData.getValue()
		, item = null;

		// update existing items if any
		for(var i=0; i<this.listItems.length; i++){
			var item = this.listItems[i];

			if(this.dataPath){
				item.dataIn(sjs.propvalue(this.dataItem[i])(this.dataPath).value);
			} else {
				item.dataIn(this.dataItem,i);
			}
		}

		// add new items
		for(var i= this.listItems.length; i<dataItem.length; i++) {
			if(this.itemTemplate) {
				item = new this.itemTemplate({parent:this});
				this.listItems.push(item);

				item.dataIn(this.dataItem,i);
				item.views.root.htmlElement.__sjs_item_index__ = i;

				this.dom.content(item.views.root).add();
				if(typeof item.onAttached == 'function')
					item.onAttached();
			}
		}

		this.reflow();
		if(!this.ref.scrollPanel) this.onResize(this);
	};

	ListBoxController.prototype.reflow = function(){
		if(!this.ref.scrollPanel) return;
		this.ref.scrollPanel.reflow();
	};




	var DefaultListItem = Class(function DefaultListItem(){
		this.views = {
			root: sjs.view('<div sjs-content="default"></div>').class('-sjs-listbox-item').add()
		}
	});

	DefaultListItem.prototype.dataIn = function(item, path){
		if(!item) return;
		this.views.root.content(item.getValue()[path]).replace();
	};



  /**
		Container controller
	*/
	var ListItemController = Class(function ListItemController(args){
		this.super(args);

		var self = this;
/*
		this.concrete.dom.onclick = function(){
			if(typeof self.onClick === 'function' )
				self.onClick(self.dataItem);
		};
*/
	}).extend(UIControl);

	ListItemController.prototype.initialize = function(){
		this.views.root.class('-sjs-listbox-item').add();
	};


	ListItemController.prototype.onDataIn = function(item){
		if(!item) return;
		this.views.root.content(item.getValue()).replace();
		// call parent implementation of dataIn
		this.onDataOut(item);
	};



	/**
		Grouped List Item
	*/
	var GroupedListItem = Class(function GroupedListItem(args){
		this.groupInstance = null;
		this.itemInstances = [];
	});

	GroupedListItem.prototype.dataIn = function(dataItem){

		if(!this.groupInstance) {
			if(this.groupTemplate) {
				this.groupInstance = new this.groupTemplate({parent:this});
				Doc.$(this.elements.root).embed(this.groupInstance);
			}
		}

		if(this.groupInstance) this.groupInstance.dataIn(dataItem);


		if(this.itemInstances.length < 1) {
			if(dataItem.children) {
			for(var i=0; i<dataItem.children.length; i++){
				var item = new this.groupItemTemplate({parent:this});
				item.dataIn(dataItem.children[i]);
				this.itemInstances.push(item);
				this.elements.root.appendChild(item.concrete.dom);
			}}
		}

	};

	// list factory
	var ListBox = Class(function ListBox(args){

		if(args.isScrollable)
			return new components.ScrollableListBox(args);
		else
			return new components.StretchListBox(args);
	});



	exports.scope(
		ListBoxController
	);

	//exporting objects
	exports.module(
		ListItemController, ListBoxController, ListBox
	);

}


});
