_.Module.define({

name:	'SengiControls',

required:[
	'public/jscript/csdialogs/css/j$elements.css',
	'public/jscript/modules/sengi.controls/sengi.controls.css',
	'public/jscript/modules/sengi.controls/sengi.controls.calendar.js',
	{src:'public/jscript/modules/sengi.controls/sengi.controls.html'}
],

definition:function(){

	/**
	 * UIControl base class for implementing all user controls
	 * that utilize templating mechanism
	 * */
	var UiControl = _.Namespace('Sengi.Controls').Class(function UiControl(args){
		Sengi.Modular.BoundControl.call(this, args);
	}).extend(Sengi.Modular.BoundControl);
		
	/**
	 * Is called by the parent element to ensure proper control sizing
	 * Use this method to implement custom control sizing routine
	 * @param args:{position: sizing:}
	 * */
	UiControl.prototype.reflow = function(args){
		this.children._foreach(function(item){
			item.reflow(args);
		});
	};
	
	_.Interface.UiControl = UiControl;
	
	function SideBar(parent){

		return {content:function(content){
					
			var d = _.className(parent,'-side-bar');
			if(d) d = d[0];
			
			if(!d) {
				d = _.Module.template({module:'SengiControls',template:'SideBar'});
				d.innerHTML = content;
				parent.appendChild(d);
			}
			
			return {show:function(){
				d.style.left = '-300px';
				d.style.width = '300px';
				d.style.display = 'block';
				d.style.opacity = '0';
				
				var obj = {onclick:null};
				
				
				var tapHandler = function(e){
					try {	clearInterval(timerContainer.timer);} catch(ex){};
					
					d.style.left = '-300px';
					d.style.opacity = '0.4';	
					
					document.body.onmousedown = '';
					document.body.removeEventListener( 'touchstart', tapHandler);
				};
				
				document.body.onmousedown = tapHandler;
				document.body.addEventListener( 'touchstart', tapHandler,	false );
				
				
				var selectItem = function(e){
					if(!e) e = window.event;
					e.cancelBubble = true;
					if (e.stopPropagation) e.stopPropagation();
					
					//remove global event handler
					document.body.onmousedown = '';
					d.removeEventListener( 'touchstart', selectItem,	false );
					
					// cancel any animations in progress
					try {	clearInterval(timerContainer.timer);} catch(ex){};
					
					var source = e.srcElement;
					while(source.className != '-side-bar-item' && source)
						source = source.parentNode;
					
					if(!source) return;
					
					var p = _.Doc.elementPosition(source);
					var s = _.Doc.elementSize(source);
					
					
					var item = source.cloneNode(true);
					item.className = '-side-bar-item-hover';
					with(item.style){
						position = "absolute";
						width = s.width +'px';
						height = s.height +'px';
						left = p.x + 'px';
						top = p.y + 'px';
						zIndex = "9999";
					}
					
					document.body.appendChild(item);
					
					obj.onclick(source);
					
					d.style.left = '-300px';
					d.style.opacity = '0.4';
					var itemStyle = item.style;
					new _.StoryBoard([
					    new _.Animation(1,0,700,_.Animation.easeOut, function(value){
					    	itemStyle.opacity = value;
					    },
					    function(){item.parentNode.removeChild(item);})
					]).animate();
				
				};
				
				d.onmousedown = selectItem;
				d.addEventListener( 'touchstart', selectItem,	false );

				var dstyle = d.style;	
				new _.StoryBoard([

				    new _.Animation(-300,0, 200, _.Animation.easeOut, function(value){
				    	dstyle.left = value + 'px';
				    	}),
				    	
				    new _.Animation(0.4,0.98, 500, _.Animation.easeOut, function(value){
				    	dstyle.opacity = value;
				    	})           
	            
				]).animate();
				
				
				return obj;
			}};
		}};

	};
	
	
	
	
	/*
	 * Table API wrapper
	 * */
	var DatePicker = _.Namespace('Sengi.Controls').Class(function DatePicker(args){
	
		if(!args) return;	
		if(!args.dom) return;
		
		this.dom = args.dom;
		var config = this.dom._config;
	
		/* bind value placement */
		this.bind(this.dom);
		
		if(!config) return;
		
		
		var calendar = _.Module.get('SengiControls.Calendar').create();
		
		if(config.value) {
			this.setPropertyValue('value',config.value);
		}
		
		if(config.ondatechanged) {
			this.ondatechanged = config.ondatechanged;
		}
		
		
		this.dom.onclick = (function(calendar){
			CSDialogs.Calendar.showAt(this.dom, (function(){
				this.setDate(CSDialogs.Calendar.CURRENT_DATE);
			}).bind(this));
			//calendar.showAt(this.dom);
		}).bind(this,calendar);
		
	}).extend(_.Interface.UiControl);	
		
	//event handlers
	DatePicker.prototype.ondatechanged = function(args){
		
	};
	
	DatePicker.prototype.setDate = function(date){
		// expressions are evaluated left to right and braces are needed to maintain integer
		// before to string conversion
		var dateFormat  = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
		this.dom.innerHTML = dateFormat;
	};
	
	
	
	/**
	 * DropDownList 
	 * */
	var DropDownList = function DropDownList(){
		this.dom = _.Module.template({template:'SengiControls.DropDownList'});
	};
	
	DropDownList.prototype.show = function(args){
		if(!args || !args.parent) return;
		
		var parent_size 	= _.Doc.elementSize(args.parent);
		var parent_position = _.Doc.elementPosition(args.parent);
		var documentHeight 	= _.Doc.getHeight();
		
		this.dom.style.maxHeight = (documentHeight - parent_position.y - parent_size.height - 5) + 'px';
		
		
		document.body.appendChild(this.dom);
		
		if(typeof(args.content) ==  'string') {
			this.dom.innerHTML = args.content;
		} else if( typeof(args.content) == 'object'){
			this.dom.innerHTML = '';
			this.dom.appendChild(args.content);
		}
		
		
		var style = this.dom.style;
		style.left = parent_position.x + 'px';
		style.top  = parent_position.y + parent_size.height + 'px';
		
		this.dom.className = '-sc-drop-down-list -sc-show';
		
		
		/* remove list on defocus*/
		
		document.body.onmousedown = (function(){
			this.hide();
			document.body.onmousedown = '';
		}).bind(this); 
		
	};
	
	
	DropDownList.prototype.hide = function() {
		this.dom.className = '-sc-drop-down-list -sc-hide';
	};
		
	
	/**
	 * TreeView
	 * 
	 * 
	 * */
	var TreeView = _.Class(function TreeView(args){
		if(!args) return;	
		if(!args.dom) return;
		
		UiControl.call(this,args);
		
		this.dom = args.dom;
		
		this.scrollPanel = new ScrollPanel({
			dom:this.ref.scrollPanel,
			bindingType:'root',
			args:{isDisableHorizontal:true}
		});
		

		/*
		 * Scroll panel of the tree view must adhere to outward scaling
		 * */
		this.scrollPanel.freeFlow();
		
		/* 
		 * get back my root node 
		 * */
		this.ref.treeRoot = this.scrollPanel.ref.treeRoot;
		var sPanel = this.scrollPanel;
		
		
		/* 
		 * trap mouse event to allow focusing on 
		 * filter input box
		 * */
		this.ref.filterPanel.onmousedown = function(e){
			if(!e) e = window.event;
			_.Doc.stopEventPropagation(e);
		};
		
		/*
		 * Filter tree items as user types in the filter box 
		 * */
		this.ref.filterInput.onkeyup = (function(e){
			if(!e) e = window.event;
			this.filter(e.srcElement.value);
		}).bind(this);
		
		this.ref.treeRoot.onmousedown = function(e){
			if(!e) e = window.Event;
			
			_.Doc.stopEventPropagation(e);
			
			if(e.srcElement.className.indexOf('-sc-tree-expandor') > -1){
				var ul = e.srcElement.parentNode.parentNode.querySelectorAll('ul')[0]; 
				var expandor = e.srcElement;
				
				var from = ul.scrollHeight;
				var to = 0;
				
				if(ul._isCollapsed) {
					from = 0;
					to = ul._originalHeight;
					if(to > 1000) to = 1000;
					expandor.className='-sc-tree-expandor -sc-tree-node-expanded';

				} else {
					if(from > 1000) from = 1000;
					expandor.className='-sc-tree-expandor -sc-tree-node-collapsed';
					ul._originalHeight = ul.scrollHeight;
				}
				
				ul._isCollapsed = !ul._isCollapsed;
				/* animate transition */
				new _.StoryBoard([
				new _.Animation(from, to, 200, to>0?_.Animation.easeIn:_.Animation.easeOut, 
  					function(value){ul.style.height = value + 'px';},
  					function(){
  						if(to > 0) ul.style.height = 'auto';
  						sPanel.reflow();
  					}
				)]).animate();
				
				
			}
		};
		
	}).extend(UiControl);
	
	TreeView.prototype.reflow = function(args){
		if(!args) return;
		var filterPanelSize = _.Doc.elementSize(this.ref.filterPanel);
		
		this.scrollPanel.reflow({height:(args.height-filterPanelSize.height-10)});
		
	};
	
	TreeView.create = function(){
		var template = _.Module.template({template:'SengiControls.TreeView'});
		return new TreeView({dom:template,args:{}});
	};
	
	TreeView.prototype.breakout = function(node){
		return new Array(
				node.substr(0,node.indexOf('|')),
				node.substr(node.indexOf('|')+1)
		);
	};
	
	TreeView.prototype.buildTree = function(content,filter){
		this.ref.treeRoot.innerHTML = this.parseTree(content,filter);
		this.reflow();
	};
	
	TreeView.prototype.filter = function(filter){
		if(!this.contentProvider) return;
		
		if(this.contentProvider) {
			//show drop down tree here
			this.contentProvider.oncontentready = (function(content){
				this.buildTree(content, filter);
				this.scrollPanel.reflow();
				this.scrollPanel.constraintFlow();
			}).bind(this);
			
			this.contentProvider.getContent();
		};
	};
	
	
	/**
	 * Calls content provider to load tree content
	 * when tree content is loaded onload event is called
	 * */
	TreeView.prototype.load = function(){
		
		if(!this.contentProvider) return;
		
		if(this.contentProvider) {
			//show drop down tree here
			this.contentProvider.oncontentready = (function(content){
				this.buildTree(content);
				this.onload();
			}).bind(this);
			
			this.contentProvider.getContent();
		};
	};
	
	TreeView.prototype.onload = function(){};
	
	TreeView.prototype.setContentProvider = function(contentProvider){
		this.contentProvider =  contentProvider;
	};
	
	TreeView.prototype.parseTree = function(json, filter){ 
	
		/*this is array, also root node*/
		var str = '';
		for(var i=0; i < json.length; i++){
				
			if(typeof json[i] == 'object') str += this.parseTree(json[i],filter); 
			else {
				var b = this.breakout(json[i]);
				if( (filter && b[1].toLowerCase().indexOf(filter.toLowerCase()) > -1 ) || !filter)
				str += '<li><div id="'+b[0]+'" class="-sc-tree-item">'+b[1]+'</div></li>';
			}
		}
		
		if(json.length > 0) return str;
		
		/*parse JSON tree representation */
		for(prop in json ){
			if(typeof json[prop] == 'object' ) {
				var b = this.breakout(prop);
				var tmp = '<li><div id="'+b[0]+'" class="-sc-tree-item">'+
					'<div class="-sc-tree-expandor -sc-tree-node-expanded"></div>'+b[1]+'</div><ul>'; 
				var subitems = this.parseTree(json[prop],filter);
				
				if( (filter && b[1].toLowerCase().indexOf(filter.toLowerCase()) > -1 ) || !filter || subitems.length > 5)
					str += tmp + subitems + '</ul></li>';
			}
		}
		
		return str;
		
	};
	
	
	
	/**
	 * DropDown Tree Viewer
	 * This a derived control, combining TreeView and DropDownList
	 * */
	var DropDownTree =  _.Class(function DropDownTree(args){

		if(!args) return;	
		if(!args.dom) return;
		
		UiControl.call(this,args);
		
		this.dom = args.dom;
		var config = this.dom._config;

		
		this.containerList =  new DropDownList();
		this.treeView = TreeView.create();
		
		this.treeView.setContentProvider(this.contentProvider);
		
		if(!config) return;
		/*
		if(config.value) {
			this.setPropertyValue('value',config.value);
		}
		*/
		this.dom.onclick = (function(parent){
			_.debug.log('Show drop down tree');
			
			this.treeView.onload = (function(){
				this.containerList.show({
					parent:this.dom, 
					content:this.treeView.dom
				});
				var listSize = _.Doc.elementSize(this.containerList.dom);
				this.treeView.reflow(listSize);

			}).bind(this);
			
			this.treeView.load();
		
		}).bind(this,this.dom);
		
	}).extend(UiControl);			
	
	
	
	

	

	
	/*
	 * Table API wrapper
	 * */
	
	function Table(args){
		this.dom = args.dom;
	}
	
	Table.prototype.addHeader = function(headers){
		
		if(!headers) return;
		if(this.dom.tHead) this.dom.deleteTHead();
		
		var headRow = this.dom.createTHead().insertRow();
		for(var i=0; i<headers.length; i++){
			headRow.insertCell().innerHTML = headers[i];
		}
	};
	
	Table.prototype.addRow = function(row){
		
		
		if(!row) return;
		if(!(row instanceof Array)) throw 'Argument must be of type Array';
		
		var tBody = this.dom.tBodies[0]; 
		if(!tBody) tBody = this.dom.createTBody();
		
		var newrow =  tBody.insertRow();
		
		for(var i=0; i < row.length; i++ ){
			
			var cell = newrow.insertCell();
			
			if(typeof(row[i]) == 'object')
				cell.appendChild(row[i]);
			else {
				cell.appendChild(document.createTextNode(row[i]));
			}
		}
	};
	
		
	
	var Button = _.Namespace('Sengi.Controls.Ties').Class(function Button(args){
		if(!args) return;
		if(!args.dom) return;
		this.dom = args.dom;

				
		var config = this.dom._config;
		if(!config) return;
		
		this.dom.onclick = (function(){
			if(!this.isDisabled) this.onclick();
		}).bind(this);
		
		if(config.isDisabled) {
			this.disable();
		}
			
		if(config.onclick instanceof _.Action){
			this.onclick = _.action.bind(this.dom,config.onclick.name);
			_.debug.log('Action is being assigned ');
		}
	});
	
	Button.prototype.disable = function(){
		this.isDisabled = true;
		this.dom.className = this.dom.className + ' disabled';
	};
	
	Button.prototype.enable = function(){
		this.isDisabled = false;
		this.dom.className = this.dom.className._clip(' disabled');
	};
	
	Button.prototype.onclick = function(){};
	
	
	
	/* 
	 * 
	 * scroll bar
	 * 
	 * */
	function ScrollBar(parent,args) {
		if(!parent) return;
		
		parent.style.overflow = 'hidden';
		
		var client = parent;
		if(args && args.scrollClient)  client = args.scrollClient;
		
		var content = client._firstNonText();

		var size  = {width:client.clientWidth, height:client.clientHeight};
		var cSize = {width:	Math.max(content.clientWidth,content.scrollWidth, content.offsetWidth), 
					 height:Math.max(content.clientHeight, content.scrollHeight, content.offsetHeight)};
			 
		var thumb = {horizontal: 	parent._scroll_bar_horizontal,
					  vertical:		parent._scroll_bar_vertical		
		};
		
		/*
		 * Check is scroll bars already exist 
		 * create new ones if not
		 * */
		if(!thumb.vertical) {
			thumb.vertical = j$._element({element:'div',cssclass:'-scroll-bar-thumb-vertical'});
			parent._scroll_bar_vertical = thumb.vertical;
		}
		
		if(!thumb.horizontal) {
			thumb.horizontal = j$._element({element:'div',cssclass:'-scroll-bar-thumb-horizontal'});
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
		
		if(size.width >= cSize.width-2 || (args && args.horizontalDisable === true)) {
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
		
		
		thumb.vertical.onmousedown = function(e){
			if(!e) e = window.event;
			e.cancelBubble = true;
			if (e.stopPropagation) e.stopPropagation();
			
			CSDialogs.DragAndDrop.startDrag(this,e);
			var top = this.offsetTop - parent.scrollTop ;
			var scale = thumbSizes.vertical.scale;
		
			CSDialogs.DragAndDrop.ondrag = function(position,offset){
				
				var t = (top + position.y-offset.y);
				if(t <=10) t = 10;
				if((thumbSizes.vertical.size + t) > size.height - 20) t = size.height - thumbSizes.vertical.size - 10;
				
				client.scrollTop = (t-10)*scale;
				
				// keep scrolling thumbs in their positions
				thumb.vertical.style.top =  (parent.scrollTop + t) + 'px';
				//thumb.horizontal.style.bottom = (-1*parent.scrollTop + 10 ) + 'px';
				
			};
		};
		
		thumb.horizontal.onmousedown = function(e){
			if(!e) e = window.event;
			if(!e) e = window.event;
			e.cancelBubble = true;
			if (e.stopPropagation) e.stopPropagation();
			
			CSDialogs.DragAndDrop.startDrag(this,e);
			var left = this.offsetLeft - parent.scrollLeft ;
			var scale = thumbSizes.horizontal.scale;
		
		
			CSDialogs.DragAndDrop.ondrag = function(position,offset){
				
				var t = (left + position.x-offset.x);
				if(t <=10) t = 10;
				if((thumbSizes.horizontal.size+t) > size.width - 20) t = size.width - thumbSizes.horizontal.size - 10;
				
				client.scrollLeft = (t-10)*scale;
				
				// keep scrolling thumbs in their positions
				thumb.horizontal.style.left =  (parent.scrollLeft + t) + 'px';
				//thumb.vertical.style.right =  (-1*parent.scrollLeft + 10) + 'px';
			};
		};
		
		
		return status;
	};
	
	/**
	 * Vertical Split Panel
	 * */
	var VerticalSplitPanel  =  _.Class(function VerticalSplitPanel(args){
		if(!args) return;
		
		/* call parent constructor */
		UiControl.call(this,args);
		var config = args.args;
		
		this.ref.splitter.onmousedown = (function(e){
			if(!e) e = window.event;
			VerticalSplitPanel.prototype.startDragResizeVertical(
					this.ref.splitter,
					e, 
					this.ref.leftPanel, 
					this.ref.rightPanel);
		}).bind(this);
		
		
	}).extend(UiControl);
	
	VerticalSplitPanel.prototype.startDragResizeVertical = function(obj,event,left_pane, right_pane, ondrag) {

		//var left_pane 	= document.getElementById(targetIdLeft);
		//var right_pane  = document.getElementById(targetIdRight);
		var splitter = obj;
		
		var minWidth = -1;
		var minWidthRight = -1;
		
		var lsl = false; //getDimensionUnits(left_pane.getAttribute('xminresizewidth'));
		var rsl = false; //getDimensionUnits(right_pane.getAttribute('xminresizewidth'));

		// left limit
		if(lsl){
			if(lsl.unit === '%') {
				minWidth = Math.round(left_pane.parentNode.offsetWidth*lsl.value/100);
			} 
			if(lsl.unit === 'px') {
				minWidth = lsl.value;
			}
		}
		
		// right limit
		if(rsl){
			if(rsl.unit === '%'){
				minWidthRight = Math.round(right_pane.parentNode.offsetWidth*rsl.value/100);
			}
			if(rsl.unit === 'px') {
				minWidthRight = rsl.value;
			}
		}
		
		var dragClientWidth = left_pane.clientWidth;

		JSDragAndDrop.startdrag(obj, event);
		JSDragAndDrop.ondrag = function(d) {
			
			var delta = d.x - d.mousepos.x;
			
			var newWidth = (dragClientWidth + delta);
			if(newWidth < 0) newWidth = 0;
			 
			if(newWidth <= minWidth && minWidth > -1) {
				newWidth = minWidth;
			}
			
			if(splitter.parentNode.offsetWidth - newWidth < minWidthRight && minWidthRight > -1 ) {
				newWidth = splitter.parentNode.offsetWidth - minWidthRight;
			}
			
			left_pane.style.width = newWidth + 'px'; 
			splitter.style.left = newWidth + 'px';
			right_pane.style.left = newWidth + 'px';
			if(typeof(ondrag) === 'function'){
				ondrag();
			}
		};
	};
	
	
	
	var ScrollPanel = _.Class(function ScrollPanel(args){
		if(!args) return;
		
		UiControl.call(this,args);
		var config = args.args;
		
		this.horizontalDisable = config.isDisableHorizontal;
		this.domRoot 	= args.dom;
		
		
	}).extend(UiControl);
	
	ScrollPanel.prototype.freeFlow = function(){
		this.domRoot.style.position = 'relative';
		this.ref.scrollClient.style.position = 'relative';
	};

	ScrollPanel.prototype.constraintFlow = function(){
		//this.domRoot.style.position = 'absolute';
		//this.ref.scrollClient.style.position = 'absolute';
	};
	
	ScrollPanel.create = function(){
		var template = _.Module.template({template:'SengiControls.ScrollPanel'});
		new ScrollPanel({dom:template,args:{}});
	};
	
	ScrollPanel.prototype.reflow = function(args){
		if(args && args.height){
			
			this.domRoot.style.height = args.height + 'px';
			this.ref.scrollClient.style.height = args.height + 'px';
		}
		/* careful its a prototype call */
		var scrollBar = ScrollPanel.prototype.attachScrollBars(
				
				this.domRoot,{
					scrollClient:this.ref.scrollClient,
					horizontalDisable:this.horizontalDisable
				}
		);
		
		if(scrollBar.vertical) this.ref.scrollClient.className = 'client -sc-scrolling-vertical'; 
		else this.ref.scrollClient.className = 'client';  
	};
	
	ScrollPanel.prototype.attachScrollBars = function(parent,args){
		
		if(!parent) return;
		
		parent.style.overflow = 'hidden';
		
		var client = parent;
		if(args && args.scrollClient)  client = args.scrollClient;
		
		var content = client._firstNonText();

		var size  = {width:client.clientWidth, height:client.clientHeight};
		var cSize = {width:	Math.max(content.clientWidth,content.scrollWidth, content.offsetWidth), 
					 height:Math.max(content.clientHeight, content.scrollHeight, content.offsetHeight)};
			 
		var thumb = {horizontal: 	parent._scroll_bar_horizontal,
					  vertical:		parent._scroll_bar_vertical		
		};
		
		/*
		 * Check is scroll bars already exist 
		 * create new ones if not
		 * */
		if(!thumb.vertical) {
			thumb.vertical = j$._element({element:'div',cssclass:'-scroll-bar-thumb-vertical'});
			parent._scroll_bar_vertical = thumb.vertical;
		}
		
		if(!thumb.horizontal) {
			thumb.horizontal = j$._element({element:'div',cssclass:'-scroll-bar-thumb-horizontal'});
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
			
			CSDialogs.DragAndDrop.startDrag(this,e);
			var top = this.offsetTop - parent.scrollTop ;
			
		
			CSDialogs.DragAndDrop.ondrag = function(position,offset){
				
				var t = (top + position.y-offset.y);
				if(t <=10) t = 10;
				if((thumbSizes.vertical.size + t) > size.height - 20) t = size.height - thumbSizes.vertical.size - 10;
				
				client.scrollTop = (t-10)*scale;
				
				// keep scrolling thumbs in their positions
				thumb.vertical.style.top =  (parent.scrollTop + t) + 'px';
				//thumb.horizontal.style.bottom = (-1*parent.scrollTop + 10 ) + 'px';
				
			};
		};
		
		thumb.horizontal.onmousedown = function(e){
			if(!e) e = window.event;
			if(!e) e = window.event;
			e.cancelBubble = true;
			if (e.stopPropagation) e.stopPropagation();
			
			CSDialogs.DragAndDrop.startDrag(this,e);
			var left = this.offsetLeft - parent.scrollLeft ;
			var scale = thumbSizes.horizontal.scale;
		
		
			CSDialogs.DragAndDrop.ondrag = function(position,offset){
				
				var t = (left + position.x-offset.x);
				if(t <=10) t = 10;
				if((thumbSizes.horizontal.size+t) > size.width - 20) t = size.width - thumbSizes.horizontal.size - 10;
				
				client.scrollLeft = (t-10)*scale;
				
				// keep scrolling thumbs in their positions
				thumb.horizontal.style.left =  (parent.scrollLeft + t) + 'px';
				//thumb.vertical.style.right =  (-1*parent.scrollLeft + 10) + 'px';
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
		
		
	};
	
	/**
	 * Data Table 
	 * */
	
	var DataTable = _.Namespace('Sengi.Controls').Class(function DataTable(args){
		if(!args) return;
		
		UiControl.call(this,args);
		var config = args.args;
		
		this.table = new Table({dom:this.ref.dataTable});
		this.columnHeader = new Table({dom:this.ref.columnHeaderTable})
		
	}).extend(UiControl);
	
	
	DataTable.prototype.addHeader = function(headers){
		this.table.addHeader(headers)
		this.columnHeader.addHeader(headers);
	};
	
	DataTable.prototype.addRow = function(row){
		this.table.addRow(row);
		this.reflow();
	};
	
	/* 
	 * a move efficient method for adding multiple rows
	 * at a time
	 * */
	DataTable.prototype.addRows = function(rows){
		for(var i=0; i<rows.length; i++){
			this.table.addRow(rows[i]);
		}
		this.reflow();
	};
	
	
	
	DataTable.prototype.reflow = function(){
		/* user offsetWidth it included border sizes */
		this.ref.columnHeaderTable.style.width = this.ref.dataTable.offsetWidth  + 'px';
		/* measure column sizes */
		var body = this.ref.dataTable.tHead;
		var head = this.ref.columnHeaderTable.tHead;
		
		if(!body || !head) return;
		
		var cells = body.rows[0].cells;
		for(var i=0; i< cells.length; i++){
			
			var cellWidth = cells[i].clientWidth - 10;
			head.rows[0].cells[i].width = cellWidth + 'px';
		}
		
		/* careful its a prototype call */
		var scrollBar = ScrollPanel.prototype.attachScrollBars(
				
				this.ref.scrollContainer,{
					scrollClient:this.ref.scrollClient
				}
		);
		
		if(scrollBar.vertical) { 
			this.ref.scrollClient.className = 'client -sc-scrolling-vertical';
			this.ref.columnHeaderContainer.className = 'static-column-header -sc-scrolling-vertical';
		} 
		else { 
			this.ref.scrollClient.className = 'client';
			this.ref.columnHeaderContainer.className = 'static-column-header';
		}
			
	};
	
	/*
	 * Pivot table module hook
	 * */
	var PivotTable = function PivotTable(args){
		return _.Module.get('SengiControls.PivotTable').create();
	};
	
	
	/**
	 * Module Class
	 * Exports public binding for controls
	 * */
	
	var ControlsModule = _.Class(function ControlsModule(){
			
		this.exportedControls =  {
				
		Table:				Table,
		SideBar:			SideBar,
		DatePicker:			DatePicker,
		DropDownTree:		DropDownTree,
		Button:				Button,
		ScrollBar:			ScrollBar,
		VerticalSplitPanel:	VerticalSplitPanel,
		PivotTable:			PivotTable,
		ScrollPanel:		ScrollPanel,
		DataTable:			DataTable,
		TreeView:			TreeView
		};	
		
	}).extend(_.Interface.Module);
	
	ControlsModule.prototype.bind = function(domTemplate, templateName){
	};
	
	
	return new ControlsModule(); 
	
}
}, function(module){
	
	/*Sengi extension point*/
	_.Controls = module.exportedControls;
	
	/* Load additional controls */
	_.Module.load(['public/jscript/modules/sengi.controls/sengi.controls.view.js',
	               'public/css/layout.css',
	           	   'public/jscript/layout.js',
	               'public/jscript/modules/sengi.controls/sengi.controls.cardlayout.js',
	               'public/jscript/modules/sengi.controls/sengi.controls.treetable.js'
	               ]);
	
});

