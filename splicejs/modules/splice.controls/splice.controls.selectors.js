sjs({

required:[
	{'SpliceJS.UI':'../splice.ui.js'},
	{'Doc':'{sjshome}/modules/splice.document.js'},
	'splice.controls.selectors.css',
	'splice.controls.selectors.html'
]
,
definition:function(){

	/* framework imports */
	var Controller 	= this.sjs.Controller
	,	Event 		= this.sjs.Event
	,	Class 		= this.sjs.Class
	,	scope 		= this.scope;

	/* dependency imports */
	var	Positioning = scope.SpliceJS.UI.Positioning
	,	dom = scope.Doc.dom;

	//static single instance
	var dropDownContainer = new scope.components.DropDownContainerResizable()
	,	selectorElement = null;

	var DropDownController = Class.extend(Controller)(function DropDownController(args){
		this.super();

		var self = this;
	    /*
            Subscribe to onclick instead of mousedown, because firing mousedown
            will immediately execute event within dropDown() closing the dropdown
        */
	    Event.attach(this.elements.root, 'onmousedown').subscribe(function (e) {
				e.cancel();
				this.dropDown();
		}, this);

		/*
			Prevent closing the dropdown when dropdown container body is clicked
		*/
		Event.attach(dropDownContainer.concrete.dom,'onmousedown').subscribe(function(e){
			e.cancel();
		});

		this.dropDownItem = this.dropDownItem;
		if(!this.isIgnoreSelector)	this.isIgnoreSelector = false;

		this.dropDownContainerSize = {left:0,top:0};

	});


	DropDownController.prototype.onDropDown = Event;
	//DropDownController.prototype.onDropDownComplete = Event;


	DropDownController.prototype.dataIn = function(data){
		this.data = data;
		if(!this.isIgnoreSelector)
			this.elements.selector.innerHTML = data.toString();
	};


	DropDownController.prototype.close = function () {
	    hide();
	};


	function hide() {
	    dropDownContainer.concrete.dom.style.display = 'none';
	    document.body.removeChild(dropDownContainer.concrete.dom);
		dom(selectorElement).class.remove('-sjs-dropdown-open');
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
		,	s = dropDownContainer.concrete.dom.style
		,	pos = Positioning.absPosition(this.elements.selector)
		,	self = this
		;

		//release previous selector if any
		if(selectorElement){
			dom(selectorElement).class.remove('-sjs-dropdown-open');
		}

		//create instance of the dropdown content item
		if(!this.dropDownItemInst && this.dropDownItem) {
			this.dropDownItemInst = new this.dropDownItem({parent:this});
		}

		dom(this.elements.selector).class.add('-sjs-dropdown-open');
		selectorElement = this.elements.selector;

		//append drop down to the document root
		document.body.appendChild(dropDownContainer.concrete.dom);

		//dom api for content
		var content = dom(this.dropDownItemInst.concrete.dom);

		// add content to the content element
		dom(dropDownContainer.elements.content).replace(content);


		left = pos.x;
		top =  height +  pos.y;

		this.dropDownContainerSize.left = left;
		this.dropDownContainerSize.top = top;


		//set position and display mode of the drop-down container
		s.left = left + 'px';
		s.top =  top + 'px';
		s.display='block';


		// !!!!!! refactor
		this.onModalClose = Event.attach(document.body, 'onmousedown');

		// close on body mouse down
		this.onModalClose.push().subscribe(hide, this).cleanup(function (event) {
			event.unsubscribe(hide);
			event.pop();
		}, this);

		this.onDropDown(this.data);

	};

	var DropDownContainerController = Class.extend(Controller)(function DropDownContainerController(){

	});




	return {
			DropDownController: DropDownController
	}

}});
