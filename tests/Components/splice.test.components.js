global.sjs.module({
type:'component'
,
required:[
  '/{sjshome}/modules/splice.animation.js',
  '/{sjshome}/modules/splice.network.js',
  '/{sjshome}/modules/splice.document.js',
  '/{sjshome}/modules/splice.data.js',
  '/{sjshome}/modules/splice.text.js',
  {Inheritance: '/{sjshome}/modules/splice.inheritance.js'},
  {Component:'/{sjshome}/modules/splice.component.js'},
  {Events : '/{sjshome}/modules/splice.event.js'},
  {'SpliceJS.Ui':'/{sjshome}/modules/splice.ui.js'},
  {'SpliceJS.Controls':'/{sjshome}/modules/splice.component.controls.js'},
  'splice.test.components.css',
  'splice.test.components.html',
  'splice.test.components.templates.html'
]
,
definition:function(scope){

  var
    sjs = scope.sjs
    imports = scope.imports
  ;

  var
    Class = imports.Inheritance.Class
  , Controller = imports.Component.Controller
  , Event = imports.Events.Event
  , event = imports.Events.event
  ;

  var DataItem = imports.SpliceJS.Ui.DataItem;
  var ObservableDataItem = imports.SpliceJS.Ui.ObservableDataItem;

  var provinces = [
    'Ontario','British Columbia', 'Alberta', 'Quebec','New Brunswick',
    'Nova Scotia', 'Manitoba','Yukon','Nunavut','Northwest Territories',
    'Saskatchewan', 'Prince Edward Island','Newfoundland'
  ];


  var provinces2 = ObservableDataItem([
    {name:'Ontario', isChecked:false},
    {name:'Alberta', isChecked:true},
    {name:'British Columbia', isChecked:true, population:10000,
    office:{address:{street:'king'}}},
    {name:'Quebec', isChecked:true}
  ]);

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

  var newProvince = new ObservableDataItem({
      name:'',isChecked:false
  });

  var ComponentsTest = Class(function ComponentsTest(){
    this.base();

    event(this).attach({
      onProvinces         : event.multicast,
      onNewProvince       : event.multicast,
      onChartsData        : event.multicast,
      onScatterChartData  : event.multicast,
      onTestCheck         : event.multicast
    });

    this.sourceTestCheck = {checked:true};

  }).extend(Controller);

  ComponentsTest.prototype.initialize = function(){
    this.onDisplay.subscribe(function(){
      this.onNewProvince(newProvince);
      this.onProvinces(provinces2);

      this.onChartsData(charts);
      this.onScatterChartData(scatterChart);
      this.onTestCheck(this.sourceTestCheck);
    }, this);
  };

  ComponentsTest.prototype.addProvince = function(){
    var p = newProvince.getValue();
    provinces2.append().setValue({name:p.name, isChecked:p.isChecked});
  };

  ComponentsTest.prototype.testCheck = function(item){
    console.log(item);
  },

  ComponentsTest.prototype.provincesSelection = function(provinces){
    console.log(provinces);
  },

  ComponentsTest.prototype.provinceSelected = function(item){
      console.log('Selected province is:' + item);
  }

  ComponentsTest.prototype.deleteItem = function(item){
    console.log(item);
    item.remove();
  };


  var foo = function foo(obj, path) {
    var parts = path.split('.');
    var stmnt = 'return this';
    for(var i=0; i < parts.length; i++){
      stmnt+='[\''+parts[i]+'\']';
    }
    stmnt+=';';

    var fn = (new Function(stmnt)).bind(obj);
    return fn;
  };

  var DataItem = imports.SpliceJS.Ui.DataItem;


  var testDataItem = function testDataItem(){
    provinces2.append().setValue({name:'Prince Edward Island', isChecked:true});
  };


  //scope exports
  scope.add(
    ComponentsTest
  );

  //module exports
  scope.exports(
    ComponentsTest, foo, testDataItem
  );

  new imports.Component.DocumentApplication(scope).run();

}});
