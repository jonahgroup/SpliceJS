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
		,	Event 		= this.framework.Event
		,	UIControl 	= this.SpliceJS.UI.UIControl;
		
		
		// move extend to the top
		// present with sematically correct naming
		// crash detection and recovery
		// what does react do?
		var SampleComponent = Component('Sample')(			
			
			function SampleController(){
				
				this.onDisplay.subscribeAsync(function(){
					var self= this;
					_.HttpRequest.get({
						url:_.absPath('DataTable/application/src/data/dataApr-2-2015.json'),
						onok:function(data){
							var sampleData = JSON.parse(data.text);
							
							var columns = sampleData.cols;
							var data = sampleData.data;
							/*
							_.data(sampleData.data[0]).foreach(function(k,v){
								columns.push(k.toUpperCase());
							});
							
							var data = _.data(sampleData.data).to(function(k,v){
								return _.data(v).to(function(k,v){
									if(v == null || v == undefined) return 'NULL';
									if(typeof v == 'object') return v.toString();
									return v;
								}).result
							}).page(100).next().current;
							*/
							
							
							var tableData = {data : data,	headers : columns /*sampleData.cols*/}
							
							self.onSampleData(tableData);	
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
		SampleComponent.prototype.onFilterData  = Event.transform(function(args){
			return args.value;
		}); //having event argument transformer
		
		
		SampleComponent.prototype.onClearFilter = Event.transform(function(){
			return '';	
		});
		
		
		return {
			Sample:SampleComponent
		}
	}
});