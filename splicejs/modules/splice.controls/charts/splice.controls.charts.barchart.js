_.Module({


definition:function(){

	var BarChart = _.Namespace('SpliceJS.Controls.Charts').Class(function BarChart(){

	});


	BarChart.prototype.render = function(d3){

		var data = this.dataItem;
		_.debug.log(data);
		if(!data) return;

		var width = this.width
		,	height = this.height
		,    barHeight = 20;

		var x = d3.scale.linear()
		    .domain([0, d3.max(data)])
		    .range([0, width]);

		var y = d3.scale.linear()
    			  .range([height, 0]);

    	var barWidth = width / data.length;		  


		var chart = this.svg
					 .attr('class', 'bar')
					 .attr("width", width)
		    		 .attr("height", barHeight * data.length);

		var bar = chart.selectAll("g")
		    .data(data)
			.enter().append("g")
		    .attr("transform", function(d, i) { return "translate(0," + i * barHeight + ")"; });


		bar.append("rect")
		    .attr("width", x)
		    .attr("height", barHeight - 1);

		bar.append("text")
		    .attr("x", function(d) { return x(d) - 3; })
		    .attr("y", barHeight / 2)
		    .attr("dy", ".35em")
		    .text(function(d) { return d; });

		var text = chart.selectAll('text').
				   data(data).
				   enter().append('text')
				   .text(function(d){return d;})    



	};


}});