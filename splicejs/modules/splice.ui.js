/*blobal sjs */
sjs({
required:[
	{'Animation':'{sjshome}/modules/splice.animation.js'}
],
definition:function(sjs){
	//enable strict mode
	"use strict";

	// importing framework features makes our code less verbose
	var Class = this.sjs.Class
	, Event = this.sjs.Event
	,	debug = this.sjs.debug
	, Controller = this.sjs.Controller
	,	scope = this.scope;

	var event = sjs.event
	,	exports = sjs.exports;

	var Animate = scope.Animation.Animate;


	var DataItem = function DataItem(data){
		this.source = data;
		this.parent = null;
		this.pathmap = {};
	};

	DataItem.prototype.getValue = function(){
		if(this.source == null) return null;
		if(this._path == null) return this.source;
		return this.source[this._path];
	}

	DataItem.prototype.setValue = function(value){
		if(this.source == null) return null;
		if(this._path == null) return;
		var old = this.source[this._path];
		//same value no change
		if(old === value) return;
		this.source[this._path] = value;

		var node = this;
		while(node != null){
			if(node.onChanged) {
				node.onChanged(this, old);
				break;
			}
			node = node.parent;
		}
	}

	/**
		returns child DataItem
	*/
	DataItem.prototype.path = function(path){
		if(path == null || path === '') return this;

		var parts = path.toString().split('.');

		var parent = this;
		for(var i=0; i < parts.length; i++){

			var child = parent.pathmap[parts[i]];
			var ref = parent._path != null?parent.source[parent._path] : parent.source;

			if(child == null || ref[parts[i]] == null) {
				child = new DataItem(ref);
				child._path = parts[i];
				parent.pathmap[parts[i]] = child;
				child.parent = parent;

				if(ref[parts[i]] == null) return child;
			}
			parent = child;
		}
		return parent;
	};

	DataItem.prototype.fullPath = function(){
		var node = this;
		var path = '';
		while(node != null){
			if(node._path != null)
				path = node._path +'.'+ path;
			node = node.parent;
		}
		return path;
	};

	DataItem.prototype.subscribe = function(handler, instance){
		var node = this;
		while(node != null){
			if(node.onChanged) {
				node.onChanged.subscribe(handler,instance);
				break;
			}
			node = node.parent;
		}
	};

	/*
		- adds an item is source is a collection or a map
		- throws and exception if the 'slot' is not empty
	*/
	DataItem.prototype.append = function(value){
		if(!(this.source instanceof Array)) return null;
		return this.path(this.source.length);
	};

	/*
		- removes an item at a given key if source is a collection
	*/
	DataItem.prototype.remove = function(key){

	};


	/**
	* Create a DataItem object with onChanged event
	*/
	var ObservableDataItem = function ObservableDataItem(data){
		return event(new DataItem(data)).attach({
			onChanged : event.multicast
		});
	};


	/**
	 * Base UIControl class
	 */
	var UIControl = Class(function UIControl(args){
		this.super(args);

		event(this).attach({
			onDataOut  : event.multicast,
			onReflow : event.multicast
		});


		if(this.isHidden) {
			this.prevDisplayState = this.elements.root.style.display;
			this.elements.root.style.display = 'none';
		}
		this.dataItem = null;

	}).extend(Controller);

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
	/* Data Contract */
	/*!!!!! make sure to unsubscribe when data items changes */
	UIControl.prototype.dataIn = function(item){

		if(item instanceof DataItem) {
				if(this.dataItem === item) {
					this.onDataIn(this.dataItem);
					return;
				}
				this.dataItem = item.path(this.dataPath);
				this.onDataIn(this.dataItem);
			return;
		}
		// datapath is only set externally
		this.dataItem = new DataItem(item, this.dataPath);
		event(this.dataItem).attach({
				onChanged : event.multicast
		});
		// invode data-item handler
		this.onDataIn(this.dataItem);
	};

	UIControl.prototype.onDataItemChanged = function(dataItem){};

	UIControl.prototype.onDataIn = function(data){
		this.onDataOut(data);
	};

	UIControl.prototype.initialize = function(){
		var fn = sjs.fname(this.constructor)
		if(fn === 'UIControl') return;
		console.warn(fn + '.initialize is not implemented');
	};





	/**
	 * Called by the layout manager or a parent view when container dimensions changed and
	 * layout update is required
	 * @param {position: {left:{number}, top:{Number}}} - top left corner position
	 * @param {size: {width:{Number}, height:{Number}}} - parent container' dimensions
	 * */
	UIControl.prototype.reflow = function(position,size,bubbleup){
		if(!this.views || !this.views.root) return;

		if(bubbleup == true) {
			this.reflowChildren(null,null,bubbleup);
			return ;
		}




		// Get style object once and apply settings
		if(this.layout !== 'css') {
			var style = this.views.root.htmlElement.style;

			style.left 		= position.left +'px';
			style.top  		= position.top + 'px';

			style.width  	= size.width + 'px';
			style.height 	= size.height + 'px';
		}

		if(this._lastWidth != size.width || this._lastHeight != size.height ) {
			this.reflowChildren(position,size,bubbleup);
		}

		this._lastWidth = size.width;
		this._lastHeight = size.height;

		this.onReflow(position,size);

	};

	UIControl.prototype.reflowChildren = function(position, size,bubbleup){

		for(var i=0; i<this.__sjs_visual_children__.length; i++){
			if(typeof this.__sjs_visual_children__[i].reflow !== 'function') continue;
			this.__sjs_visual_children__[i].reflow(position,size,bubbleup);
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
	var UIElement = Class(function UIElement(args){
		this.super();
		event(this).attach({onClick : event.multicast});
	}).extend(UIControl);

	UIElement.prototype.initialize = function(){
		event(this.views.root).attach({onclick : event.unicast})
		.onclick.subscribe(function(){this.onClick(this);}, this);
	};


	/*
		Element positioning utilies
	*/
	var Positioning =  {

		//@ Take mouse event object to return mouse position coordinates
	  mouse:function(e){
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
    abs: function(obj) {
      var n = obj;
			if(obj instanceof sjs.types.View)
				n = obj.htmlElement;
			var location  = [0,0];

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
	    pos = this.abs(element);

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

	  docsize:function(){
      var docWidth = document.body.offsetWidth?document.body.offsetWidth:window.innerWidth;
      var docHeight = document.body.offsetHeight?document.body.offsetHeight:window.innerHeight;

      return {width:docWidth, height:docHeight};
	  },

	  windowsize: function () {
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
			var p = Positioning.mouse(event);

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
			var mousePos = Positioning.mouse(e);
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

		event(this).attach({
			onEsc		:	event.multicast,
			onEnter	: event.multicast,
			onRight : event.multicast,
			onLeft  : event.multicast,
			onUp		: event.multicast,
			onDown 	: event.multicast
		});

		Event.attach(window, 'onkeydown').subscribe(
		function(args){
			switch(args.keyCode){
				case 27: this.onEsc(); 		break;
				case 13: this.onEnter(); 	break;
				case 37: this.onLeft(); 	break;
				case 38: this.onUp();			break;
				case 39: this.onRight(); 	break;
				case 40: this.onDown();		break;
			}
		}, this);

	});


	//module exports
	exports.module(
		UIControl, UIElement, KeyListener,
		DataItem,ObservableDataItem,
		//singletons
		{Positioning : Positioning},
		{DragAndDrop : DragAndDrop}
	);


}});
