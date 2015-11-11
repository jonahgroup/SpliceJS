sjs({

required:[
	{'SpliceJS.UI':'../splice.ui.js'},
	'splice.controls.pageloader.html'
]
,
definition:function(){

	var scope = this.scope
	,	Class = this.sjs.Class;

	var	UIControl = scope.SpliceJS.UI.UIControl;


	var PageLoader = Class(function PageLoaderController(){
		this.super();
	}).extend(UIControl);

}

})
