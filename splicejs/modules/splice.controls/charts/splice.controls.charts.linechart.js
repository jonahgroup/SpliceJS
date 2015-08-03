_.Module({


definition:function(){

	var LineChart = _.Namespace('SpliceJS.Controls.Charts').Class(function LineChart(){

	});


	LineChart.prototype.render = function(d3){

		var data = this.dataItem;
		

		if(!data) return;

		var width = this.width
		,   barHeight = 20
		,	height = this.height

		var x = d3.scale.linear()
		    .domain([0, d3.max(data)])
		    .range([0, width]);

		var y = d3.scale.linear()
    			  .range([height, 0]);

 
			

    	var barWidth = width / data.length;		  


		var chart = this.svg
					.attr('class', 'line')
					.attr("width", width)
		    		.attr("height", height);

		var g = chart.selectAll("g").data(data);

		//appending selector
		var ag = g.enter().append("g")
				 .attr("transform", function(d, i) { 
				 	 	var position = height - i * barHeight;
				 		return "translate(0," + position  + ")"; 
				 });

		ag.append("circle")
			.attr("r",5)
			.attr("cx", function(d) {return x(d);})
			.attr("cy", 0 );



		ag.append("text")
    		.attr("x", function(d) { return x(d) + 8; })
		    .attr("y", barHeight / 2)
		    .attr("dy", ".35em")
		    .text(function(d) { return d; });


		//drop extra items    
		g.exit().remove();


		//update existing items
		g.select('circle')
			.attr("r",5)
			.attr("cx", function(d) {return x(d);})
			.attr("cy", 0 );
				
		g.select("text")
		    .attr("x", function(d) { return x(d) + 8; })
		    .attr("y", barHeight / 2)
		    .attr("dy", ".35em")
		    .text(function(d) { return d; });
		
		
	};

}});