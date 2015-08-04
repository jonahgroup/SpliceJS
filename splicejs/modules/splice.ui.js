_.Module({

definition:function(){

	//enable strict mode
	"use strict"; 
	

	var UIElement = _.Namespace('SpliceJS.Controls').Class(function UIElement(args){

		var self = this;
		this.concrete.dom.onclick = function(){
			self.onClick(self);
		}

	}).extend(SpliceJS.Core.Controller);

	UIElement.prototype.onClick = _.Event;



	var UIControl = _.Namespace('SpliceJS.Controls').Class(function UIControl(args){
		SpliceJS.Core.Controller.call(this);
		
		if(this.isHidden) {
			this.prevDisplayState = this.elements.controlContainer.style.display; 
			this.elements.controlContainer.style.display = 'none';
		}

		/* attach style to the controlContainer */
		if(args && args.style)
			this.elements.controlContainer.className += ' ' + args.style; 
		this.dataItem = null;

		var self = this;


		

		this.onDomChanged.subscribe(function(){
			self.applyCSSRules();
		});

	}).extend(SpliceJS.Core.Controller);
	
	UIControl.prototype.hide = function(){
		var self = this;
		
		if(this.isHidden) return;

		this.prevDisplayState = this.elements.controlContainer.style.display; 
		
		if(this.animate){
			_.Animate(this.elements.controlContainer).opacity(100, 0, 300,function(){
				self.elements.controlContainer.style.display = 'none';
			});
		}
		else {
			this.elements.controlContainer.style.display = 'none';
		}
		this.isHidden = true;
	};
	
	UIControl.prototype.show = function(){
		if(this.animate) {
			this.elements.controlContainer.style.opacity = 0;
		}
		
		if(!this.prevDisplayState) this.prevDisplayState = 'inline';
		
		this.elements.controlContainer.style.display = this.prevDisplayState;
		
		if(this.animate) {
			_.Animate(this.elements.controlContainer).opacity(0, 100, 300);
		}
		this.isHidden = false;
	};
	
	UIControl.prototype.changeState = function(args){
		_.debug.log('Changing button\'s state');
		if(args && args.isHidden)
			this.hide();
		else 
			this.show();
	};

	UIControl.prototype.dataIn = function(data){
		this.dataItem = data;
		this.onDataIn(this.dataItem);
	};
	
	UIControl.prototype.dataOut = _.Event;
	UIControl.prototype.onDataIn = _.Event;


	UIControl.prototype.display = function(){
		this.onDisplay();
	}

	/**
	 * Called by the layout manager or a parent view when container dimensions changed and
	 * layout update is required
	 * @param {position: {left:{number}, top:{Number}}} - top left corner position
	 * @param {size: {width:{Number}, height:{Number}}} - parent container' dimensions
	 * */
/*
	UIControl.prototype.onReflow = _.Event;
	UIControl.prototype.reflow = function(position,size,bubbleup){

		if(bubbleup == true) {
			this.reflowChildren(null,null,bubbleup);
			return ;
		}

		// Get style object once and apply settings
		var style = this.concrete.dom.style;
		
		style.left 		= position.left +'px';
		style.top  		= position.top + 'px';
		
		style.width  	= size.width + 'px';
		style.height 	= size.height + 'px';
		
		this.reflowChildren(position,size,bubbleup);

		this.onReflow(position,size);

	};

	UIControl.prototype.reflowChildren = function(position, size,bubbleup){
		
		for(var i=0; i<this.children.length; i++){
			if(typeof this.children[i].reflow !== 'function') continue;

			this.children[i].reflow(position,size,bubbleup);
		}
	};
*/
	UIControl.prototype.applyCSSRules = function(key, override){
		var scope = this.scope, 
			localRules = null, 
			overrideRules = null;

		localRules = scope.cssrules[0];

		if(this.templateCSS) {
			localRules = scope.cssrules[0][this.templateCSS];
		}
		
		if(this.css && this.parentscope) {
			overrideRules = this.parentscope.cssrules[0][this.css];
		}


		if(!localRules && !overrideRules) return;
			
		//apply local CSS rules :)
		var dom = this.concrete.dom;
		dom.id = 'SJS_CURRENT_CSS_TARGET'
		var pseudo = dom.parentNode; 

		if(!pseudo) {
			pseudo = document.createElement('span');
			pseudo.appendChild(this.concrete.dom);
		}

		if(localRules && localRules.length > 0)
			_.CSS.applyRules(localRules, pseudo, dom.id);

		if(overrideRules && overrideRules.length > 0)
			_.CSS.applyRules(overrideRules, pseudo, dom.id);

		dom.removeAttribute('id');
	};



	/*
		Element positioning utilies
	*/
	var Positioning = _.Namespace('SpliceJS.Ui').Class(function Positioning(){});

	Positioning.prototype = {

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
	    
	    //does not include container scroll values
	    //container scrolls must be subtracted
	    absPosition: function(obj_element) {
	        var n = obj_element;
	    	var location  = new Array(0,0);

	    	while (n != undefined) {
	            
	            location[0] += (n.offsetLeft)? n.offsetLeft : 0;
	            location[1] += (n.offsetTop)?  n.offsetTop : 0;
	            
	            location[1] -= n.scrollTop;
	            
	            n = n.offsetParent;
			}
			return {x:location[0],y:location[1]};
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

	SpliceJS.Ui.Positioning = new SpliceJS.Ui.Positioning();

	/*
		Drag and Drop implementation 
	*/

	var DragAndDrop = _.Namespace('SpliceJS.Ui').Class(function DragAndDrop(){});

	DragAndDrop.prototype = {

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
			var p = SpliceJS.Ui.Positioning.mousePosition(event);
			
			this.offset = {x:p.x,y:p.y};
					
			
			
			document.body.onmousemove = function(event) {SpliceJS.Ui.DragAndDrop.drag(event);	};	
			document.body.onmouseup   = function(event) {SpliceJS.Ui.DragAndDrop.stopdrag(event);	}; 	

			
			
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
			var mousePos = SpliceJS.Ui.Positioning.mousePosition(e);
			this.ondrag(mousePos,SpliceJS.Ui.DragAndDrop.offset);
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
            
		},
	        
        addTracker: function(tracker){
            var self = JSDragAndDrop;
            if(!self.trackers) self.trackers = new Array();
            self.trackers.push(tracker);
        }
};

SpliceJS.Ui.DragAndDrop = new SpliceJS.Ui.DragAndDrop();



}});