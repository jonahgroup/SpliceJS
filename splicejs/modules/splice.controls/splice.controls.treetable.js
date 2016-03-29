sjs.module({
type:'component'
,
required:[
	{ Inheritance : '/{sjshome}/modules/splice.inheritance.js'},
	{'SpliceJS.UI': '/{sjshome}/modules/splice.ui.js'},
	'splice.controls.treetable.html'
]
,
definition:function(scope){

	var
		imports = scope.imports
	;

	var
	 	Class = imports.Inheritance.Class
	,	UIControl = imports.SpliceJS.UI.UIControl;

	var TreeTable = Class(function TreeTableController(){
		this.super();
	}).extend(UIControl);

	TreeTable.prototype.dataIn = function(){

	};

    scope.exports(
      TreeTable  
    );

}})
