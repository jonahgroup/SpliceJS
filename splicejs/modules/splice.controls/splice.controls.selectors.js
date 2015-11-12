sjs({

required:[
	{'SpliceJS.UI':'../splice.ui.js'},
	{'Doc':'{sjshome}/modules/splice.document.js'},
	'splice.controls.selectors.css',
	'splice.controls.selectors.html'
]
,
definition:function(sjs){
	"use strict";

	/* framework imports */
	var Controller 	= this.sjs.Controller
	,	exports = sjs.exports
	,	event = sjs.event
	,	display = sjs.display
	,	Class = this.sjs.Class
	,	scope = this.scope;

	/* dependency imports */
	var	Positioning = scope.SpliceJS.UI.Positioning
	,	dom = scope.Doc.dom;

	//static single instance
	var dropDownContainer = new scope.components.DropDownContainerResizable()
	,	selectorElement = null;

	//
	var DropDownController = Class(function DropDownController(args){
		this.super(args);

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

	DropDownController.prototype.dataIn = function(data){
		this.data = data;
		if(!this.isIgnoreSelector)
			this.elements.selector.innerHTML = data.toString();
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

		var left = this.elements.selector.offsetLeft
		,	height = this.elements.selector.offsetHeight
		,	top = height
		,	s = dropDownContainer.views.root.htmlElement.style
		,	pos = Positioning.absPosition(this.elements.selector)
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
		display(dropDownContainer).content({default:this.dropDownItemInst}).replace();


		left = pos.x;
		top =  height +  pos.y;

		this.dropDownContainerSize.left = left;
		this.dropDownContainerSize.top = top;


		//set position and display mode of the drop-down container
		s.left = left + 'px';
		s.top =  top + 'px';
		s.display='block';


		event(window).attach({
			onmousedown	:	event.multicast
		}).onmousedown.subscribe(function(args){
			console.log(args);
		})


/*
		// !!!!!! refactor
		this.onModalClose = event(sjs.view(document.body)).attach({
			onmousedown : event.multicast
		}).onmousedown;

		// close on body mouse down
		this.onModalClose.push().subscribe(hide, this).cleanup(function (event) {
			event.unsubscribe(hide);
			event.pop();
		}, this);
*/
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
