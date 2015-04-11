_.Module({
	
required:[	

			'modules/splice.controls/splice.controls.css',
          	'modules/splice.controls/splice.controls.htmlt'
 
 ],

follows:[
			
			'modules/splice.controls/splice.controls.datatable.js'

],          	
	
definition:function(){
	
	var UIControl = _.Namespace('SpliceJS.Controls').Class(function UIControl(args){
		if(this.isHidden) this.elements.controlContainer.style.display = 'none';

		/* attach style to the controlContainer */
		if(args.style)
		this.elements.controlContainer.className += ' ' + args.style; 


		this.dataItem = null;

	});
	
	UIControl.prototype.hide = function(){
		var self = this;
		if(this.animate){
			_.Animate(this.elements.controlContainer).opacity(100, 0, 300,function(){
				self.elements.controlContainer.style.display = 'none';
			});
		}
		else {
			this.elements.controlContainer.style.display = 'none';
		}
	}
	
	UIControl.prototype.show = function(){
		if(this.animate) {
			this.elements.controlContainer.style.opacity = 0;
		}
		this.elements.controlContainer.style.display = 'block';
		
		if(this.animate) {
			_.Animate(this.elements.controlContainer).opacity(0, 100, 300);
		}
	}
	
	UIControl.prototype.changeState = function(args){
		_.debug.log('Changing button\'s state');
		if(args && args.isHidden)
			this.hide();
		else 
			this.show();
	};

	UIControl.prototype.dataIn = function(data){
		this.dataItem = data;
	};
	
	UIControl.prototype.dataOut = function(){};
	
	
	var Button = _.Namespace('SpliceJS.Controls').Class(function Button(args){
		
		SpliceJS.Controls.UIControl.apply(this,arguments);
		
			
		var self = this;
		this.elements.controlContainer.onclick = function(){
			if(self.isDisabled == true) return;
			self.onClick(self.dataItem);

		};
		
		if(this.isDisabled) this.disable();
		
		
	}).extend(SpliceJS.Controls.UIControl);

	
	Button.prototype.handleContent = function(content){
		if(!content) return;
		
		if(content['label']){
			this.elements.controlContainer.value = content['label']; 
		} else {
			this.elements.controlContainer.value = 'button';
		}
	};


	Button.prototype.setLabel = function(label){
		this.elements.controlContainer.value = label;
	};
	
	Button.prototype.onClick = function(){
		_.debug.log('Event is not assigned');
	};
	
	
	
	
	
	
	Button.prototype.enable = function(){
		this.elements.controlContainer.className = '-splicejs-button';
		this.isDisabled = false;
	};
	
	Button.prototype.disable = function(){
		this.elements.controlContainer.className = '-splicejs-button-disabled';
		this.isDisabled = true;
	}
	
	
	
	var TextField = _.Namespace('SpliceJS.Controls').Class(function TextField(){
		SpliceJS.Controls.UIControl.apply(this,arguments);

		var self = this;
		this.elements.controlContainer.onchange = function(){
			self.dataItem[self.dataPath] = this.value;
			
			self.dataOut(self.dataItem);
		}
	});
	
	TextField.prototype.dataOut = function(){
		throw 'Data out interface is not assigned';
	}
		
	TextField.prototype.dataIn = function(dataItem){
		UIControl.prototype.dataIn.call(this,dataItem);
		var value = this.dataItem[this.dataPath];
		
		if(value) this.elements.controlContainer.value = value;
	};
	
	TextField.prototype.clear = function(){
		this.elements.controlContainer.value = '';
	};
	
	
	/**
	 * 
	 * Check box
	 * */
	var CheckBox = _.Namespace('SpliceJS.Controls').Class(function CheckBox(args){
		SpliceJS.Controls.UIControl.apply(this,arguments);

		var self = this;
		
		
		
		this.concrete.dom.onclick = function(){
			_.debug.log('I am check box');
			var isChecked = self.concrete.dom.checked; 
			if(self.dataItem) {
				self.dataItem[self.dataPath] = isChecked;
			}
			
			if(self.dataOut) 	self.dataOut(self.dataItem);
			if(self.onCheck)	self.onCheck(isChecked);
		};
	
	}).extend(SpliceJS.Controls.UIControl);

	
	CheckBox.prototype.dataIn = function(dataItem){
		this.dataItem = dataItem;
		if(this.dataItem && (this.dataItem[this.dataPath] === true)){
			this.concrete.dom.checked = true;
		}
		else this.concrete.dom.checked = false; 
	};
	
	CheckBox.prototype.clear = function(){
		this.concrete.dom.checked = false;
	};
	

	/**
	 * RadioButton
	 * */
	var RadioButton = _.Namespace('SpliceJS.Controls').Class(function RadioButton(args){
		SpliceJS.Controls.UIControl.apply(this,arguments);
	
		var self = this;
		this.elements.controlContainer.onclick = function(){

			if(self.elements.controlContainer.checked) {
				if(self.dataPath)
				self.dataItem[self.dataPath] = true
			} else {
				if(self.dataPath)
				self.dataItem[self.dataPath] = false;
			}
			self.dataOut(self.dataItem);
		}
	
	}).extend(SpliceJS.Controls.UIControl);
	
	
	RadioButton.prototype.dataIn = function(dataItem){
		UIControl.prototype.dataIn.call(this,dataItem);

		if(!this.dataPath) {
			this.elements.controlContainer.checked = false;
			return;
		}

		if(this.dataItem[this.dataPath] === true) {
			this.elements.controlContainer.checked = true;
		}
		else {
			this.elements.controlContainer.checked = false;	
		}
	};




	
	var ScrollPanel = _.Namespace('SpliceJS.Controls').Class(function ScrollPanel(args){
		if(!args) return;
		
		SpliceJS.Controls.UIControl.call(this,args);
		var config = args.args;
		
		this.horizontalDisable = this.isDisableHorizontal;
		
		this.domRoot 	= this.concrete.dom;
		



		
	}).extend(SpliceJS.Controls.UIControl);
	
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
		
		if(scrollBar.vertical) this.elements.scrollClient.className = 'client -sc-scrolling-vertical'; 
		else this.elements.scrollClient.className = 'client';  
	};
	
	ScrollPanel.prototype.attachScrollBars = function(parent,args){
		
		if(!parent) return;
		
		parent.style.overflow = 'hidden';
		
		var client = parent;
		if(args && args.scrollClient)  client = args.scrollClient;
		
		var content = _.Doc.firstNonText(client);

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
			thumb.vertical = _.Doc.element({element:'div',cssclass:'-scroll-bar-thumb-vertical'});
			parent._scroll_bar_vertical = thumb.vertical;
		}
		
		if(!thumb.horizontal) {
			thumb.horizontal = _.Doc.element({element:'div',cssclass:'-scroll-bar-thumb-horizontal'});
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






// end module definition		
}});