sjs.module({
required:[
  {'SpliceJS.UI':'{sjshome}/modules/splice.ui.js'},
  'splice.controls.tooltip.html'
],
definition:function component(sjs){
  "use strict";

  var Class = sjs.Class
  , Controller = sjs.Controller;

  var ToolTip  = Class(function ToolTipController(){
    this.super();
  }).extend(Controller);


}})
