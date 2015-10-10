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
	,		Event = sjs.Event
	,		debug = this.sjs.debug
	, 	components = this.scope.components;

	var	UIControl = this.scope.SpliceJS.UI.UIControl
	,		dom = this.scope.Doc.dom;

	var ListBoxController = Class.extend(UIControl)(function ListBoxController(){
			this.super();
			this.dom = null;

			this.listItems = [];

			if(this.ref.contentClient) {
				this.dom = dom(this.ref.contentClient.concrete.dom);
			}
			else {
				this.dom = dom(this.elements.root);
			}

			if(!this.itemTemplate) this.itemTemplate = DefaultListItem;

			Event.attach(this.concrete.dom, `onclick`).subscribe(this.click, this);
	});

	ListBoxController.prototype.onListItem = Event;
	ListBoxController.prototype.onDataItem = Event;

	ListBoxController.prototype.click = function(args){
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


	ListBoxController.prototype.dataIn = function(dataItem){
		this.dataItem = dataItem;
		this.dom.clear();

		var item = null;

		for(var i=0; i<dataItem.length; i++) {
			if(this.itemTemplate) {
				item = new this.itemTemplate({parent:this});
				this.listItems.push(item);

				if(this.dataPath){
					item.dataIn(sjs.propvalue(this.dataItem[i],this.dataPath));
				} else {
					item.dataIn(this.dataItem[i]);
				}

				item.concrete.dom.__sjs_item_index__ = i;


				this.dom.append(dom(item.concrete.dom));
				if(typeof item.onAttached == 'function')
					item.onAttached();

			}
		}

		this.reflow();

	};

	ListBoxController.prototype.reflow = function(){
		if(!this.ref.scrollPanel) return;

		this.ref.scrollPanel.reflow();

	};

	var DefaultListItem = Class(function DefaultListItem(){
			this.concrete =  {
				dom : document.createElement('div')
			};

			this.concrete.dom.className = '-sjs-listbox-item';
	});

	DefaultListItem.prototype.dataIn = function(dataItem){
		if(!dataItem) return;
		this.concrete.dom.innerHTML = dataItem.toString();
	};




	var ListItemController = Class.extend(UIControl)(function ListItemController(args){
		this.super(args);

		var self = this;
		this.concrete.dom.onclick = function(){
			if(typeof self.onClick === 'function' )
				self.onClick(self.dataItem);
		};

	});


	ListItemController.prototype.dataIn = function(dataItem){
		this.dataItem = dataItem;
		this.concrete.applyContent(dataItem);
		this.dataOut(dataItem);
	};




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

		//if(!args) args = [];

		if(args.isScrollable)
			return new components.ScrollableListBox(args);
		else
			return new components.StretchListBox(args);
	});


	//exporting objects
	return {
		ListItemController:	ListItemController,
		ListBox: ListBox
	}

}


});
