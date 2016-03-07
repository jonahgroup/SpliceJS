sjs.module({
required:[
	{'SpliceJS.UI':'{sjshome}/modules/splice.ui.js'},
	'splice.controls.treetable.html'
],

definition:function component(sjs){

	var UIControl = this.scope.SpliceJS.UI.UIControl;

	var TreeTable = sjs.Class(function TreeTableController(){
		this.super();
	}).extend(UIControl);

	TreeTable.prototype.dataIn = function(){

	};



}
})
