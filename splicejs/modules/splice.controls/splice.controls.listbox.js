$js.module({
prerequisite:[
	'/{$jshome}/modules/splice.module.extensions.js'
],
imports:[
	{ Inheritance: 	'/{$jshome}/modules/splice.inheritance.js'},
	{ Events: 		'/{$jshome}/modules/splice.event.js'},
	{ Views: 		'/{$jshome}/modules/splice.view.js'},
  	{ Async: 		'/{$jshome}/modules/splice.async.js'},
	{ Component:	'/{$jshome}/modules/splice.component.core.js'},	
	{'SpliceJS.UI':'../splice.ui.js'},
	{'SpliceJS.Controls':'splice.controls.scrollpanel.js'},
	{'Doc':'/{$jshome}/modules/splice.document.js'},
	'splice.controls.listbox.css',
	'splice.controls.listbox.html'
]
,
definition:function(){
	"use strict";

	var scope = this
	,	sjs = this.imports.$js;

	var	log = sjs.log
	,	debug =	sjs.log.debug
	,	components = scope.components
	, 	imports = scope.imports
  	;

	var	UIControl   = imports.SpliceJS.UI.UIControl
	,	DataItem    = imports.SpliceJS.UI.DataItem
	, 	Class       = imports.Inheritance.Class
  	, 	asyncLoop   = imports.Async.asyncLoop
	,	dom         = imports.Doc.dom
	,	View        = imports.Views.View
	, 	Views 		= imports.Views
	,	Events = imports.Events
	, 	MulticastEvent = imports.Events.MulticastEvent
	, 	DomMulticastEvent = imports.Views.DomMulticastEvent
	, 	Component = imports.Component
	;


	//define components
	var components = Component.defineComponents(scope);


	var ListBoxController = Class(function ListBoxController(args){
		this.base();
		this.listItems = [];

		Events.attach(this,{
			onListItem : MulticastEvent,
			onDataItem : MulticastEvent,
			onResize   : MulticastEvent
		});
	}).extend(UIControl);


	ListBoxController.prototype.initialize = function(){
		Events.attach(this.views.root, {
			onmousedown	:	Views.DomMulticastStopEvent
		}).onmousedown.subscribe(_itemClick,this);

		if(this.children.contentClient) {
			this.dom = this.children.contentClient.views.root;
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
		this.onDataItem(this.dataItem.path(idx));
	};


	ListBoxController.prototype.dataItemChanged = function(item){
		var i = item.fullPath().split('.')[0];
		var di = null;
		if(this.listItemPath)
			di = this.dataItem.path(i+'.'+this.listItemPath);
		else
			di = this.dataItem.path(i);

		if(this.listItems[i]) {
			this.listItems[i].dataIn(di);
		} else {
			var item = new this.itemTemplate({parent:this});
			this.listItems.push(item);
			item.dataIn(di);

			item.views.root.htmlElement.__sjs_item_index__ = i;
			this.dom.add(item.views.root);
			if(typeof item.onAttached == 'function')
				item.onAttached();

		}
	};

	ListBoxController.prototype.onDataIn = function(dataItem){
		var list = dataItem.getValue()
		, item = null;

        //check changes
        dataItem.changes(
            function(){},
            function(item){
                log.log('List item change' + item._path);
            },
            function(){}
       );


		// update existing items if any
		for(var i=0; i<this.listItems.length; i++){
			var item = this.listItems[i];
			 if(this.listItemPath)
 			 	item.dataIn(dataItem.path(i+'.'+this.listItemPath));
 			 else
 			 	item.dataIn(dataItem.path(i));
		}

		// add new items
		asyncLoop(this.listItems.length,list.length-1,100,function(i){
        if(this.itemTemplate) {
				item = new this.itemTemplate({parent:this});
				this.listItems.push(item);

				var itm = null;

				if(this.listItemPath)
				 itm = dataItem.path(i+'.'+this.listItemPath);
				else
				 itm = dataItem.path(i);

				 item.dataIn(itm);

				item.views.root.htmlElement.__sjs_item_index__ = i;
				this.dom.add(item.views.root);
				if(typeof item.onAttached == 'function')
					item.onAttached();
			    return true;
            }
        }.bind(this));


        /*
        for(var i= this.listItems.length; i<list.length; i++) {
			if(this.itemTemplate) {
				item = new this.itemTemplate({parent:this});
				this.listItems.push(item);

				if(this.listItemPath)
				 item.dataIn(dataItem.path(i+'.'+this.listItemPath));
				else
				 item.dataIn(dataItem.path(i));

				item.views.root.htmlElement.__sjs_item_index__ = i;
				this.dom.add(item.views.root);
				if(typeof item.onAttached == 'function')
					item.onAttached();
			}
		}*/

		this.reflow();
		if(!this.children.scrollPanel) this.onResize(this);
	};

	ListBoxController.prototype.reflow = function(){
		if(!this.children.scrollPanel) return;
		this.children.scrollPanel.reflow();
	};




	var DefaultListItem = Class(function DefaultListItem(){
		this.views = {
			root: View('<div sjs-content="default"></div>').cl('-sjs-listbox-item').add()
		}
	});

	DefaultListItem.prototype.dataIn = function(item){
		if(!item) return;
		//call UIControl's implemenration os the dataIn
		UIControl.prototype.dataIn.call(this,item);
	};

	DefaultListItem.prototype.onDataIn = function(item){
		this.views.root.replace(item.getValue());
	}



  /**
		Container controller
	*/
	var ListItemController = Class(function ListItemController(args){
		this.base(args);

		var self = this;
/*
		this.concrete.dom.onclick = function(){
			if(typeof self.onClick === 'function' )
				self.onClick(self.dataItem);
		};
*/
	}).extend(UIControl);

	ListItemController.prototype.initialize = function(){
		this.views.root.cl('-sjs-listbox-item').add();
	};


	ListItemController.prototype.onDataIn = function(item){
		if(!item) return;
		this.content(item.getValue()).replace();
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


	scope.add(
		ListBoxController
	);

	//exporting objects
	scope.exports(
		ListItemController, ListBoxController, ListBox
	);

}


});
