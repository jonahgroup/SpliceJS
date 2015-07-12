//http://bl.ocks.org/mbostock/1123639
_.Module({

required:[
	_.home('modules/splice.controls/splice.controls.d3canvas.js'),
	'streamgraph.html'
],


definition:function(){

	var D3StreamGraph = _.Namespace('UserApplications').Class(function D3StreamGraph(){
		SpliceJS.Controls.D3Canvas.call(this);

		var self = this;
		this.elements.controlContainer.onclick = function(){
			self.onClick();
		}

		if(!this.width) this.width = 300;
		if(!this.height) this.height = 150;

		this.onClick.subscribe(function(){
			self.transition(self.d3, self);
		})

	}).extend(SpliceJS.Controls.D3Canvas);

	D3StreamGraph.prototype.onClick = _.Event;

	
	D3StreamGraph.prototype.transition = function(d3){
		var self = this;
		d3.selectAll("path")
		      .data(function() {
		        var d = self.layers1;
		        self.layers1 = self.layers0;
		        return self.layers0 = d;
		      })
		    .transition()
		      .duration(2500)
		      .attr("d", self.area);
	}


	D3StreamGraph.prototype.render = function(d3){

		var n = 20, // number of layers
		    m = 200, // number of samples per layer
		    stack = d3.layout.stack().offset("wiggle"),
		    layers0 = stack(d3.range(n).map(function() { return bumpLayer(m); })),
		    layers1 = stack(d3.range(n).map(function() { return bumpLayer(m); }));

		this.layers0 = layers0;
		this.layers1 = layers1;    


		var width = this.width,
		    height = this.height;

		var x = d3.scale.linear()
		    .domain([0, m - 1])
		    .range([0, width]);

		var y = d3.scale.linear()
		    .domain([0, d3.max(layers0.concat(layers1), function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); })])
		    .range([height, 0]);

		var color = d3.scale.linear()
		    .range(["#aad", "#556"]);

		var area = d3.svg.area()
		    .x(function(d) { return x(d.x); })
		    .y0(function(d) { return y(d.y0); })
		    .y1(function(d) { return y(d.y0 + d.y); });

		this.area = area;    

		var svg = d3.select("body").append("svg")
		    .attr("width", width)
		    .attr("height", height);

		svg.selectAll("path")
		    .data(layers0)
		  .enter().append("path")
		    .attr("d", area)
		    .style("fill", function() { return color(Math.random()); });

		function transition() {
		  d3.selectAll("path")
		      .data(function() {
		        var d = layers1;
		        layers1 = layers0;
		        return layers0 = d;
		      })
		    .transition()
		      .duration(2500)
		      .attr("d", area);
		}

		// Inspired by Lee Byron's test data generator.
		function bumpLayer(n) {

		  function bump(a) {
		    var x = 1 / (.1 + Math.random()),
		        y = 2 * Math.random() - .5,
		        z = 10 / (.1 + Math.random());
		    for (var i = 0; i < n; i++) {
		      var w = (i / n - y) * z;
		      a[i] += x * Math.exp(-w * w);
		    }
		  }

		  var a = [], i;
		  for (i = 0; i < n; ++i) a[i] = 0;
		  for (i = 0; i < 5; ++i) bump(a);
		  return a.map(function(d, i) { return {x: i, y: Math.max(0, d)}; });
		}
		

	};



}


});