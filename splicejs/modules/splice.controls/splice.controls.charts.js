_.Module({

required:[

	_.home('modules/splice.data.js'),
	'splice.controls.d3canvas.js',
	'splice.controls.charts.html',
	'splice.controls.charts.css',
	'charts/splice.controls.charts.dial.js',
	'charts/splice.controls.charts.barchart.js',
	'charts/splice.controls.charts.linechart.js'

],

definition:function(){

	var scope = this;


	var CHART_MAP = {
		Bar:'SpliceJS.Controls.Charts.BarChart',
		Line:'SpliceJS.Controls.Charts.LineChart'
	};


	var CHART_MARGIN = {
		left:30,top:10, right:10, bottom:20
	};


	var Chart = _.Namespace('SpliceJS.Controls').Class(function Chart(){
		SpliceJS.Controls.D3Canvas.call(this);	//call parent constructor

		var self = this
		,	width = this.width
		,	height = this.height

		/*
			dimensions of the outermost container
		*/
		this.width 	= width = !width ? 400 : width;
		this.height = height = !height ? 300 : height;


		/*
			chart area dimensions		
		*/
		
		this.chartWidth = this.width - CHART_MARGIN.left - CHART_MARGIN.right;
		this.chartHeight = this.height - CHART_MARGIN.top - CHART_MARGIN.bottom; 


		this.dM = {};	//data measures

		//this.d3 is inherited from the parent SpliceJS.Controls.D3Canvas
		this.onDataIn.subscribe(function(){

			this.measureData(this.d3);
			this.render(this.d3);
		
		}, this);
		

		//subscribe to onAttach event, update chat dimensions
		this.onAttach.subscribe(this.attach, this);

	}).extend(SpliceJS.Controls.D3Canvas);


	Chart.prototype.attach = function(){

		//single svg node per chart
		this.svg = this.d3.select().append('svg')


		this.hAxis = this.svg.append('g').attr('class','horizontal-axis');
		this.vAxis = this.svg.append('g').attr('class','vertical-axis');

		this.chartArea = this.svg.append('g').attr('class','chart-area');

		this.reflow(this.width, this.height);
	}


	Chart.prototype.reflow = function(width, height){

		var s = this.elements.controlContainer.style;

		s.width = width + 'px';
		s.height = height + 'px';
		
		this.svg.attr('width',width).attr('height',height);

	};


	Chart.prototype.measureData = function(d3){
		

		this.dM.max = d3.max(_.data(this.dataItem).toArray(function(item){
			return d3.max(item.data)
		}).result);


		this.dM.count = d3.max(_.data(this.dataItem).toArray(function(item){
			return item.data.length;
		}).result);


	

		_.debug.log('Max ' + this.dM.max);
		_.debug.log('Count ' + this.dM.count);
		
	}



	Chart.prototype.render = function(d3){
		if(!this.dataItem) return;

		
		var width = this.chartWidth;
		var height = this.chartHeight;


		/* 
			set scales
			all plots use same scale
		*/
		var x = d3.scale.linear()
		    .domain([0, this.dM.max])
		    .range([0, width]);

		var y = d3.scale
			.linear()
			.domain([0,  this.dM.count])
    		.range([height, 0]);

    	/*
			draw axis x, y
		
    	*/
    	var xAxis = d3.svg.axis()
    				.scale(x)
    				.orient("bottom");		  

	   	var yAxis = d3.svg.axis()
    				.scale(y)
    				.ticks(5)
    				.orient("left");	


    	/* translate charting area to allow margin*/
    	this.chartArea.attr('width',width)
    	.			   attr('height', height)
    	.			   attr('transform','translate('+ CHART_MARGIN.left +','+ CHART_MARGIN.top +')');			


    	// select chart nodes and axis nodes			
		var self = this
		,	g = this.chartArea.selectAll('g[sjs-index]').data(this.dataItem);
		

		//new series
		g.enter().append('g')
		.  		  attr("sjs-index", function(d,i){return i;});
		;


		// remote old ones
		g.exit().remove();



		/* 
			update existing series
			note: initial data selection 'g' above
			is updated, and at this point below will 
			contain a merge quantity of new and existing items
		*/
		
		g.each(function(d,i){

			chartModule(d.plot).prototype.render.call(
				{dataItem : d.data, svg : d3.select(this), width:width, height:height}
				,d3
			);

		});	
		
		/*
			Draw axis
		*/
		this.hAxis.attr('transform', 'translate('+ CHART_MARGIN.left+',' + (height + CHART_MARGIN.top) + ')').call(xAxis);
		this.vAxis.attr('width',20).attr('transform', 'translate('+ 20 +',' + CHART_MARGIN.top + ')').call(yAxis);
	}; 


	function chartModule(ct){
		if(!ct) throw 'Invalid chart type, data set must include chart type : ' + ct
		
		if(!CHART_MAP[ct]) throw 'Unable to locate component class for chart:' + ct; 	

		var c = _.Namespace.lookup(CHART_MAP[ct]);

		if(!c) throw 'Unable to locate component:' + cc; 

		return c;
	}




//end definition
}});