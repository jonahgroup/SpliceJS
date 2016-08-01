sjs.module({
prerequisite:[
	'/{sjshome}/modules/splice.module.extensions.js'
],
required:[
	{ Inheritance   : '/{sjshome}/modules/splice.inheritance.js'},
	{ Events		: '/{sjshome}/modules/splice.event.js'},
	{ Component		: '/{sjshome}/modules/splice.component.core.js'	},
	{ Views 		: '/{sjshome}/modules/splice.view.js'	},
	{'SpliceJS.UI'  : '../splice.ui.js'},
	{'Doc'          : '/{sjshome}/modules/splice.document.js'},
	'splice.controls.selectors.css',
	'splice.controls.selectors.html'
]
,
definition:function(scope){
	"use strict";

	/* framework imports */
	var
        sjs = scope.sjs
    ,   imports = scope.imports
	;

	/* dependency imports */
	var	Positioning = imports.SpliceJS.UI.Positioning
	,	dom         = imports.Doc.dom
	,	UIControl   = imports.SpliceJS.UI.UIControl
	,	Class       = imports.Inheritance.Class
	, Controller  = imports.Component.Controller
	,	Events      = imports.Events
	, Views 			= imports.Views
	,	display     = imports.Views.View.display
	,	DomMulticastEvent = imports.Views.DomMulticastEvent
	, DefineComponents = imports.Component.DefineComponents
	, MulticastEvent = imports.Events.MulticastEvent
	;
	//static single instance
	var dropDownContainer = null//new scope.components.DropDownContainerResizable()
	,	selectorElement = null;

	function _offFocusReaper(){
		_hide();
	};

	//define components
	var components = DefineComponents(scope,'splice.controls.selectors.html');


	//
	var DropDownController = Class(function DropDownController(args){
		this.base(args);

		Events.attach(this,{
			onDropDown : Events.MulticastEvent
		});

		this.dropDownItem = this.dropDownItem;
		if(!this.isIgnoreSelector)	this.isIgnoreSelector = false;

		this.dropDownContainerSize = {left:0,top:0};
		this.dataPath = '';

	}).extend(Controller);


	DropDownController.prototype.initialize = function(){
			/*
					Subscribe to onclick instead of mousedown, because firing mousedown
					will immediately execute event within dropDown() closing the dropdown
			*/
		Events.attach(this.views.root,{
			onmousedown : Views.DomMulticastStopEvent
		})
		.onmousedown.subscribe(function(e){
			this.dropDown();
		},this);

	};

	DropDownController.prototype.dataIn = function(data){
		if(this.itemTemplate){
				var item = this.itemTemplate({parent:this});
				item.dataIn(data);
				return;
		}
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


		Events.attach(window, {
		 	onmousedown	:	Views.DomMulticastStopEvent
		}).onmousedown.subscribe(_offFocusReaper,dropDownContainer);

		this.onDropDown(this.data);

	};

	var DropDownContainerController = Class(function DropDownContainerController(){
	}).extend(Controller);


	/* scope exports for template consumption*/
	scope.add(
		DropDownController, DropDownContainerController
	);

	/* module exports */
	scope.exports(
		DropDownController
	)

}});
