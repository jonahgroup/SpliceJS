global.sjs.module({
prerequisite:[
  {Splash:'../SplashScreens/splash2.js'},
  '/{sjshome}/modules/splice.module.extensions.js'
],
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
  
  'desktop:*|splice.test.components.css',
  'mobile:*|splice.test.components.mobile.css',
  'mobile:*|splice.test.components.mobile.meta',
  'splice.test.components.html',
  
]
,
definition:function(scope){

  var sjs = scope.sjs
  ,   imports = scope.imports
  ,   log = scope.sjs.log
  ;

  var Class = imports.Inheritance.Class
  ,   Controller = imports.Component.Controller
  ,   Events = imports.Events
  ,   MulticastEvent = imports.Events.MulticastEvent
  ,   Component = imports.Component
  ,   Splash = imports.Splash
  ;

  var DataItem = imports.SpliceJS.Ui.DataItem
  ,   ArrayDataItem = imports.SpliceJS.Ui.ArrayDataItem
  ;

  var provinces = [
    'Ontario','British Columbia', 'Alberta', 'Quebec','New Brunswick',
    'Nova Scotia', 'Manitoba','Yukon','Nunavut','Northwest Territories',
    'Saskatchewan', 'Prince Edward Island','Newfoundland'
  ];


  var a = [
    {name:'Ontario', isChecked:false},
    {name:'Alberta', isChecked:true},
    {name:'British Columbia', isChecked:true, population:10000,
      office:{address:{street:'king'}}},
    {name:'Quebec', isChecked:true}
  ];

  var provincesOfProvinces = [
    a
  ];

  var b = [
    {name:'Pffff', isChecked:false},
    {name:'Pffff', isChecked:false}
  ];

  for(var i=0; i<10; i++){
      a.push({name:'Ontario ' + i, isChecked:false});
  }

  var provinces2 = new ArrayDataItem(a);

  var charts = [
    {plot:'Bar',name:'series1',data:[10,20,5,23]},
    {plot:'Line',name:'series1',data:[10,20,5,23]}
  ];

  var scatterChart = [
    { plot: 'Scatter', name: 'series1', 
        data: [[12,14], [16,12], [65,45], [165,50], [180,327], [190,365], [200,45]]
    },
    { plot: 'Scatter', name: 'series2', 
      data: [[13,14], [13,341], [65,122], [165,12], [32,56], [234,365], [123,45]]
    },
    { plot: 'ScatterLine', name:'line1',
      data:[[0,0],[250,370]]
    }
  ];

  var newProvince = new DataItem({
      name:'',isChecked:false
  });

  var components = Component.defineComponents(scope);

  var ComponentsTest = Class(function ComponentsTest(){
    this.base();

    Events.attach(this,{
      onProvinces         : MulticastEvent,
      onNewProvince       : MulticastEvent,
      onChartsData        : MulticastEvent,
      onScatterChartData  : MulticastEvent,
      onTestCheck         : MulticastEvent
    });

    this.sourceTestCheck = {checked:true};
    this.provinces = new DataItem(a);
    this.provincesOfProvinces = new DataItem();

  }).extend(Controller);

  ComponentsTest.prototype.initialize = function(){
    this.provincesOfProvinces.setValue(provincesOfProvinces);
  };

  ComponentsTest.prototype.onDisplay = function(){
    this.onNewProvince(newProvince);
    this.onProvinces(provinces2);
    this.onChartsData(charts);
    this.onScatterChartData(scatterChart);
    this.onTestCheck(this.sourceTestCheck);
  }

  ComponentsTest.prototype.addProvince = function(){
    var p = newProvince.getValue();
    provinces2.append().setValue({name:p.name, isChecked:p.isChecked});
  };

  ComponentsTest.prototype.testCheck = function(item){
    console.log(item);
  }

  ComponentsTest.prototype.changeDataSet = function(){
    // var t = this.provincesOfProvinces.path('0.1.name');
    // console.log(t.getValue());
    
    // t.setValue("Changed by controller");
    this.provincesOfProvinces.setValue([b]);
  }

  ComponentsTest.prototype.provincesSelection = function(provinces){
    console.log(provinces);
  }

  ComponentsTest.prototype.provinceSelected = function(item){
    console.log('Selected province is:' + item);
  }

  ComponentsTest.prototype.deleteItem = function(item){
    console.log(item);
    item.remove();
  };

  ComponentsTest.prototype.showPopup = function(){
    console.log('I am a popup');
  }

  ComponentsTest.prototype.formatButton = function(item){
    var v = item.getValue();
    if(v == 'Alberta'){
        return 'background-color:#ff0000; font-size:2em;';
    }
    if(v == 'Quebec'){
        return 'background-color:#ff00cc';
    }
    if(v == 'Nova Scotia'){
        return 'background-color:#FFAE00';
    }
    if(v == 'British Columbia'){
        return 'background-color:#85B81B';
    }

    return "";
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
    ComponentsTest, foo, testDataItem, components
  );

  Splash.hideSplash();
  new imports.Component.DocumentApplication(scope).run();
}});
