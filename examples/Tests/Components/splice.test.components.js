sjs({

required:[
    {'SpliceJS.Controls':'{sjshome}/modules/splice.controls/splice.controls.listbox.js'},
    {'SpliceJS.Controls':'{sjshome}/modules/splice.controls/splice.controls.dropdownlist.js'},
    {'SpliceJS.Controls':'{sjshome}/modules/splice.controls/splice.controls.buttons.js'},
    {'SpliceJS.Controls':'{sjshome}/modules/splice.controls/splice.controls.combobox.js'},
    {'SpliceJS.Controls':'{sjshome}/modules/splice.controls/splice.controls.charts.js'},
    {'SpliceJS.Controls':'{sjshome}/modules/splice.controls/splice.controls.checklistbox.js'},
    'splice.test.components.html'
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

  var barchart = {

  };

  var ComponentsTest = Class.extend(Controller)(function ComponentsTest(){
    this.super();
    this.onDisplay.subscribe(this.display, this);
  });

  ComponentsTest.prototype.display = function(){
    this.onProvinces(provinces);
    this.onChartsData(charts);
  };


  ComponentsTest.prototype.onProvinces = Event;
  ComponentsTest.prototype.provinceSelected = function(item){
      console.log('Selected province is:' + item);
  };

  ComponentsTest.prototype.onChartsData = Event;

}


});
