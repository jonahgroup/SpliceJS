sjs({
   required:[
    '{sjshome}/lib/plotly/plotly.min.js',
     {'Data':'{sjshome}/modules/splice.data.js'},
     {'SpliceJS.UI':'../splice.ui.js'},
     'splice.controls.plotlychart.html',
     'splice.controls.plotlychart.css'
   ] 
   ,
   
   definition: function(sjs){
       var scope = this.scope;
       
       var Class = sjs.Class,
           debug = sjs.debug,
           exports = sjs.exports,
           Event = sjs.Event;
           
       var UIControl = scope.SpliceJS.UI.UIControl,
           data = scope.Data.data;
        
        var CHART_MARGIN = {
		      left:50,top:50, right:50, bottom:60
	    };
      
       var PlotlyChartController = Class(function PlotlyChartController(){
           this.super(); 
           this.plotData = [];
       
           
       }).extend(UIControl);
       
       PlotlyChartController.prototype.onDataIn=function(inData){
		      console.log(this.views.root.replace(inData.getValue()));
	           this.stripData(inData.getValue());
               this.render();
       };
       
       PlotlyChartController.prototype.onAttach = function(){

		if(!this.width) this.width = this.views.root.htmlElement.clientWidth;
		if(!this.height) this.height = this.views.root.htmlElement.clientHeight;


		this.reflow(this.width, this.height);
  
       };
       
       PlotlyChartController.prototype.reflow = function(width, height){
          
          this.width = this.views.root.htmlElement.clientwidth;
          this.height = this.views.root.htmlElement.clientheight;
          
          if (this.width <= 0) return;
          if (this.height <= 0) return;
          
          Plotly.redraw(this.views.root.htmlElement);
       };
       
       PlotlyChartController.prototype.stripData = function(dataItem){
           
           //data Item in format of array of objects, with type: chart and data as array of points
           this.plotData = [];
           if (dataItem instanceof Array){
              for(var i = 0; i<dataItem.length; i++){
                 convertToPlotlySeries.call(this, dataItem[i]); 
              }
           }
           else if(dataItem){
               convertToPlotlySeries.call(this, dataItem);
           }
           
       };
       
       function convertToPlotlySeries(item){
          var result = splitIntoTwo(item.data);
           
           var series = {
               x: result[0], //array of x values,
               y: result[1], //array of y values,
               name: item.name,
               type: item.plot
           };
           
           Object.assign(series, item.options)    
           this.plotData.push(series);
       }
       
       function splitIntoTwo (array){
           var result = [[],[]];
           
           array.forEach(function (v){
              result[0].push(v[0]);
              result[1].push(v[1]); 
           });
           
           return result;
       }
       
       PlotlyChartController.prototype.render = function(){
           if (!this.dataItem) return; //when no data is present
           
           var options = this.plotOptions||{};
           
           var layout = {
                paper_bgcolor: '#7f7f7f',
                plot_bgcolor: '#c7c7c7',
                margin: {
                    l: CHART_MARGIN.left,
                    r: CHART_MARGIN.right,
                    b: CHART_MARGIN.bottom,
                    t: CHART_MARGIN.top,
                    pad: 4
                },
                legend:{
                    xanchor: 'left',
                    yanchor: 'bottom'
                }
           };
           
           var layoutOptions = Object.assign(layout, options);
           
           Plotly.newPlot(this.views.root.htmlElement, this.plotData, layoutOptions, {displayModeBar:false});
       };
       
       exports.scope(
		PlotlyChartController
	   );

	//exporting objects
	exports.module(
		PlotlyChartController
	);
       
   }
   
}  
    
)


