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
		left:30,top:20, right:10, bottom:20
	};


	var Chart = _.Namespace('SpliceJS.Controls').Class(function Chart(){
		SpliceJS.Controls.D3Canvas.call(this);	//call parent constructor

		var self = this
		,	width = this.width
		,	height = this.height



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


		/*
			dimensions are only valid when element is 
			attached the DOM tree
			of the outermost container
		*/

		if(!this.width) this.width = this.elements.controlContainer.clientWidth;
		if(!this.height) this.height = this.elements.controlContainer.clientHeight;


		this.reflow(this.width, this.height);
		
		
	}


	Chart.prototype.reflow = function(width, height){
		

		this.width = this.elements.controlContainer.clientWidth;
		this.height = this.elements.controlContainer.clientHeight;

		if(this.width <= 0) return;
		if(this.height <= 0) return;

		//var s = this.elements.controlContainer.style;		
		
		////s.width = width + 'px';
		//s.height = height + 'px';
		
		this.svg.attr('width',this.width).attr('height',this.height);
		this.render(this.d3);

	};


	Chart.prototype.measureData = function(d3){
		

		this.dM.max = d3.max(_.data(this.dataItem).to(function(item){
			return d3.max(item.data)
		}).result);


		this.dM.count = d3.max(_.data(this.dataItem).to(function(item){
			return item.data.length;
		}).result);


	

		_.debug.log('Max ' + this.dM.max);
		_.debug.log('Count ' + this.dM.count);
		
	}



	Chart.prototype.render = function(d3){
		if(!this.dataItem) return;

		
		var width = this.width - CHART_MARGIN.left - CHART_MARGIN.right;
		var height = this.height - CHART_MARGIN.top - CHART_MARGIN.bottom;


        /* !!!!! UGLY PATCH, REWORK the reflowing framework */
		if(width <= 0) return;
		if(height <= 0) return;

		/* 
			set scales
			all plots use same scale
		*/
		var y = d3.scale.linear()
		    .domain([0, this.dM.max])
		    .range([height, 0]);

	
		var x = d3.scale.ordinal()
			.domain(_.data(this.dM.count).to().result)
    		.rangeRoundBands([0, width]);

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
				{	id:d.name, 
					dataItem : d.data, 
					showPoints:d.showPoints, 
					pointSize:d.pointSize,
					svg : d3.select(this), 
					scale:{x,y}, 
					width:width, 
					height:height}
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

		if(!c) throw 'Unable to locate component:' + c; 

		return c;
	}




//end definition
}});