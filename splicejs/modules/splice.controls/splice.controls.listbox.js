sjs({

required:[ 
	{'SpliceJS.UI':'../splice.ui.js'},
	{'SpliceJS.Controls':'splice.controls.scrollpanel.js'},
	'splice.controls.listbox.css',
	'splice.controls.listbox.html'
],

definition:function(){

	
	var Class = this.Class
	,	debug = this.debug
	,	scope = this.scope
	, 	components = this.scope.components;
	
	var	UIControl = this.scope.SpliceJS.UI.UIControl

	

	var ListBox = Class(function ListBox(args){

		if(!args) args = [];

		if(args.isScrollable)
			return new components.ScrollableListBox(args);	
		else 
			return new components.StretchListBox(args);
	});


	var ScrollableListBox = Class.extend(UIControl)(function ScrollableListBox(){
			this.super();
			
			this.scrollPanel 	= this.ref.scrollPanel;
			this.contentClient 	= this.ref.scrollPanel.ref.contentClient;	 
		}
	);

	ScrollableListBox.prototype.dataIn = function(dataItem){
		this.dataItem = dataItem;
		this.contentClient.concrete.dom.innerHTML = '';

		var item = null;
		
		for(var i=0; i<dataItem.length; i++) {
			if(this.itemTemplate) {
				item = new this.itemTemplate({parent:this});
				item.dataIn(this.dataItem[i]);
				
				if(this.contentClient){
					this.contentClient.concrete.dom.appendChild(item.concrete.dom);
					if(typeof item.onAttached == 'function') 
						item.onAttached();
				}
			}
		}

		this.reflow();
		
	};

	ScrollableListBox.prototype.reflow = function(){
		this.ref.scrollPanel.reflow();
	};

	var StretchListBox = Class(function StretchListBox(){});


	var ListItem = Class.extend(UIControl)(function ListItem(args){
		this.super(args);
	
		var self = this;
		this.concrete.dom.onclick = function(){
			if(typeof self.onClick === 'function' )
				self.onClick(self.dataItem);
		};

	});


	ListItem.prototype.dataIn = function(dataItem){
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

	//exporting objects
	return {
		ListBox:			ListBox,
		controllers: {
			ScrollableListBox:	ScrollableListBox,
			StretchListBox:		StretchListBox,
			ListItem:			ListItem,
			GroupedListItem:	GroupedListItem
		}
	}

}


});