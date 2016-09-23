/* global sjs */
sjs({
	
	required:[
		{'SpliceJS.UI': 	  '{$jshome}/modules/splice.ui.js'},
		{'SpliceJS.Controls': '{$jshome}/modules/splice.controls/splice.controls.buttons.js'},
		{'SpliceJS.Controls': '{$jshome}/modules/splice.controls/splice.controls.datatable.js'},
		{'SpliceJS.Controls': '{$jshome}/modules/splice.controls/splice.controls.controllers.js'},
		{'Data':'{$jshome}/modules/splice.data.js'},
		'sample.css',
		'sample.html'
	],
	definition:function(sjs){
		
		var scope = this.scope;
		
		var Class 		= sjs.Class
		,	Event 		= sjs.Event
		,	HttpRequest = sjs.HttpRequest
		,	absPath 	= sjs.absPath 
		,	mixin 		= sjs.mixin
		,	UIControl 	= scope.SpliceJS.UI.UIControl
		,	TextField	= scope.SpliceJS.Controls.TextField;

		
		// move extend to the top
		// present with sematically correct naming
		// crash detection and recovery
		// what does react do?
		var SampleController = Class.extend(UIControl)(			
			
			function SampleController(){
				this.super();
				
				this.currentPage = 1;
				
				this.onDisplay.subscribeAsync(function(){
					var self= this;
					HttpRequest.get({
						url: absPath('DataTable/application/src/data/dataApr-2-2015.json'),
						onok:function(data){
							var sourceData = JSON.parse(data.text);
							
							self.columns = sourceData.cols;
							self.data = sourceData.data;
							notifyData.call(self);
						}
					});
				}, this);	
				
				
				this.onClearFilter.subscribe(this.onFilterData,this);
				this.onClearFilter.subscribe(function(){
					this.ref.searchButton.hide();
				},this);
				
				this.onFilterData.subscribe(function(){
					this.ref.searchButton.show();
				},this);
			}
		);
		
		mixin(SampleController.prototype, {
		
			onSampleData  	: Event,
			onNextPage 		: Event,
			onPrevPage 		: Event,
			onFilterData  	: Event.transform(function(args){
								return args.value;
							  }), //having event argument transformer
			onClearFilter 	: Event.transform(function(){
								return '';	
							  }),
		
			selectPageStyle : function(args){
				if(args == this.currentPage ) return 'selected';
				return null;	
			}

		});
		
		
		function notifyData(){
			var cols = this.columns;
			var data = this.data;
			this.onSampleData({data : data,	headers : cols });	
		}
		
		
		Class.extend(TextField)(function SearchTextField(){
			this.super();
			//event filter?
			this.onKeyUp.argumentFilter = function(args){
				if(args.e.keyCode == 27) return false;
				return true;
			};
		});
	}
});