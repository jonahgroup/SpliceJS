/* global _sjs */
/* global SpliceJS */
_.Module({
	
	required:[
		{'SpliceJS.UI':_.home('modules/splice.ui.js')},
		{'SpliceJS.Controls':_.home('modules/splice.controls/splice.controls.buttons.js')},
		{'SpliceJS.Controls':_.home('modules/splice.controls/splice.controls.datatable.js')},
		{'SpliceJS.Controls':_.home('modules/splice.controls/splice.controls.controllers.js')},
		
		'sample.css',
		'sample.html'
	],
	definition:function(){
		
		var Component 	= this.framework.Component
		,	Class 		= this.framework.Class
		,	Event 		= this.framework.Event
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
					_.HttpRequest.get({
						url:_.absPath('DataTable/application/src/data/dataApr-2-2015.json'),
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
		
		SampleComponent.prototype.onSampleData  = Event;
		SampleComponent.prototype.onNextPage 	= Event;
		SampleComponent.prototype.onPrevPage 	= Event;
		SampleComponent.prototype.onFilterData  = Event.transform(function(args){
			return args.value;
		}); //having event argument transformer
		
		
		SampleComponent.prototype.onClearFilter = Event.transform(function(){
			return '';	
		});
		
		function notifyData(){
			var cols = this.columns;
			var data = this.data;
			this.onSampleData({data : data,	headers : cols });	
		}
		
		
		SampleComponent.prototype.selectPageStyle = function(args){
			if(args == this.currentPage )
				return 'selected';
			return null;	
		};
		
		
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