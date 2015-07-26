_.Module({

required:[
	'splice.controls.popup.html',
	'splice.controls.popup.css'
]
,
definition:function(){

	var scope = this.scope;


	var Popup = _.Namespace('SpliceJS.Controls').Class(function Popup(){
		SpliceJS.Controls.UIControl.call(this);
	}).extend(SpliceJS.Controls.UIControl);

	

}

})