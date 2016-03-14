sjs.module({
type:'component'
,
required:[
  { Inheritance : '/{sjshome}/modules/splice.inheritance.js' },
  { Component   : '/{sjshome}/modules/splice.component.core.js'},
  {'SpliceJS.UI':'/{sjshome}/modules/splice.ui.js'},
  'splice.controls.tooltip.html'
]
,
definition:function(sjs){
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
