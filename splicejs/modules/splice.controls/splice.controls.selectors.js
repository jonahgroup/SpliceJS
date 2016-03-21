sjs.module({
type:'component'
,
required:[
	{ Inheritance : '/{sjshome}/modules/splice.inheritance.js'},
	{ Events			: '/{sjshome}/modules/splice.event.js'},
	{ Component		: '/{sjshome}/modules/splice.component.core.js'	},
	{	Views 			: '/{sjshome}/modules/splice.view.js'	},
	{'SpliceJS.UI':'../splice.ui.js'},
	{'Doc':'{sjshome}/modules/splice.document.js'},
	'splice.controls.selectors.css',
	'splice.controls.selectors.html'
]
,
definition:function(sjs){
	"use strict";

	/* framework imports */
	var exports = sjs.exports

	,	scope = this.scope
	;

	/* dependency imports */
	var	Positioning = scope.SpliceJS.UI.Positioning
	,	dom = scope.Doc.dom
	,	UIControl = scope.SpliceJS.UI.UIControl
	,	Class = scope.Inheritance.Class
	, Controller = scope.Component.Controller
	,	event = scope.Events.event
	,	display = scope.Views.View.display
	;
	//static single instance
	var dropDownContainer = new scope.components.DropDownContainerResizable()
	,	selectorElement = null;

	function _offFocusReaper(){
		_hide();
	};

	//
	var DropDownController = Class(function DropDownController(args){
		this.base(args);

		event(this).attach({
			onDropDown : event.multicast
		});

		this.dropDownItem = this.dropDownItem;
		if(!this.isIgnoreSelector)	this.isIgnoreSelector = false;

		this.dropDownContainerSize = {left:0,top:0};

	}).extend(Controller);


	DropDownController.prototype.initialize = function(){
			/*
					Subscribe to onclick instead of mousedown, because firing mousedown
					will immediately execute event within dropDown() closing the dropdown
			*/
		event(this.views.root).attach({ onmousedown : event.unicast.stop })
		.onmousedown.subscribe(function(e){
			this.dropDown();
		},this);

	};

	DropDownController.prototype.dataIn = function(data,path){
		if(!this.isIgnoreSelector)
		UIControl.prototype.dataIn.call(this,data);
	};

	DropDownController.prototype.onDataIn = function(item){
		this.content(item.getValue()).replace();
	};

	DropDownController.prototype.close = function () {
	    _hide();
	};


	function _hide() {
	    display.clear(dropDownContainer);
			selectorElement.class('-sjs-dropdown-open').remove();
	};


	DropDownController.prototype.clientSize = function(client){

		var s = dropDownContainer.concrete.dom.style;

		var content = dom(client.concrete.dom);
		/*
			check is position adjustment is required to
			remain in client view
		*/
		var boxWidth = content.box().unit().width;
		var windowWidth = scope.Doc.window.width();

		//adjust left position by the pixels width
		if( (boxWidth + this.dropDownContainerSize.left) > windowWidth ){
			s.left = (windowWidth - boxWidth) + 'px';
		}
	};

	DropDownController.prototype.dropDown = function(){

		var left = this.views.selector.htmlElement.offsetLeft
		,	height = this.views.selector.htmlElement.offsetHeight
		,	top = height
		,	s = dropDownContainer.views.root.htmlElement.style
		,	pos = Positioning.abs(this.views.selector)
		,	self = this
		;

		//release previous selector if any
		if(selectorElement){
			selectorElement.class('-sjs-dropdown-open').remove();
		}

		//create instance of the dropdown content item
		if(!this.dropDownItemInst && this.dropDownItem) {
			this.dropDownItemInst = new this.dropDownItem({parent:this});
		}

		//keep track of the current drop down controller statically
		selectorElement = this.views.selector.class('-sjs-dropdown-open').add();


		//append drop down to the document root
		// add content to the content element
		display(dropDownContainer).content(this.dropDownItemInst).replace();


		left = pos.x;
		top =  height +  pos.y;

		//user to adjust for screen overruns
		this.dropDownContainerSize.left = left;
		this.dropDownContainerSize.top = top;


		//set position and display mode of the drop-down container
		s.left = left + 'px';
		s.top =  top + 'px';
		s.display='block';


		event(window).attach({
			onmousedown	:	event.multicast
		}).onmousedown.subscribe(_offFocusReaper,dropDownContainer);

		this.onDropDown(this.data);

	};

	var DropDownContainerController = Class(function DropDownContainerController(){
	}).extend(Controller);


	/* scope exports for template consumption*/
	exports.scope(
		DropDownController, DropDownContainerController
	);

	/* module exports */
	exports.module(
		DropDownController
	)

}});
