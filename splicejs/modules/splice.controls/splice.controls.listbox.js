_.Module({

required:[ 
	'modules/splice.ui.js',
	'modules/splice.controls/splice.controls.listbox.css',
	'modules/splice.controls/splice.controls.listbox.htmlt'
],

definition:function(){

	var ListBox = _.Namespace('SpliceJS.Controls').Class(function ListBox(){

	}).extend(SpliceJS.Controls.UIControl);


	var ListItem = _.Namespace('SpliceJS.Controls').Class(function ListItem(args){

	});

}


});