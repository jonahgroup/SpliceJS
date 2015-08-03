_.Module({

required:[
	_.home('lib/d3-3.5.5/d3.min.js'),
	'splice.controls.d3canvas.html'
],

definition:function(){


	_.Namespace('SpliceJS.Lib').add('d3',d3);

	_.Namespace('SpliceJS.Controls').Class(function D3Canvas(){

		var container = this.elements.controlContainer;

		var d3 = function(){};
		d3.prototype = Object.create(SpliceJS.Lib.d3);
		
		d3.prototype.select = function(node){
			
			/* 
				do not override selection on object types
				only on CSS selectors, since they will run in the document
			*/
			if(typeof node === 'object')
				return SpliceJS.Lib.d3.select(node);

			return SpliceJS.Lib.d3.select(container);
		}

		d3.prototype.selectAll = function(selector){
			var nodes = container.querySelectorAll(selector);
			//var v = SpliceJS.Lib.d3.selectAll(selector);
			var v2 = SpliceJS.Lib.d3.selectAll(nodes);
			v2[0].parentNode = container;
			return v2;
		};

		d3 = new d3();
		this.d3 = d3;

		var self = this;

		this.onDisplay.subscribe(function(){
			self.render(d3);
		});

	}).extend(SpliceJS.Controls.UIControl);


}

});