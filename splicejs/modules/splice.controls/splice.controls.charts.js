_.Module({

required:[
	
	'splice.controls.d3canvas.js',
	'splice.controls.charts.html',
	'splice.controls.charts.css',
	'charts/splice.controls.charts.dial.js',
	'charts/splice.controls.charts.barchart.js'

],

definition:function(){

	var scope = this;

	var Chart = _.Namespace('SpliceJS.Controls').Class(function Chart(){

		var self = this;

		this.width 	= !this.width ? 400 : this.width;
		this.height = !this.height ? 300 : this.height;

	}).extend(SpliceJS.Controls.UIControl);

//end definition
}});