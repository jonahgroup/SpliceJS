sjs({

required:[
	{'SpliceJS.UI':'../splice.ui.js'},
	'splice.controls.pageloader.html'
]
,
definition:function(){

	var Class = this.framework.Class
	,	UIControl = this.SpliceJS.UI.UIControl


	var PageLoader = Class(function PageLoader(){
		UIControl.call(this);
	}).extend(UIControl);

	
	return {
		
		PageLoader: PageLoader
		
	}

}

})