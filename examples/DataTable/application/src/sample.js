/* global _sjs */
/* global SpliceJS */
sjs({
	
	required:[
		{'SpliceJS.UI': 	  '{sjshome}/modules/splice.ui.js'},
		{'SpliceJS.Controls': '{sjshome}/modules/splice.controls/splice.controls.buttons.js'},
		{'SpliceJS.Controls': '{sjshome}/modules/splice.controls/splice.controls.datatable.js'},
		{'SpliceJS.Controls': '{sjshome}/modules/splice.controls/splice.controls.controllers.js'},
		{'Data':'{sjshome}/modules/splice.data.js'},
		'sample.css',
		'sample.html'
	],
	definition:function(){
		
		var Component 	= this.framework.Component
		,	Class 		= this.framework.Class
		,	Event 		= this.framework.Event
		,	HttpRequest = this.framework.HttpRequest
		,	absPath 	= this.framework.absPath 
		,	mixin 		= this.framework.mixin
		,	UIControl 	= this.SpliceJS.UI.UIControl
		,	TextField	= this.SpliceJS.Controls.TextField;

		
		// move extend to the top
		// present with sematically correct naming
		// crash detection and recovery
		// what does react do?
		var SampleComponent = Component('Sample')(			
			
			function SampleController(){
				
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
		).extend(UIControl);
		
		
		mixin(SampleComponent.prototype, {
		
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
		
		
		Class(function SearchTextField(){
			TextField.call(this);
			//event filter?
			this.onKeyUp.argumentFilter = function(args){
				if(args.e.keyCode == 27) return false;
				return true;
			};
		}).extend(TextField);
		
		
		return {
			Sample:SampleComponent
		}
	}
});