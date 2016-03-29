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
definition:function(scope){
  "use strict";
  var
    imports = scope.imports
  ;

  var
    Class = imports.Inheritance.Class
  , Controller = imports.Component.Controller
  ;

  var ToolTip  = Class(function ToolTipController(){
    this.base();
  }).extend(Controller);

  scope.exports(
      ToolTip
  );


}})
