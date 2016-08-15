sjs.module({
prerequisite:[
	'/{sjshome}/modules/splice.module.extensions.js'
],
required:[
	{ Inheritance : '/{sjshome}/modules/splice.inheritance.js' },
	{'SpliceJS.UI':'../splice.ui.js'},
	'splice.controls.pageloader.html'
],
definition:function(scope){

	var
		imports = scope.imports
	;

	var
		Class = imports.Inheritance.Class
	,	UIControl = imports.SpliceJS.UI.UIControl
	;


	var PageLoader = Class(function PageLoaderController(){
		this.base();
	}).extend(UIControl);


    scope.exports(
        PageLoader
    );

}
})
