_.Module({

required:[
    'splice.controls.chart.html',
    'splice.controls.chart.css',
    _.home('lib/Chart.js-1.0.2/Chart.js')
],

definition:function(){

Chart.defaults.global.responsive = true;


/**
  --  Chart control ---
*/

function createChart(chartType, data){

    if(chartType == 'Line')  return new Chart(this).Line(data);
    if(chartType == 'Bar')   return new Chart(this).Bar(data);
    if(chartType == 'Pie')   return new Chart(this).Pie(data);
}

var SChart = _.Namespace('SpliceJS.Controls').Class(function ChartCanvas(args){
    
    SpliceJS.Controls.UIControl.apply(this,arguments);
    
    var type = this.chartType;

    this.canvas = this.elements.controlCanvas;
    this.ctx = this.canvas.getContext("2d");

    if(this.width)  this.canvas.width   = this.width;
    if(this.height) this.canvas.height = this.height;

    //this.chart = createChart();

    this.isDirty = false;

    if(!this.chart) {
        this.chart = 'Line';
    }
    
    if(!this.chartType) this.cartType = 'Line';

    
//    this.onDisplay.subscribe(this.display, this);
    this.onAttach.subscribe(this.attach, this);

}).extend(SpliceJS.Controls.UIControl);

SChart.prototype.attach = function(){

    var containerWidth =  this.elements.controlContainer.clientWidth;
    var containerHeight = this.elements.controlContainer.clientHeight;

    this.canvas.width = containerWidth;
    this.canvas.height = containerHeight;


    _.debug.log('Attaching chart');
};


SChart.prototype.dataIn = function(dataItem){
    SpliceJS.Controls.UIControl.prototype.dataIn.call(this, dataItem);
    this.isDirty = true;
   this.chart =  createChart.call(this.ctx, this.chartType, this.dataItem);
};

SChart.prototype.display = function() {
    /* adjust canvas size */
    var containerWidth = this.elements.controlContainer.clientWidth;
    var containerHeight = this.elements.controlContainer.clientHeight;
    

    this.canvas.width = 400;//containerWidth;
    this.canvas.height = 200;//containerHeight;

    this.isDirty = true;
    if(this.isDirty) {
        this.chart =  createChart.call(this.ctx, this.chartType, this.dataItem);
    }
    this.isDirty = false;
};

SChart.prototype.reflow = function(position, size, bubbleup){
 /*   
    SpliceJS.Controls.UIControl.prototype.reflow.call(this,position,size,bubbleup);




    this.canvas.width  = this.elements.controlContainer.clientWidth;
    this.canvas.height = this.elements.controlContainer.clientHeight;

    var style = this.canvas.style;
    style.width = this.canvas.width + 'px';
    style.height = this.canvas.height + 'px';

    if(this.dataItem) {
        this.chart =  createChart.call(this.canvas.getContext("2d"), this.chartType, this.dataItem);
    }
/*
    if(typeof this.chart.update === 'function') {
        this.chart.update();
    }
*/

};



SChart.listTypes = function(){
    _.info.log('------ Supported chart types ------- ');
};


}});
