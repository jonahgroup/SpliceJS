_.Module({

required:[
	'myapplication.css',
	'myapplication.htmlt'
],

definition:function(){

	var scope = this;

	var MyApplication = _.Namespace('UserApplications').Class(
		function MyApplication(){
			this.sampleListData = [
				{name:'John Sample', number:'555-2324-1234'},
				{name:'Susan Sample', number:'555-2324-1234'}
			];

			for(var i=0; i<20; i++){
				this.sampleListData.push({name:'test ' + i, number:'234-12312-1234'});
			}


			this.mainMenuData = [
				{name:'Locations',  icon:_.home('img/white/location64.png',scope.path)},
				{name:'Map', 		icon:_.home('img/white/map64.png',scope.path)},
				{name:'Notes',		icon:_.home('img/white/pen64.png',scope.path)},
				{name:'Voice',		icon:_.home('img/white/voice64.png',scope.path)},
				{name:'Photo',		icon:_.home('img/white/camera64.png',scope.path)},
				{name:'Video',		icon:_.home('img/white/video64.png',scope.path)},
				{name:'Settings',	icon:_.home('img/white/settings64.png',scope.path)}
			];

			/* build view map */
			this.viewMap = [];
			for(var i=0; i<this.ref.drawer.ref.viewPanel.views.length; i++){
				this.viewMap[this.ref.drawer.ref.viewPanel.views[i].key] = i;
			}
		}
	).extend(SpliceJS.Controls.UIControl);



	MyApplication.prototype.onDisplay = function(){
		SpliceJS.Controls.UIControl.prototype.onDisplay.call(this);
		this.listData(this.mainMenuData);
	};


	MyApplication.prototype.menuItemSelected = function(item){
		this.ref.drawer.activateDrawer();

		var i = this.viewMap[item.name];
		if(i >=0 ) this.ref.drawer.ref.viewPanel.switchView(i);

	};

}
});