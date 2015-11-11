sjs({
required:[
  {'SpliceJS.UI':'{sjshome}/modules/splice.ui.js'},
  'splice.controls.tooltip.html'
],
definition:function(sjs){
  "use strict";

  var Class = sjs.Class
  , Controller = sjs.Controller;

  var ToolTip  = Class(function ToolTipController(){
    this.super();
  }).extend(Controller);


}})
