_.Module({

required:[
	{'SpliceJS.UI':'../splice.ui.js'},
	'splice.controls.selectors.css',
	'splice.controls.selectors.html'
]
,
definition:function(){	
	
	/* framework imports */
	var Controller 	= this.framework.Controller
	,	Event 		= this.framework.Event
	,	Positioning = this.SpliceJS.UI.Positioning
	,	Component 	= this.framework.Component;

	var DropDownSelector = Component('DropDownSelector')( function DropDownSelector(){
		Controller.call(this);
	
		var self = this;
	    /*
            Subscribe to onclick instead of mousedown, because firing mousedown 
            will immediately execute event within dropDown() closing the dropdown
        */
	    Event.attach(this.elements.controlContainer, 'onmousedown').subscribe(function (e) {
	        this.dropDown();
	        e.cancel();
		}, this);

	}).extend(Controller)


	DropDownSelector.prototype.onDropDown = Event;


	DropDownSelector.prototype.dataIn = function(data){
		this.data = data;
		this.elements.selector.innerHTML = data.toString();		
	};


	DropDownSelector.prototype.close = function () {
	    this.onModalClose();
	};


	function hide() {
	    this.elements.dropdownContainer.style.display = 'none';
	    document.body.removeChild(this.elements.dropdownContainer);
	    this.elements.selector.className = 'selector';
	}

	DropDownSelector.prototype.dropDown = function(){
		
		var left = this.elements.selector.offsetLeft
		,	height = this.elements.selector.offsetHeight
		,	top = height
		,	s = this.elements.dropdownContainer.style
		,	pos = Positioning.absPosition(this.elements.selector)
		,	self = this
		;
		

		this.elements.selector.className = 'selector open';

		//append drop down to the document root
		document.body.appendChild(this.elements.dropdownContainer);

		//cs.padding.top.value + cs.padding.bottom.value

		left = pos.x;
		top =  height +  pos.y;


		s.left = left + 'px';
		s.top =  top + 'px';

		s.display='block';

		this.onModalClose = _.Event.attach(document.body, 'onmousedown');

		// close on body mouse down
		this.onModalClose.push().subscribe(hide, this).cleanup(function (event) {
			event.unsubscribe(hide);
			event.pop();
		}, this);
	
		this.onDropDown();

	};

	return {
		DropDownSelector:DropDownSelector
	}

}});