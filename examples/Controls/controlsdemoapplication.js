_.Module({
	
required:[
	'modules/splice.controls.js',
	'../examples/Controls/controlsdemoapplication.htmlt'
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

	});

	ControlsDemoApplication.prototype.onDisplay = function(){

		this.ref.scrollPanel.reflow();
		this.listData(this.sampleListData);
	};



}});