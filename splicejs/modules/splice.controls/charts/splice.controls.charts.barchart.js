$js.module({
imports:[
	{ Inheritance : '/{$jshome}/modules/splice.inheritance.js'}
],
definition:function(scope){
	var sjs = scope.sjs
    ,   imports = scope.imports
    ;

	var Class = imports.Inheritance.Class
	,	debug = sjs.log.debug;

	var BarChart = Class(function BarChart(){

	});


	BarChart.prototype.render = function(d3){

		var data = this.dataItem;

		if(!data) return;

		var width = this.width
		,	height = this.height
		,	spacing = 1;

		var x = this.scale.x
		,	y = this.scale.y;

		var chart = this.svg
					 .attr('class', ('bar' + (this.id != null ? (' ' + this.id) : '')))
					 .attr("width", width)
		    	 .attr("height", height);


		var g = chart.selectAll("g").data(data);

		//appending selector
		var ag = g.enter().append("g");


		/*

			Create new group, bars and text

		*/

		ag.attr("transform", function(d, i) {
		 	var position = x(i);
			return 'translate(' + position + ',0)';
		});


		ag.append('rect')
		    .attr('width', x.rangeBand() - spacing * 2)
		    .attr('x', spacing)
		    .attr('y', function(d){return y(d);})
		    .attr('height', function(d){ return height - y(d); });


		g.exit().remove();


		g.attr("transform", function(d, i) {
		 	var position = x(i);
			return 'translate(' + position + ',0)';
		});


		g.select('rect')
		    .attr('width', x.rangeBand() - spacing * 2)
		    .attr('x', spacing)
		    .attr('y', function(d){return y(d);})
		    .attr('height', function(d){ return height - y(d); });

	};


	scope.exports(
		BarChart
	);


}});
