/*blobal sjs */
sjs({
required:[
	{'Animation':'{sjshome}/modules/splice.animation.js'}
],
definition:function(){

	//enable strict mode
	"use strict";

	// importing framework features makes our code less verbose
	var Class = this.sjs.Class
	, Event = this.sjs.Event
	,	debug = this.sjs.debug
	, Controller = this.sjs.Controller
	,	scope = this.scope;

	var Animate = scope.Animation.Animate;

	/**
	 * Base UIControl class
	 */
	var UIControl = Class.extend(Controller)(function UIControl(args){
		this.super(args);


		if(this.isHidden) {
			this.prevDisplayState = this.elements.root.style.display;
			this.elements.root.style.display = 'none';
		}

		this.dataItem = null;

		var self = this;

		this.onDomChanged.subscribe(function(){
			self.applyCSSRules();
		});

	});

	UIControl.prototype.hide = function(){
		var self = this;

		if(this.isHidden) return;

		this.prevDisplayState = this.elements.root.style.display;

		if(this.animate){
			Animate(this.elements.root).opacity(100, 0, 300,function(){
				self.elements.root.style.display = 'none';
			});
		}
		else {
			this.elements.root.style.display = 'none';
		}
		this.isHidden = true;
	};

	UIControl.prototype.show = function(){
		if(!this.isHidden) return;
		if(this.animate) {
			this.elements.root.style.opacity = 0;
		}

		if(!this.prevDisplayState) this.prevDisplayState = 'inline';

		this.elements.root.style.display = this.prevDisplayState;

		if(this.animate) {
			Animate(this.elements.root).opacity(0, 100, 300);
		}
		this.isHidden = false;
	};

	UIControl.prototype.changeState = function(args){
		if(args && args.isHidden)
			this.hide();
		else
			this.show();
	};

	UIControl.prototype.dataIn = function(data){
		this.dataItem = data;
		this.onDataIn(this.dataItem);
	};

	UIControl.prototype.dataOut  = Event;
	UIControl.prototype.onDataIn = Event;
	UIControl.prototype.onReflow = Event;

	/**
	 * Called by the layout manager or a parent view when container dimensions changed and
	 * layout update is required
	 * @param {position: {left:{number}, top:{Number}}} - top left corner position
	 * @param {size: {width:{Number}, height:{Number}}} - parent container' dimensions
	 * */
	UIControl.prototype.reflow = function(position,size,bubbleup){
		if(!this.concrete || !this.concrete.dom) return;

		if(bubbleup == true) {
			this.reflowChildren(null,null,bubbleup);
			return ;
		}

		// Get style object once and apply settings
		if(this.layout !== 'css') {
			var style = this.concrete.dom.style;

			style.left 		= position.left +'px';
			style.top  		= position.top + 'px';

			style.width  	= size.width + 'px';
			style.height 	= size.height + 'px';
		}

		this.reflowChildren(position,size,bubbleup);

		this.onReflow(position,size);

	};

	UIControl.prototype.reflowChildren = function(position, size,bubbleup){

		for(var i=0; i<this.children.length; i++){
			if(typeof this.children[i].reflow !== 'function') continue;

			this.children[i].reflow(position,size,bubbleup);
		}
	};



	//returns zero or a value
	function z(n){
		if(!n) return 0;
		return n;
	}

	/**
	 * HTML Element decorator
	 */
	var UIElement = Class.extend(UIControl)(function UIElement(args){
		this.super();
		var self = this;
		this.concrete.dom.onclick = function(){
			self.onClick(self);
		}
	});

	UIElement.prototype.onClick = Event;


	/*
		Element positioning utilies
	*/
	var Positioning =  {

		//@ Take mouse event object to return mouse position coordinates
	    mousePosition:function(e){
	        //http://www.quirksmode.org/js/events_properties.html#position
		var posx = 0;
		var posy = 0;
		if (!e) var e = window.event;
		if (e.pageX || e.pageY) 	{
			posx = e.pageX;
			posy = e.pageY;
		}
		else if (e.clientX || e.clientY) 	{
			posx = e.clientX + document.body.scrollLeft
				+ document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop
				+ document.documentElement.scrollTop;
		}
		return {x:posx,y:posy};
	    },

	    /*
	    	Returns element coordinates in
	    	document.body coordinate space
	    */
	    absPosition: function(obj_element) {
	        var n = obj_element;
	    	var location  = new Array(0,0);

	    	while (n != undefined) {

	            location[0] += z(n.offsetLeft);
	            location[1] += z(n.offsetTop);

	            location[1] -= n.scrollTop;

	            n = n.offsetParent;
			}

			return {
				x:location[0] + z(document.body.scrollLeft),
				y:location[1] + z(document.body.scrollTop)
			};
	    },


	    containsPoint:function(element,p) {
	        pos = JSPositioning.absPosition(element);

			pos.height = element.clientHeight;
			pos.width = element.clientWidth;

			if( p.x >= pos.x && p.x <= (pos.x + pos.width)) {
			if(p.y >= pos.y && p.y <= pos.y + (pos.height / 2))
	            return 1;
			else if(p.y >= pos.y + (pos.height / 2) && p.y <= pos.y + pos.height )
	            return -1;
			}
	            return 0;
	    },

	    documentDimensions:function(){
	        docWidth = 0;
	        docHeight = 0;

	        docWidth = document.body.offsetWidth?document.body.offsetWidth:window.innerWidth;
	        docHeight = document.body.offsetHeight?document.body.offsetHeight:window.innerHeight;

	        return {width:docWidth, height:docHeight};
	    },

	    windowDimensions: function () {
	        return { width: window.innerWidth, height: window.innerHeight };
	    }
	};



	/*
		Drag and Drop implementation
	*/

	var DragAndDrop =  {

		draggable:null,
		dummy:null,
		started:false,

		/* contains position of the original click */
	    offset:null,

		//array of DOM elements that track drop event
	    trackers:null,

	    startDrag:function(elementnode, event){

	    	this.ondragfired = false;

	    	this.disableSelection(document.body, event);
			//get original position of the trigger node
			//p = JSPositioning.absPosition(elementnode);
			var p = Positioning.mousePosition(event);

			this.offset = {x:p.x,y:p.y};

			document.body.onmousemove = function(event) {DragAndDrop.drag(event);	};
			document.body.onmouseup   = function(event) {DragAndDrop.stopdrag(event);	};

			// event.preventDefault();
	        this.onpickup(p);
		},

		stopdrag:function(e) {


			document.body.onmousemove = function(){};
			document.body.onmouseup = function(){};


			this.enableSelection(document.body);
			this.ondragfired = false;
			this.onstop();
		},

		drag:function(e) {
			var mousePos = Positioning.mousePosition(e);
			this.ondrag(mousePos,DragAndDrop.offset);
			if(this.ondragfired === false) {
				this.onbegin();
			}
			this.ondragfired = true;
			document.body.style.cursor='default';
		},

		onpickup:function(){},
		onbegin:function(){},
	    ondrag:function(){},
	    ondrop:function(){},
	    onstop:function(){},

	    setOpacity:function(element,value){
			element.style.opacity = value/100;
			element.style.filter = 'alpha(opacity=' + value + ')';
			element.style.zindex = 100;
		},

		disableSelection: function(element) {
            element.onselectstart = function() {return false;};
            element.unselectable = "on";
            element.style.MozUserSelect = "none";

		},

		enableSelection: function(element){
            element.onselectstart = null;
            element.unselectable = "off";
            element.style.MozUserSelect = "all";

		}
	};

	/**
	 * Global KeyListener
	 *
	 */
	var KeyListener = Class(function KeyListener(){

			Event.attach(window, 'onkeydown').subscribe(
			function(args){
				switch(args.keyCode){
					case 27: this.onEsc(); 		break;
					case 13: this.onEnter(); 	break;
					case 37: this.onLeft(); 	break;
					case 38: this.onUp();		break;
					case 39: this.onRight(); 	break;
					case 40: this.onDown();		break;
				}
			}, this);
	});

	KeyListener.prototype.onEsc 	= Event;
	KeyListener.prototype.onEnter	= Event;
	KeyListener.prototype.onRight 	= Event;
	KeyListener.prototype.onLeft	= Event;
	KeyListener.prototype.onUp 		= Event;
	KeyListener.prototype.onDown 	= Event;

	//module exports
	return {
		UIControl:	 UIControl,
		UIElement:	 UIElement,
		KeyListener: KeyListener,
		//singletons
		Positioning: Positioning,
		DragAndDrop: DragAndDrop
	}


}});
