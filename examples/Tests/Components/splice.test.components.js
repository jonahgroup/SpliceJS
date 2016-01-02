sjs({

required:[
  '{sjshome}/modules/splice.animation.js',
  '{sjshome}/modules/splice.network.js',
  '{sjshome}/modules/splice.document.js',
  '{sjshome}/modules/splice.data.js',
  '{sjshome}/modules/splice.text.js',
  {'SpliceJS.Ui':'{sjshome}/modules/splice.ui.js'},
  {'SpliceJS.Controls':'{sjshome}/modules/splice.controls.js'},
  'splice.test.components.css',
  'splice.test.components.html',
  'splice.test.components.templates.html'
],

definition:function(sjs){

  var Class = sjs.Class
  , Controller = sjs.Controller
  , Event = sjs.Event
  , event = sjs.event
  , exports = sjs.exports;

  var provinces = [
    'Ontario','British Columbia', 'Alberta', 'Quebec','New Brunswick',
    'Nova Scotia', 'Manitoba','Yukon','Nunavut','Northwest Territories',
    'Saskatchewan', 'Prince Edward Island','Newfoundland'
  ];


  var provinces2 = [
    {name:'Ontario', isChecked:false},
    {name:'Alberta', isChecked:true},
    {name:'British Columbia', isChecked:true, population:10000,
    office:{address:{street:'king'}}},
    {name:'Quebec', isChecked:true}
  ];


  var charts = [
    {plot:'Bar',name:'series1',data:[10,20,5,23]},
    {plot:'Line',name:'series1',data:[10,20,5,23]}
  ];

 var scatterChart = [
      {plot: 'scatter',    name: 'series1', data: [
          ['Ontario',381],['British Columbia',497],['Alberta',152],['Quebec',556],['New Brunswick',696],['Nova Scotia',209],['Manitoba',223],['Yukon',41],['Nunavut',40],['Northwest Territories',350],['Saskatchewan',396],['Prince Edward Island',640],['Newfoundland',192]
          ]
          },
      {plot: 'scatter',    name: 'series2', data: [
          ['Ontario',127],['British Columbia',487],['Alberta',527],['Quebec',390],['New Brunswick',392],['Nova Scotia',266],['Manitoba',525],['Yukon',283],['Nunavut',394],['Northwest Territories',206],['Saskatchewan',596],['Prince Edward Island',280],['Newfoundland',449]
          ]},
      {plot: 'scatter',name:'line1',data:[['Ontario',400],['Newfoundland',400]]},
      {plot:'bar',name:'Province debt',data:[
          ['Ontario',187],['British Columbia',282],['Alberta',35],['Quebec',458],['New Brunswick',166],['Nova Scotia',60],['Manitoba',402],['Yukon',497],['Nunavut',124],['Northwest Territories',308],['Saskatchewan',49],['Prince Edward Island',45],['Newfoundland',309]
      ],
      options:{
          marker: {
    color: 'rgb(158,202,225)',
    opacity: 0.6,
    line: {
      color: 'rbg(8,48,107)',
      width: 1.5
    }
  }
      }},
 ];

  var barchart = {

  };



  var ComponentsTest = Class(function ComponentsTest(){
    this.super();

    event(this).attach({
      onProvinces         : event.multicast,
      onChartsData        : event.multicast,
      onScatterChartData  : event.multicast,
      onTestCheck         : event.multicast
    });

    this.sourceTestCheck = {checked:true};

  }).extend(Controller);

  ComponentsTest.prototype.initialize = function(){
    this.onDisplay.subscribe(function(){
      this.onProvinces(provinces2);
      this.onChartsData(charts);
      this.onScatterChartData(scatterChart);
      this.onTestCheck(this.sourceTestCheck);
    }, this);

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

  ComponentsTest.prototype.updateRecords = function(){
    this.onProvinces(provinces2);
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



  //scope exports
  exports.scope(
    ComponentsTest
  );

  //module exports
  exports.module(
    ComponentsTest, foo
  );

}


});
