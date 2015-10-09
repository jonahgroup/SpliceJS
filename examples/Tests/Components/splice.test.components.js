sjs({

required:[
    {'SpliceJS.Controls':'{sjshome}/modules/splice.controls/splice.controls.combobox.js'},
    'splice.test.components.html'
],

definition:function(sjs){

  var Class = sjs.Class
  , Controller = sjs.Controller
  , Event = sjs.Event;


  var provinces = ['Ontario','British Columbia', 'Alberta'];


  var ComponentsTest = Class.extend(Controller)(function ComponentsTest(){
    this.onDisplay.subscribe(this.display, this);
  });

  ComponentsTest.prototype.display = function(){
    this.onProvinces(provinces);
  };


  ComponentsTest.prototype.onProvinces = Event;
  ComponentsTest.prototype.provinceSelected = function(item){
      console.log('Selected province is:' + item);
  };

}


});
