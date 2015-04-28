_.Module({

required:[ 
	'../splice.ui.js',
	'splice.controls.listbox.css',
	'splice.controls.listbox.htmlt'
],

definition:function(){

	var localScope = this;

	var ListBox = _.Namespace('SpliceJS.Controls').Class(function ListBox(args){

		if(!args) args = [];

		if(args.isScrollable)
			args['type'] = 'ScrollableListBox';	
		else 
			args['type'] = 'StretchListBox';

		if(this.ref) args['ref'] = this.ref;
		
		var obj = _.Obj.call(localScope.templates,args);
	
		return new obj();  

	});


	var ScrollableListBox = this.ScrollableListBox = _.Class(
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
				item = new this.itemTemplate();
				item.dataIn(this.dataItem[i]);
				
				if(this.contentClient){
					this.contentClient.concrete.dom.appendChild(item.concrete.dom);
				}
			}
		}

		this.reflow();

		_.debug.log('DataItem' + item);	
	};


	ScrollableListBox.prototype.reflow = function(){
		this.ref.scrollPanel.reflow();
	};


	var StretchListBox = this.StretchListBox = _.Class(
		function StretchListBox(){

			_.debug.log('Creating StretchListBox');
		}
	);



	var ListItem = _.Namespace('SpliceJS.Controls').Class(function ListItem(args){
		SpliceJS.Controls.UIControl.call(this,args);
	}).extend(SpliceJS.Controls.UIControl);


	ListItem.prototype.dataIn = function(dataItem){
		this.concrete.applyContent(dataItem);
		this.dataOut(dataItem);
	};



}


});