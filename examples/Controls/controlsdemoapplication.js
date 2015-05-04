_.Module({
	
required:[
	_.home('modules/splice.controls.js'),
		   'controlsdemoapplication.css',
		   'controlsdemoapplication.htmlt'
],

definition:function(){


	var ControlsDemoApplication = _.Namespace('UserApplications').Class(function ControlsDemoApplication(){
		this.sampleListData = [
			{name:'John Sample', number:'555-2324-1234'},
			{name:'Susan Sample', number:'555-2324-1234'}
		];

		for(var i=0; i<100; i++){
			this.sampleListData.push({name:'test ' + i, number:'234-12312-1234'});
		}

		this.currentView = 0;

	}).extend(SpliceJS.Controls.UIControl);

	ControlsDemoApplication.prototype.listData = new _.Multicaster();

	ControlsDemoApplication.prototype.onDisplay = function(){

		SpliceJS.Controls.UIControl.prototype.onDisplay.call(this);

		this.ref.scrollPanel.reflow();

		this.listData(this.sampleListData);
		//this.ref.map.onDisplay();
	};


	ControlsDemoApplication.prototype.switchView = function(){
		
		this.currentView++;
		
		this.ref.viewPanel.switchView(this.currentView % 2);
	};


	ControlsDemoApplication.prototype.listItemSelected = function(item){
		_.debug.log(item);
	};


}});