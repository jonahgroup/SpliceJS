sjs.module({
required:[
	{ Inheritance : '/{sjshome}/modules/splice.inheritance.js' },
	{'SpliceJS.UI':'../splice.ui.js'},
	'splice.controls.pageloader.html'
]
,
definition:function component(){

	var
		scope = this.scope
	;

	var
		Class = scope.Inheritance.Class
	,	UIControl = scope.SpliceJS.UI.UIControl
	;


	var PageLoader = Class(function PageLoaderController(){
		this.super();
	}).extend(UIControl);

}

})
