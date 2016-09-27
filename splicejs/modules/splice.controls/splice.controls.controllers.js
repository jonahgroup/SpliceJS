/* global sjs*/
$js.module({
prerequisite:[
  '/{$jshome}/modules/splice.module.extensions.js'
],
imports:[
	{ Inheritance: 	'/{$jshome}/modules/splice.inheritance.js'},
	{ Component: 	'/{$jshome}/modules/splice.component.core.js'},
	{ Events: 		'/{$jshome}/modules/splice.event.js'},
  	{ Async:    	'/{$jshome}/modules/splice.async.js'},
	{'SpliceJS.UI':	'/{$jshome}/modules/splice.ui.js'},
	 'splice.controls.controllers.html'
],
definition:function(){
	"use strict";
	var scope = this
	,	sjs = this.imports.$js;

	var
    	imports = scope.imports
    ;

	var Class = imports.Inheritance.Class
	,	Controller = imports.Component.Controller
	, 	UIControl = imports.SpliceJS.UI.UIControl
  	, 	asyncLoop = imports.Async.asyncLoop
	,	Events = imports.Events
	;

	var DomIterator = Class(function DomIteratorController(args){
		this.base();
		this.elements = [];

		Events.attach(this,{
			onStyleSelect : Events.MulticastEvent
		});
	}).extend(UIControl);

	DomIterator.prototype.initialize = function(){
	};

	DomIterator.prototype.dataItemChanged = function(item){
		var i = item.fullPath().split('.')[0];
		var di = null;

		//cleanup deleted elements
		if(item.isDeleted == true){
			this.content(this.elements[i]).remove();
			return;
		}

		if(this.dataItemPath) {
			di = this.dataItem.path(i+'.'+this.dataItemPath);
		}
		else {
			di = this.dataItem.path(i);
		}

		if(this.elements[i]){
			this.elements[i].content(di.getValue()).replace();
			this.elements[i].dataIn(di);
		} else {
			var element = new this.element({parent:this});
			element.content(di.getValue()).replace();
			this.content(element).add();
			element.dataIn(di);

			//cache elements
			this.elements.push(element);
		}
	};

	DomIterator.prototype.onDataIn = function(dataItem){
		if(this.element == null) return;

		dataItem.subscribe(this.dataItemChanged, this);

		var source = dataItem.getValue();
		if(!(source instanceof Array)) return;

		//update existing elements
		for(var i=0; i < this.elements.length; i++){
			var element = this.elements[i];
			element.content(source[i]).replace();
			element.dataIn(dataItem.path(i));
		}


        asyncLoop(this.elements.length, source.length-1,100, function(i){
   			var element = new this.element({parent:this});
			element.content(source[i]).replace();
			this.content(element).add();
			element.dataIn(dataItem.path(i));

			//cache elements
			this.elements.push(element);
            return true;

        }.bind(this));

/*
		//create new elements
		for(var i = this.elements.length; i < source.length; i++){
			var element = new this.element({parent:this});
			element.content(source[i]).replace();
			this.content(element).add();
			element.dataIn(dataItem.path(i));

			//cache elements
			this.elements.push(element);
		}
  */
	};


	//scope exports
	scope.add(
		DomIterator
	);

	//module exports
	scope.exports(
		DomIterator
	);

}
}) //module declaration end
