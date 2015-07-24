_.Module({
required:[
		'splice.controls.treeview.css'
	,	'splice.controls.treeview.html'
]
,
definition:function(){


	var TreeView = _.Namespace('SpliceJS.Controls').Class( function TreeView(){
		SpliceJS.Controls.UIControl.call(this);		
	}).extend(SpliceJS.Controls.UIControl);

}


});