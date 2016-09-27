$js.module({
prerequisite:[
	'/{$jshome}/modules/splice.module.extensions.js'
],
imports:[
	{ Inheritance : '/{$jshome}/modules/splice.inheritance.js' },
	{'SpliceJS.UI':'../splice.ui.js'},
	'splice.controls.pageloader.html'
],
definition:function(){
	var scope = this;

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
