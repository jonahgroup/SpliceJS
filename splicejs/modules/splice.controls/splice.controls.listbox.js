_.Module({

required:[ 
	{'SpliceJS.UI':'../splice.ui.js'},
	'splice.controls.listbox.css',
	'splice.controls.listbox.html'
],

definition:function(){

	var scope = this
	,	f = this.framework;
	
	var Obj  = f.Obj
	, 	Class = f.Class
	,	UIControl = this.SpliceJS.UI.UIControl;
	

	var ListBox = Class(function ListBox(args){

		if(!args) args = [];

		if(args.isScrollable)
			args['type'] = 'ScrollableListBox';	
		else 
			args['type'] = 'StretchListBox';

		if(this.ref) args['ref'] = this.ref;
			
		return new (Obj.call(scope,args));  

	});


	var ScrollableListBox = this.ScrollableListBox = Class(
		function ScrollableListBox(){

			_.debug.log('Creating ScrollableListBox');

			this.scrollPanel 	= this.ref.scrollPanel;
			this.contentClient 	= this.ref.scrollPanel.ref.contentClient;	 


		}
	);

	ScrollableListBox.prototype.dataIn = function(dataItem){
		this.dataItem = dataItem;

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

		_.debug.log('DataItem' + item);	
	};


	ScrollableListBox.prototype.reflow = function(){
		this.ref.scrollPanel.reflow();
	};


	var StretchListBox = this.StretchListBox = Class(
		function StretchListBox(){

			_.debug.log('Creating StretchListBox');
		}
	);


	var ListItem = Class(function ListItem(args){
		UIControl.call(this,args);
	
		var self = this;
		this.concrete.dom.onclick = function(){
			if(typeof self.onClick === 'function' )
				self.onClick(self.dataItem);
		};

	}).extend(UIControl);


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
				_.Doc.$(this.elements.controlContainer).embed(this.groupInstance);
			}
		}

		if(this.groupInstance) this.groupInstance.dataIn(dataItem);


		if(this.itemInstances.length < 1) {
			if(dataItem.children) {
			for(var i=0; i<dataItem.children.length; i++){
				var item = new this.groupItemTemplate({parent:this});
				item.dataIn(dataItem.children[i]);
				this.itemInstances.push(item);
				this.elements.controlContainer.appendChild(item.concrete.dom);	
			}}
		}

	};

	//exporting objects
	return {
		ListBox:		ListBox,
		StretchListBox:	StretchListBox,
		ListItem:		ListItem,
		GroupedListItem:GroupedListItem
	}

}


});