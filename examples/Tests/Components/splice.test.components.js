sjs({

required:[
    {'SpliceJS.Controls':'{sjshome}/modules/splice.controls/splice.controls.listbox.js'},
    {'SpliceJS.Controls':'{sjshome}/modules/splice.controls/splice.controls.dropdownlist.js'},
    {'SpliceJS.Controls':'{sjshome}/modules/splice.controls/splice.controls.buttons.js'},
    {'SpliceJS.Controls':'{sjshome}/modules/splice.controls/splice.controls.combobox.js'},
    {'SpliceJS.Controls':'{sjshome}/modules/splice.controls/splice.controls.charts.js'},
    {'SpliceJS.Controls':'{sjshome}/modules/splice.controls/splice.controls.checklistbox.js'},
    {'SpliceJS.Controls':'{sjshome}/modules/splice.controls/splice.controls.dropdownchecklist.js'},
    'splice.test.components.html',
    'splice.test.components.css'
],

definition:function(sjs){

  var Class = sjs.Class
  , Controller = sjs.Controller
  , Event = sjs.Event;


  var provinces = [
    'Ontario','British Columbia', 'Alberta', 'Quebec','New Brunswick', 'Nova Scotia'
  ];

  var charts = [
    {plot:'Bar',name:'series1',data:[10,20,5,23]},
    {plot:'Line',name:'series1',data:[10,20,5,23]}
  ];

 var scatterChart = [
      {plot: 'Scatter',    name: 'series1', data: [[12,14], [16,12], [65,45], [165,50], [180,327], [190,365], [200,45]]},
      {plot: 'Scatter',    name: 'series2', data: [[13,14], [13,341], [65,122], [165,12], [32,56], [234,365], [123,45]]},
      {plot: 'ScatterLine',name:'line1',data:[[0,0],[250,370]]}
 ];

  var barchart = {

  };

  var testCheck = {checked:true};

  var ComponentsTest = Class.extend(Controller)(function ComponentsTest(){
    this.super();
    this.onDisplay.subscribe(this.display, this);

    // value read
    var v = sjs.propvalue(charts)('0.data.1').value;
    // value assign
    sjs.propvalue(charts)('0.data.1').value = v + 1;
    if( (v+1) == sjs.propvalue(charts)('0.data.1').value){
      console.log('Test pass: propvalue');
    }
    else {
      throw 'Test fail: propvalue';
    }
  });

  sjs.prototype(ComponentsTest,{

    display : function(){
      this.onProvinces(provinces);
      this.onChartsData(charts);
      this.onScatterChartData(scatterChart);
      this.onTestCheck(testCheck);
    },

    testCheck : function(item){
      console.log(item);
    },

    provincesSelection:function(provinces){
      console.log(provinces);
    },

    provinceSelected : function(item){
        console.log('Selected province is:' + item);
    },

    onProvinces : Event,
    onChartsData: Event,
    onScatterChartData :Event,
    onTestCheck: Event

  });

  return {}
}


});
