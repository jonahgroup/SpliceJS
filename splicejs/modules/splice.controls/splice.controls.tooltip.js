$js.module({
prerequisite:[
  '/{$jshome}/modules/splice.module.extensions.js'
],
imports:[
  { Inheritance : '/{$jshome}/modules/splice.inheritance.js' },
  { Component   : '/{$jshome}/modules/splice.component.core.js'},
  {'SpliceJS.UI':'/{$jshome}/modules/splice.ui.js'},
  'splice.controls.tooltip.html'
]
,
definition:function(){
  "use strict";

  var scope = this;

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
