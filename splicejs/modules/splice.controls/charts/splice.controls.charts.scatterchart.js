$js.module({
imports:[
  { Inheritance : '/{$jshome}/modules/splice.inheritance.js'},
  { Events      : '/{$jshome}/modules/splice.event.js'},
]
,
definition: function(scope){
  var   sjs = scope.sjs
  ,     imports = scope.imports
  ;


  var Class = imports.Inheritance.Class
  ,   debug = sjs.log.debug
  ,   Event = imports.Events.Event
  ;

      var ScatterChart = Class(function ScatterChart(){});

      ScatterChart.prototype.onDataItem = Event;


      ScatterChart.prototype.render = function(d3){

          //DataItem will be injected
          var data = this.dataItem;

          /*Data will be array of pairs*/

          if (!data) return;

          var width = this.width
          ,   height = this.height
          ,   size = this.pointSize || 3;

         var spacing = 20;

         var chart = this.svg
                      .attr("class", ("scatter" + (this.id!= null? (' ' + this.id) : '')))
                      .attr("width", width)
                      .attr("height",height);

          //chart is already G group.

          var xScale = //this.scale.x;
           d3.scale.linear()
              .domain([0, d3.max(data, function(v){
                    return v[0];
                  })
              ])
              .range([0, width-spacing]);


          var yScale = this.scale.y;

          var c = chart.selectAll("circle")
                       .data(data);

          c.enter()
            .append("circle")
            .attr("cx",function(d){return xScale(d[0]);})
            .attr("cy", function(d){return yScale(d[1]);})
            .attr("r", size);


            //Remove old items
          c.exit().remove();


      };

      var ScatterLineChart = Class(function ScatterLineChart(){});

      ScatterLineChart.prototype.render = function(d3){
          //DataItem will be injected
          var data = this.dataItem;

          /*Data will be array of pairs*/
          if (!data) return;

          var width = this.width
          ,   height = this.height;


         var spacing = 20;

         var chart = this.svg
                      .attr("class", ("scatterline" + (this.id!= null? (' ' + this.id) : '')))
                      .attr("width", width)
                      .attr("height",height);

        var xScale =
           d3.scale.linear()
              .domain([0, d3.max(data, function(v){
                    return v[0];
                  })
              ])
              .range([0, width-spacing]);


          var yScale = this.scale.y;


          var line = d3.svg.line()
                  .x(function (d){return xScale(d[0]);})
                  .y(function (d){return yScale(d[1]);})
                  .interpolate("linear");


          chart
            .append("path")
            .attr("d",line(data))
            .attr("class","line")
            .attr("fill", 'none');


      };

      scope.exports ( 
          ScatterChart,
          ScatterLineChart
      );
 }
 });
