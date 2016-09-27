$js.module({
prerequisite:[
	'/{$jshome}/modules/splice.module.extensions.js'
],
imports:[
	{ Inheritance   : '/{$jshome}/modules/splice.inheritance.js'},
	{ Events	    : '/{$jshome}/modules/splice.event.js'},
	{ Component		: '/{$jshome}/modules/splice.component.core.js'	},
	{'SpliceJS.UI'  : '../splice.ui.js'},
	{'Doc'          : '/{$jshome}/modules/splice.document.js'},
	'splice.controls.scrollpanel.css',
	'splice.controls.scrollpanel.html'
]
,
definition:function(){
	var scope = this
	,	sjs = scope.imports.$js;

	var isTouch 	= false
	, 	isMobile 	= false;

    var imports = scope.imports
    ;

	var	select = imports.Doc.select
	,	create = imports.Doc.create
	, 	UIControl 	= imports.SpliceJS.UI.UIControl
	, 	DragAndDrop = imports.SpliceJS.UI.DragAndDrop
	,	Controller = imports.Component.Controller
	,	Class = imports.Inheritance.Class
	,	event = imports.Events.event
    ;

	var ScrollPanel = Class(function ScrollPanelController(args){
		this.base(args);
		event(this).attach({
			onScroll : event.multicast
		});

		this.horizontalDisable = this.isDisableHorizontal;

		var self = this;
		/* Current scroll offset */
		this.currentScrollTop = 0;
		/* scroll content by default */
		this.isScrollClient = true;


		/* Setup touch events on touch enabled platforms */
		if(isTouch && !isMobile){
			this.clippingArea.addEventListener( 'touchstart', function(e){self.onTouchStart(e);},	false );
			this.clippingArea.addEventListener( 'touchend',   function(e){self.onTouchEnd(e);}, 	false );
			this.clippingArea.addEventListener( 'touchmove',  function(e){self.onTouchMove(e);}, 	false );
		}

		this.onDisplay.subscribe(function(){
			self.display();
		});

	}).extend(UIControl);

	ScrollPanel.prototype.initialize = function(){
		this.domRoot = this.views.root.htmlElement;

		/* Scrollable content client */
		this.client = this.views.scrollClient.htmlElement;
		/* */
		this.clippingArea = this.views.clippingArea.htmlElement;

	};


	ScrollPanel.prototype.display = function(){
		this.reflow();
	};


	ScrollPanel.prototype.onTouchStart = function(e){
		this.touchStart = {x:e.touches[0].pageX, y:e.touches[0].pageY};
		e.preventDefault();

		this.pVector = null;
	};

	ScrollPanel.prototype.onTouchEnd = function(e){
		this.currentScrollTop = this.client.scrollTop;
/*
		var self = this;
		new _.StoryBoard([
		new _.Animation(this.currentScrollTop,  this.currentScrollTop+20*-1*this.endMagnitude, 1000, _.Animation.easeOut,
		    function(value){
		    	self.client.scrollTop = value;
			},
			function(){
				self.currentScrollTop = self.client.scrollTop;
				self.endMagnitude = 0;
			})
		]).animate();
*/
	};


	ScrollPanel.prototype.onTouchMove = function(e){
		this.touchEnd = {x:e.touches[0].pageX, y:e.touches[0].pageY};
		e.preventDefault();

		var vector = [
			this.touchEnd.x - this.touchStart.x,
			this.touchEnd.y - this.touchStart.y
		];
		this.client.scrollTop = this.currentScrollTop + (-1*vector[1]);

		if(this.pVector){
			this.endMagnitude = vector[1] - this.pVector[1];
		}

		this.pVector = vector;
	};




	ScrollPanel.prototype.reflow = function(args){

		this.reflowChildren(null,null,true);

		/* nothing to reflow on mobile platforms*/
		if(isMobile) return;

		if(args && args.height){

			this.domRoot.style.height = args.height + 'px';
			this.ref.scrollClient.style.height = args.height + 'px';
		}
		/* careful its a prototype call */
		var scrollBar = ScrollPanel.prototype.attachScrollBars.call(
			this,
			this.domRoot,{
				scrollClient:this.views.scrollClient.htmlElement,
				horizontalDisable:this.horizontalDisable
			}
		);

		if(scrollBar.vertical) {
			/*
			this.views.scrollClient.className = 'client -splicejs-scrolling-vertical';
			this.views.staticContainer.className = 'static -splicejs-scrolling-vertical';
			*/
			//this.views.clippingArea.className = 'clipping -splicejs-scrolling-vertical';
		}

		else {
			this.views.clippingArea.className = 'clipping';
			/*
			this.views.scrollClient.className = 'client';
			this.views.staticContainer.className = 'static';
			*/
		}

	};

	ScrollPanel.prototype.attachScrollBars = function(parent,args){

		if(!parent) return;

		parent.style.overflow = 'hidden';
		var self = this;
		var client = this.views.scrollClient;
		var staticContainer = this.views.staticContainer;

		var content = this.views.scroll.htmlElement;

		var size  = {	width:client.clientWidth, height:client.clientHeight};
		var cSize = {	width:	Math.max(content.clientWidth,content.scrollWidth, content.offsetWidth),
					 				height:	Math.max(content.clientHeight, content.scrollHeight, content.offsetHeight)};

		var thumb = {horizontal: 	parent._scroll_bar_horizontal,
					  vertical:		parent._scroll_bar_vertical
		};

		/*
		 * Check is scroll bars already exist
		 * create new ones if not
		 * */
		if(!thumb.vertical) {
			thumb.vertical = create('div').cl.add('-scroll-bar-thumb-vertical').element;
			parent._scroll_bar_vertical = thumb.vertical;
		}

		if(!thumb.horizontal) {
			thumb.horizontal = create('div').cl.add('-scroll-bar-thumb-horizontal').element;
			parent._scroll_bar_horizontal = thumb.horizontal;
		}


		/*
		 * Scroll bars may not be required
		 * */
		var status = {vertical:true, horizontal:true};
		if(size.height >= cSize.height ) {
			thumb.vertical.style.display = 'none';
			status.vertical = false;

		} else {
			thumb.vertical.style.display = 'block';
		}

		if(size.width >= cSize.width-2 || (args.horizontalDisable === true)) {
			thumb.horizontal.style.display = 'none';
			status.horizontal = false;
		} else {
			thumb.horizontal.style.display = 'block';
		}



		var thumbSizes = {
			vertical:{size:0, scale:0},
			horizontal:{size:0, scale:0}
		};


		/*
		 * Calculate vertical thumb size
		 * */
		var h = size.height - 20 - Math.round(0.3*(cSize.height - size.height));
		if(h < 30) h = 30;

		thumbSizes.vertical.size = h;
		thumbSizes.vertical.scale = (cSize.height - size.height)/(size.height - 20 - h);


		/*
		 * Calculate horizontal thumb size
		 * */
		var w = size.width - 20 - Math.round(0.3*(cSize.width - size.width));
		if(w < 30) w = 30;

		thumbSizes.horizontal.size = w;
		thumbSizes.horizontal.scale = (cSize.width - size.width)/(size.width - 20 - w);


		/*
		 * Assign styles
		 * */
		thumb.vertical.style.height 	=  thumbSizes.vertical.size + 'px';
		thumb.horizontal.style.width 	=  thumbSizes.horizontal.size + 'px';


		/*
		 * Append dom
		 * */
		parent.appendChild(thumb.vertical);
		parent.appendChild(thumb.horizontal);


		thumb.vertical.onclick = function(e){
			if(!e) e = window.event;
			e.cancelBubble = true;
			if (e.stopPropagation) e.stopPropagation();
		};

		thumb.horizontal.onclick = function(e){
			if(!e) e = window.event;
			e.cancelBubble = true;
			if (e.stopPropagation) e.stopPropagation();
		};

		var scale = thumbSizes.vertical.scale;
		thumb.vertical.onmousedown = function(e){
			if(!e) e = window.event;
			e.cancelBubble = true;
			if (e.stopPropagation) e.stopPropagation();

			DragAndDrop.startDrag(this,e);
			var top = this.offsetTop - parent.scrollTop ;


			DragAndDrop.ondrag = function(position,offset){

				var t = (top + position.y-offset.y);
				if(t <=10) t = 10;
				if((thumbSizes.vertical.size + t) > size.height - 20) t = size.height - thumbSizes.vertical.size - 10;

				//!!!!whats with the magic number??? rework.
				var scrollPosition = (t-10)*scale;

				//some scroll panel including controls may not want automatic client scroll
				if(self.isScrollClient) {
					client.scrollTop = scrollPosition;
					// keep scrolling thumbs in their positions
					//thumb.horizontal.style.bottom = (-1*parent.scrollTop + 10 ) + 'px';
				}

				thumb.vertical.style.top =  (parent.scrollTop + t) + 'px';

				var eargs = {	vector:		(position.y-offset.y),
											scaled:		 scrollPosition,
											position:	 t-10,
											height:		size.height,
											isVertical:true
				};

				self.onScroll(eargs);
			};
		};

		thumb.horizontal.onmousedown = function(e){
			if(!e) e = window.event;
			if(!e) e = window.event;
			e.cancelBubble = true;
			if (e.stopPropagation) e.stopPropagation();

			DragAndDrop.startDrag(this,e);
			var left = this.offsetLeft - parent.scrollLeft ;
			var scale = thumbSizes.horizontal.scale;


			DragAndDrop.ondrag = function(position,offset){

				var t = (left + position.x-offset.x);
				if(t <=10) t = 10;
				if((thumbSizes.horizontal.size+t) > size.width - 20) t = size.width - thumbSizes.horizontal.size - 10;


				var scrollPosition = (t-10)*scale;

				client.scrollLeft = scrollPosition;
				staticContainer.scrollLeft = scrollPosition;

				// keep scrolling thumbs in their positions
				thumb.horizontal.style.left =  (parent.scrollLeft + t) + 'px';
				//thumb.vertical.style.right =  (-1*parent.scrollLeft + 10) + 'px';
				var eargs = {vector:(position.y-offset.y), position:scrollPosition, isHorizontal:true};
				self.onScroll(eargs);
			};
		};


		client.onwheel = function(e){
			if(!e) e = window.event;

			client.scrollTop = client.scrollTop + e.wheelDeltaY*scale * 0.05;

			// keep scrolling thumbs in their positions
			//thumb.vertical.style.top =  (parent.scrollTop + t) + 'px';
			//thumb.horizontal.style.bottom = (-1*parent.scrollTop + 10 ) + 'px';

			e.preventDefault ? e.preventDefault() : e.returnValue = false;
			e.cancelBubble = true;
			if (e.stopPropagation) e.stopPropagation();

			//_.debug.log(e);
		};

		return status;
	}; //end attach scrollbars

	//scope exports
	scope.add(
		ScrollPanel
	);
	//module exports
	scope.exports(
		ScrollPanel
	);

}});
