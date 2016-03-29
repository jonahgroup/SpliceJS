sjs.module({
type:'component',
required:[
	{ Inheritance : '/{sjshome}/modules/splice.inheritance.js'},
	{ Component		: '/{sjshome}/modules/splice.component.core.js'},
	{ Events			: '/{sjshome}/modules/splice.event.js'},
	{ Data				:	'/{sjshome}/modules/splice.data.js'},
	{'SpliceJS.Controls' : 'splice.controls.d3canvas.js'},
	{Charts 			: 'charts/splice.controls.charts.dial.js'},
	{Charts 			: 'charts/splice.controls.charts.barchart.js'},
	{Charts 			: 'charts/splice.controls.charts.linechart.js'},
	{Charts 			: 'charts/splice.controls.charts.scatterchart.js'},
	'splice.controls.charts.html',
	'splice.controls.charts.css',
],

definition:function(scope){

    var
        sjs = scope.sjs
    ,   imports = scope.imports
    ;
    
    var
        debug = sjs.log.debug
    ;

	var
		Class = imports.Inheritance.Class
	,	D3Canvas = imports.SpliceJS.Controls.D3Canvas
    ,   data = imports.Data.data
	,	Event = imports.Events.event
	;

	var CHART_MAP = {
		Bar:  imports.Charts.BarChart,
		Line: imports.Charts.LineChart,
		Scatter: imports.Charts.ScatterChart,
		ScatterLine: imports.Charts.ScatterLineChart
	}
	, CHART_MARGIN = {
		left:30,top:20, right:10, bottom:20
	}
	;

	var Chart = Class(function ChartController(){
		this.super();	//call parent constructor

		var self = this
		,	width = this.width
		,	height = this.height

		this.dM = {};	//data measures

		//this.d3 is inherited from the parent SpliceJS.Controls.D3Canvas
		this.onDataIn.subscribe(function(){
			this.measureData(this.d3);
			this.render(this.d3);
		}, this);


		Event.attach(this.elements.root, 'onmousedown').subscribe(function(args){
			var sourceData = args.source.__data__ || [10,10];
			this.onChartItem({data:sourceData,name:'series1'});
		},this);

		//subscribe to onAttach event, update chat dimensions
		this.onAttach.subscribe(this.attach, this);

		//single svg node per chart
		this.svg = this.d3.select().append('svg')

		this.hAxis = this.svg.append('g').attr('class', 'horizontal-axis');
		this.vAxis = this.svg.append('g').attr('class', 'vertical-axis');
		this.grid  = this.svg.append('g').attr('class', 'chart-grid')

		this.chartArea = this.svg.append('g').attr('class','chart-area');
	}).extend(D3Canvas);

	Chart.prototype.onChartItem = Event;

	Chart.prototype.attach = function(){

		/*
			dimensions are only valid when element is
			attached the DOM tree
			of the outermost container
		*/

		if(!this.width) this.width = this.elements.root.clientWidth;
		if(!this.height) this.height = this.elements.root.clientHeight;

		this.reflow(this.width, this.height);
	}


	Chart.prototype.reflow = function(width, height){
		this.width = this.elements.root.clientWidth;
		this.height = this.elements.root.clientHeight;

		if(this.width <= 0) return;
		if(this.height <= 0) return;

		//var s = this.elements.root.style;

		////s.width = width + 'px';
		//s.height = height + 'px';

		this.svg.attr('width',this.width).attr('height',this.height);
		this.render(this.d3);
	};


	Chart.prototype.measureData = function(d3){


		this.dM.max = d3.max(data(this.dataItem).to(function(v,k){
			if (v.data.length>0 && v.data[0] instanceof Array){
				return d3.max(v.data, function(d){return d[1];});
			}
			else
				return d3.max(v.data)
		}).array());

		this.dM.min = d3.min(data(this.dataItem).to(function (v,k) {
			if (v.data.length>0 && v.data[0] instanceof Array)
				return d3.min(v.data, function(d){return d[1];});

		    return d3.min(v.data);
		}).array());

		this.dM.count = d3.max(data(this.dataItem).to(function(v,k){

			return v.data.length;
		}).array());


		if (this.dM.min > 0) this.dM.min = 0;


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
		var y = this.y = d3.scale.linear()
		    .domain([this.dM.min, this.dM.max])
		    .range([height, 0]);


		var x = this.x = d3.scale.ordinal()
			.domain(data(this.dM.count).to().array())
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


        /* reposition grid */
	    /* translate charting area to allow margin*/
    	this.grid.attr('width', width)
    	.         attr('height', height)
    	.         attr('transform', 'translate(' + CHART_MARGIN.left + ',' + CHART_MARGIN.top + ')');

        /* render grid */
        renderGrid.call(this, width, height);


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
					scale:{x:x,y:y},
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



	function renderGrid(width, height) {

	    var y = this.y
        ,   x = this.x;


        // horizontal lines - over Y
	    var g = this.grid.selectAll('line[sjs-grid-y]').data(y.ticks());

	    g.enter().append('line').attr('sjs-grid-y', '').attr('class', 'y-line');

	    //n.remove();

	    g.attr({
                'x1': 0,
                'x2': this.width,
                'y1': function (d) { return y(d); },
                'y2': function (d) { return y(d); }
	    });


	    //vertical lines - over X
	    var g = this.grid.selectAll('line[sjs-grid-x]').data(x.range());

	    g.enter().append('line').attr('sjs-grid-x', '').attr('class', 'x-line');

	    //n.remove();

	    g.attr({
	        'y1': 0,
	        'y2': this.height,
	        'x1': function (d,i) { return x(i) + x.rangeBand()/2; },
	        'x2': function (d,i) { return x(i) + x.rangeBand()/2; }
	    });
	};



	function chartModule(ct) {
	    if (!ct) throw 'Invalid chart type, data set must include chart type : ' + ct

	    if (!CHART_MAP[ct]) throw 'Unable to locate component class for chart:' + ct;

	    var c =CHART_MAP[ct];

	    if (!c) throw 'Unable to locate component:' + c;

	    return c;
	};

    //end definition
   scope.exports(
		{Dial:imports.Charts.Dial}
	);
}


});
