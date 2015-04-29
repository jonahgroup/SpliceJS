_.Module({

required:[
	'myapplication.css',
	'myapplication.htmlt'
],

definition:function(){

	var MyApplication = _.Namespace('UserApplications').Class(
		function MyApplication(){
			this.sampleListData = [
				{name:'John Sample', number:'555-2324-1234'},
				{name:'Susan Sample', number:'555-2324-1234'}
			];

			for(var i=0; i<20; i++){
				this.sampleListData.push({name:'test ' + i, number:'234-12312-1234'});
			}


			this.mainMenuData = [{name:'Locations'},{name:'Map'}];

		}
	).extend(SpliceJS.Controls.UIControl);



	MyApplication.prototype.onDisplay = function(){
		SpliceJS.Controls.UIControl.prototype.onDisplay.call(this);
		this.listData(this.mainMenuData);
	};

}
});