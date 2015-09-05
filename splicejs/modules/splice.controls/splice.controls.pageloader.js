sjs({

required:[
	{'SpliceJS.UI':'../splice.ui.js'},
	'splice.controls.pageloader.html'
]
,
definition:function(){

	var scope = this.scope
	,	Class = this.Class;
	
	var	UIControl = scope.SpliceJS.UI.UIControl;


	Class.extend(UIControl)(function PageLoaderController(){
		this.super();
	});

}

})