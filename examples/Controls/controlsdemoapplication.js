sjs({
	
required:[
	{'SpliceJS.Controls': '{$jshome}/modules/splice.controls.js'},
	{'Data': '{$jshome}/modules/splice.data.js'},
	 'controlsdemoapplication.css',
	 'controlsdemoapplication.html',
		
],

definition: function(){


	var Component = this.framework.Component
	,	Class = this.framework.Class
	,	Event = this.framework.Event
	,	debug = this.framework.debug
	,	scope = this
	,	data  = this.Data.data;

	var UIControl = this.SpliceJS.Controls.UIControl;


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
    ]

	};

	var sampleTableData = {
			headers: sampleChartData.labels,
			data: data(sampleChartData.datasets).to(function(k,v){
				var val = data(v.data).to().result;
				return val;
			}).result,
	}


	var ControlsDemoApplication = Component('ControlsDemoApplication')(
	function ControlsDemoApplication(){
		UIControl.call(this);
		
		this.sampleListData = [
			{name:'John Sample', number:'555-2324-1234'},
			{name:'Susan Sample', number:'555-2324-1234'}
		];

		for(var i=0; i<100; i++){
			this.sampleListData.push({name:'test ' + i, number:'234-12312-1234'});
		}

		this.currentView = 0;
		this.currentView2 = 0;

		this.onDisplay.subscribeAsync(this.display, this);
		
		this.onButtonClicked.subscribeAsync(function(args){
			console.log(args);
		});
	
	}).extend(UIControl);




	ControlsDemoApplication.prototype.onListData   = Event;
	ControlsDemoApplication.prototype.onSampleData = Event;
	ControlsDemoApplication.prototype.onChartData  = Event;
	ControlsDemoApplication.prototype.onFlipViews  = Event;
	ControlsDemoApplication.prototype.onButtonClicked = Event.transform(function(args){
		return 'ha';
	}); 	

	ControlsDemoApplication.prototype.buttonClicked = function(){
		debug.log('Button clicked HAHA');
	}


	ControlsDemoApplication.prototype.randomizeGraphs = function(){
		var data = [[],[]];

		var count = Math.floor(Math.random()*10)+5;

		for(var i=0; i < count; i++){
			data[0].push(Math.floor(Math.random()*100));	
		}

		for(var i=0; i < count; i++){
			data[1].push(Math.floor(Math.random()*100));	
		}

		this.onChartData( [
			{plot:'Bar',data:data[0]}, 
			{plot:'Line', showPoints: true, pointSize:3, data:data[1]}
		]);
	}


	ControlsDemoApplication.prototype.display = function(){
		if(this.ref.scrollPanel) {
			this.ref.scrollPanel.reflow();
		}


		this.onListData(this.sampleListData);
		
		//this.onChartData(sampleChartData.datasets[0].data);

		this.onSampleData(sampleTableData);

	};


	ControlsDemoApplication.prototype.flipView = function(){
		this.currentView2++;
		this.onFlipViews(this.currentView2 % 2);
	}


	ControlsDemoApplication.prototype.switchView = function(){
		
		this.currentView++;
		
		this.ref.viewPanel.switchView(this.currentView % 2);
		
	};


	ControlsDemoApplication.prototype.listItemSelected = function(item){
		debug.log(item);
	};


	return {
		DemoApplication 	: 	ControlsDemoApplication,
		CrazyApplication	:	scope.templates['CrazyApplication']
	}
}

});