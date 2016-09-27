/* global sjs */
$js.module({
imports:[
  { Inheritance : '/{$jshome}/modules/splice.inheritance.js'},
]
,
definition:function(scope){

    var sjs = scope.sjs
    ,   imports = scope.imports
    ;

    var Class = imports.Inheritance.Class
    ,   debug = sjs.log.debug
    ;

	var LineChart = Class(function LineChart(){

	});


	LineChart.prototype.render = function(d3){

		var data = this.dataItem;

		if(!data) return;

		var width = this.width
		,	height = this.height;

		var x = this.scale.x
		,	y = this.scale.y;

		var chart = this.svg
					.attr('class', ('line' + (this.id!=null?(' '+this.id):'' )) )
					.attr("width", width)
		    		.attr("height", height);


		// line generator
		var lineFunction = d3.svg.line()
		.	x(function(d,i){ return x(i)+x.rangeBand()/2;})
		.	y(function(d,i){ return y(d);})
		.	interpolate('linear');

		var areaFunction = d3.svg.area()
		.	x(function(d,i){ return x(i)+x.rangeBand()/2;})
		.	y0(function(d,i){ return y(0);})
		.	y1(function(d,i){ return y(d);})



		/* render area under the curve*/
		if(this.showArea) {
		var area = this.svg.select('path[class="area"]');
		if(area.size()  == 0){
			area = this.svg.append('path').attr('class','area');
		}
		area.attr('d',areaFunction(data))
		.	attr('fill','#cecece')
		.	attr('stroke','none');
		}



		var line = this.svg.select('path[class="line"]');
		if(line.size() == 0) {
			line = this.svg.append('path').attr('class','line');
		}

		line.attr('d',lineFunction(data))
		.	attr('fill','none')
		.	attr('stroke','#000')
		.	attr('stroke-linejoin', 'round');



		var g = chart.selectAll("g").data(data);


		//appending selector
		var ag = g.enter().append("g");



		/*
			no inversion for Y axis
			it is already inverted
		*/

		ag.attr("transform", function(d, i) {
		 	var position = x(i);
			return 'translate(' + position + ',0)';
		});

		if(this.showPoints == true)
		ag.append("circle")
			.attr("r",	this.pointSize)
			.attr("cx", x.rangeBand()/2)
			.attr("cy", function(d){return y(d);} );

		ag.append("text")
    		.attr("x", x.rangeBand()/2)
		    .attr("y", function(d){return y(d) - 10;})
		    .attr("dy", ".35em")
		    .text(function(d) { return d; });


		//drop extra items
		g.exit().remove();


		g.attr("transform", function(d, i) {
		 	 	var position = x(i);
		 		return 'translate(' + position + ',0)';
		});


		//update existing items
		if(this.showPoints == true)
		g.select('circle')
			.attr("r",this.pointSize)
			.attr("cx", x.rangeBand()/2)
			.attr("cy", function(d){return y(d);} );

		g.select("text")
    		.attr("x", x.rangeBand()/2)
		    .attr("y", function(d){return y(d) - 10;})
		    .attr("dy", ".35em")
		    .text(function(d) { return d; });
	};


	scope.exports(
		LineChart
    );

}
});
