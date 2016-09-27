$js.module({
prerequisite:[
	'/{$jshome}/modules/splice.module.extensions.js'
],
imports:[
	{ Inheritance : '/{$jshome}/modules/splice.inheritance.js'},
	{'SpliceJS.UI': '/{$jshome}/modules/splice.ui.js'},
	'splice.controls.treetable.html'
]
,
definition:function(){

	var scope = this;

	var
		imports = scope.imports
	;

	var
	 	Class = imports.Inheritance.Class
	,	UIControl = imports.SpliceJS.UI.UIControl;

	var TreeTable = Class(function TreeTableController(){
		this.base();
	}).extend(UIControl);

	TreeTable.prototype.dataIn = function(){

	};

    scope.exports(
      TreeTable  
    );

}})
