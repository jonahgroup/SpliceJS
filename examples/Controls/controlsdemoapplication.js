_.Module({
	
required:[
	_.home('modules/splice.controls.js'),
		   'controlsdemoapplication.css',
		   'controlsdemoapplication.htmlt'
],

definition:function(){


	var sampleChartData = {
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [
        {
            label: "My First dataset",
            data: [65, 59, 80, 81, 56, 55, 40]
        },
        {
            label: "My Second dataset",
            fillColor: "rgba(151,187,205,0.2)",
            strokeColor: "rgba(151,187,205,1)",
            pointColor: "rgba(151,187,205,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(151,187,205,1)",
            data: [28, 48, 40, 19, 86, 27, 90]
        }
    ],

    styling: [

    ]
};

	var sampleTableData = {
			headers: sampleChartData.labels,
			data: _.data(sampleChartData.datasets).toArray(function(item){
				var v = _.data(item.value.data).toArray().result;
				v.splice(0,0,item.value.label);
				return v;
			}).result,
	}



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


	ControlsDemoApplication.prototype.listData 	= new _.Multicaster();
	ControlsDemoApplication.prototype.chartData = new _.Multicaster();


	ControlsDemoApplication.prototype.onDisplay = function(){

		SpliceJS.Controls.UIControl.prototype.onDisplay.call(this);

		this.ref.scrollPanel.reflow();

		this.listData(this.sampleListData);
		
		this.chartData(sampleChartData);

		this.sampleData(sampleTableData);
	};


	ControlsDemoApplication.prototype.switchView = function(){
		
		this.currentView++;
		
		this.ref.viewPanel.switchView(this.currentView % 2);
	};


	ControlsDemoApplication.prototype.listItemSelected = function(item){
		_.debug.log(item);
	};


}});