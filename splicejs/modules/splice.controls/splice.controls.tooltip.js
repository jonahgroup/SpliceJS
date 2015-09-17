sjs({
required:[
  {'SpliceJS.UI':'{sjshome}/modules/splice.ui.js'},
  'splice.controls.tooltip.html'
],
definition:function(sjs){

  var UIControl = this.scope.SpliceJS.UI.UIControl;

  var ToolTip  = sjs.Class.extend(UIControl)(function ToolTipController(){

  });


}})
