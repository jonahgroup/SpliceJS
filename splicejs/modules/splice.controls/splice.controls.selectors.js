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
	var Controller 	= this.framework.Controller
	,	Event 		= this.framework.Event
	,	Class 		= this.framework.Class
	,	Positioning = this.SpliceJS.UI.Positioning
	,	Component 	= this.framework.Component
	,	dom = this.Doc.dom;
	
	//static single instance
	var dropDownContainer = new (this.templates['DropDownContainer'])();

	var DropDownController = Class(function DropDownController(args){
		Controller.call(this);
	
		var self = this;
	    /*
            Subscribe to onclick instead of mousedown, because firing mousedown 
            will immediately execute event within dropDown() closing the dropdown
        */
	    Event.attach(this.elements.root, 'onmousedown').subscribe(function (e) {
	        this.dropDown();
	        e.cancel();
		}, this);

		this.dropDownItem = this.dropDownItem;

	}).extend(Controller)


	DropDownController.prototype.onDropDown = Event;


	DropDownController.prototype.dataIn = function(data){
		this.data = data;
		//this.elements.selector.innerHTML = data.toString();		
	};


	DropDownController.prototype.close = function () {
	    this.onModalClose();
	};


	function hide() {
	    dropDownContainer.concrete.dom.style.display = 'none';
	    document.body.removeChild(dropDownContainer.concrete.dom);
	    dom(this.elements.selector).class.remove('-sjs-dropdown-open');
	}

	DropDownController.prototype.dropDown = function(){
		
		var left = this.elements.selector.offsetLeft
		,	height = this.elements.selector.offsetHeight
		,	top = height
		,	s = dropDownContainer.concrete.dom.style
		,	pos = Positioning.absPosition(this.elements.selector)
		,	self = this
		;
		
		if(!this.dropDownItemInst && this.dropDownItem) { 
			this.dropDownItemInst = new this.dropDownItem({parent:this});
		}
		
		dom(this.elements.selector).class.add('-sjs-dropdown-open');

		//append drop down to the document root
		document.body.appendChild(dropDownContainer.concrete.dom);
		
		dom(dropDownContainer.concrete.dom).append(dom(this.dropDownItemInst.concrete.dom));

		//cs.padding.top.value + cs.padding.bottom.value

		left = pos.x;
		top =  height +  pos.y;


		s.left = left + 'px';
		s.top =  top + 'px';

		s.display='block';

		this.onModalClose = Event.attach(document.body, 'onmousedown');

		// close on body mouse down
		this.onModalClose.push().subscribe(hide, this).cleanup(function (event) {
			event.unsubscribe(hide);
			event.pop();
		}, this);
	
		this.onDropDown(this.data);

	};

	return {
		DropDownSelector:Component('DropDownSelector')(DropDownController),
		DropDownController: DropDownController
	}

}});