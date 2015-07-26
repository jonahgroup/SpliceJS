_.Module({

required:[
	'splice.controls.pageloader.html',
]
,
definition:function(){

	var scope = this.scope;


	var Pageloader = _.Namespace('SpliceJS.Controls').Class(function Pageloader(){
		SpliceJS.Controls.UIControl.call(this);
	}).extend(SpliceJS.Controls.UIControl);

	

}

})