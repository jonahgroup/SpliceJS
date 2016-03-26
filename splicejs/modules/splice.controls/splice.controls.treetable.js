sjs.module({
type:'component'
,
required:[
	{ Inheritance : '/{sjshome}/modules/splice.inheritance.js'},
	{'SpliceJS.UI': '/{sjshome}/modules/splice.ui.js'},
	'splice.controls.treetable.html'
]
,
definition:function(sjs){

	var
		scope = this.scope
	;

	var
	 	Class = scope.Inheritance.Class
	,	UIControl = scope.SpliceJS.UI.UIControl;

	var TreeTable = Class(function TreeTableController(){
		this.super();
	}).extend(UIControl);

	TreeTable.prototype.dataIn = function(){

	};

}})
