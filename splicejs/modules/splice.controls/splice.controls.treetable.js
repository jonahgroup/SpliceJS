sjs({
required:[
	{'SpliceJS.UI':'{sjshome}/modules/splice.ui.js'},
	'splice.controls.treetable.html'
],

definition:function(sjs){
	
	var UIControl = this.scope.SpliceJS.UI.UIControl;
		
	var TreeTable = sjs.Class.extend(UIControl)(function TreeTableController(){
		this.super();	
	});
	
	TreeTable.prototype.dataIn = function(){
			
	};
	
	
	
}	
})