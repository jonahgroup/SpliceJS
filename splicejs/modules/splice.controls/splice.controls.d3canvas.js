/* global d3 */
_.Module({

required:[
	{'SpliceJS.UI':'../splice.ui.js'},
	_.home('lib/d3-3.5.5/d3.min.js'),
	'splice.controls.d3canvas.html'
],

definition:function(){

	var Class = this.framework.Class;
	var UIControl = this.SpliceJS.UI.UIControl;

	_.Namespace('SpliceJS.Lib').add('d3',d3);

	var D3 = function D3(container){this.container = container;}
	D3.prototype = Object.create(d3);

	D3.prototype.select = function(node){
		/* 
			do not override selection on object types
			only on CSS selectors, since they will run in the document
		*/
		if(typeof node === 'object')
			return d3.select(node);
		return d3.select(this.container);
	}

	D3.prototype.selectAll = function(selector){
		var nodes = this.container.querySelectorAll(selector);
		
		var v2 = d3.selectAll(nodes);
		v2[0].parentNode = this.container;
		return v2;
	};


	var D3Canvas = Class(function D3Canvas(){
		UIControl.call(this);
		
		this.d3 = new D3(this.elements.controlContainer);

		var self = this;

		this.onDisplay.subscribe(function(){
			self.render(d3);
		});

	}).extend(UIControl);

	d3 = null;

	return {
		D3Canvas:D3Canvas
	}
}

});