sjs.module({
required:[
  { Inheritance : '/{sjshome}/modules/splice.inheritance.js' },
  { Component   : '/{sjshome}/modules/splice.component.core.js'},
  {'SpliceJS.UI':'/{sjshome}/modules/splice.ui.js'},
  'splice.controls.tooltip.html'
],
definition:function component(sjs){
  "use strict";
  var
    scope = this.scope
  ;

  var
    Class = scope.Inheritance.Class
  , Controller = scope.Component.Controller
  ;

  var ToolTip  = Class(function ToolTipController(){
    this.super();
  }).extend(Controller);


}})
