/* global _*/
sjs({

required:[
	{'SpliceJS.UI':'{sjshome}/modules/splice.ui.js'},
	 'splice.controls.controllers.html'
],


definition:function(){
	var sjs = this.sjs;

	var scope = this.scope
	,	event = sjs.event
	,	exports = sjs.exports;

	var Class = sjs.Class
	,	Controller = sjs.Controller
	, UIControl = scope.SpliceJS.UI.UIControl;

	var DomIterator = Class(function DomIteratorController(args){
		this.super();
		this.elements = [];

		event(this).attach({
			onStyleSelect : event.multicast
		});

	}).extend(UIControl);

	DomIterator.prototype.initialize = function(){
	};

	DomIterator.prototype.onDataItemChanged = function(item){
		var i = item.fullPath().split('.')[0];
		if(this.dataItemPath) {
			this.elements[i].dataIn(this.dataItem.path(i+'.'+this.dataItemPath));
		}
		else {
			this.elements[i].content(this.dataItem.path(i).getValue()).replace();
			this.elements[i].dataIn(this.dataItem.path(i));
		}
	};

	DomIterator.prototype.onDataIn = function(dataItem){
		if(this.element == null) return;

		var source = dataItem.getValue();
		if(!(source instanceof Array)) return;

		//update existing elements
		for(var i=0; i < this.elements.length; i++){
			var element = this.elements[i];
			element.content(source[i]).replace();
			element.dataIn(dataItem.path(i));
		}

		//create new elements
		for(var i = this.elements.length; i < source.length; i++){
			var element = new this.element({parent:this});
			element.content(source[i]).replace();
			this.content(element).add();
			element.dataIn(dataItem.path(i));

			//cache elements
			this.elements.push(element);
		}
	};


	//scope exports
	exports.scope(
		DomIterator
	);

	//module exports
	exports.module(
		DomIterator
	);

}

}); //module declaration end
