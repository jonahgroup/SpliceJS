_.Module({

required:[
	_.home('lib/d3-3.5.5/d3.min.js'),
	'splice.controls.d3canvas.htmlt'
],

definition:function(){


	_.Namespace('SpliceJS.Lib').add('d3',d3);

	_.Namespace('SpliceJS.Controls').Class(function D3Canvas(){

		var container = this.elements.controlContainer;

		var d3 = function(){};
		d3.prototype = Object.create(SpliceJS.Lib.d3);
		d3.prototype.select = function(){
			return SpliceJS.Lib.d3.select(container);
		}

		d3 = new d3();
		var self = this;

		this.onDisplay.subscribe(function(){
			self.render(d3);
		});

	}).extend(SpliceJS.Controls.UIControl);


}

});