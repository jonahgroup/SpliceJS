/* global sjs */
sjs.Module({

required:[	
			
	{'SpliceJS.UI':'splice.ui.js'}
,	'splice.controls/splice.controls.css'
,  	'splice.controls/splice.controls.html'
,  	{'Buttons':'splice.controls/splice.controls.buttons.js'}
,	'splice.controls/splice.controls.datatable.js'
,	'splice.controls/splice.controls.scrollpanel.js'
,	'splice.controls/splice.controls.charts.js'

,	'splice.controls/splice.controls.listbox.js'
/*
,	'splice.controls/splice.controls.drawerpanel.js'
,	'splice.controls/splice.controls.viewpanel.js'
,	'splice.controls/splice.controls.map.js'
,	'splice.controls/splice.controls.gridlayout.js'
,	'splice.controls/splice.controls.codeeditor.js'
,	'splice.controls/splice.controls.d3canvas.js'
,	'splice.controls/splice.controls.calendar.js'
,	'splice.controls/splice.controls.datepicker.js'
,	'splice.controls/splice.controls.selectors.js'
,	'splice.controls/splice.controls.treeview.js'
,	'splice.controls/splice.controls.popup.js'
,   'splice.controls/splice.controls.pageloader.js'
,   'splice.controls/splice.controls.slider.js'
*/
]
, 	
definition:function(){
	
	var scope = this;

	/* imports */
	var Class = this.framework.Class;
	var Event = this.framework.Event;
	var UIControl = this.SpliceJS.UI.UIControl;
	
	
	var TextField = Class(function TextField(){
		UIControl.apply(this,arguments);

		var self = this;
		
		var f = function(){
			if(self.dataPath) {
				self.dataItem[self.dataPath] = this.value;
			}
			else {
				self.dataItem = {value:this.value};
			}
			self.onData(self.dataItem);
		};

		if(this.isRealTime){
			this.elements.controlContainer.onkeyup = f;
		}
		else { 
			this.elements.controlContainer.onchange = f;
		}

	}).extend(UIControl);
	
	TextField.prototype.onData = Event;
		
	TextField.prototype.dataIn = function(dataItem){
		UIControl.prototype.dataIn.call(this,dataItem);
		var value = this.dataItem[this.dataPath];
		
		if(value) this.elements.controlContainer.value = value;
	};
	
	TextField.prototype.clear = function(){
		this.elements.controlContainer.value = '';
	};


	/**
	 * Drop down list
	 * */
	var DropDownList = sjs.Class(function DropDownList(args){
		UIControl.call(this);
		this.dom = this.concrete.dom;
	}).extend(UIControl); 


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
			document.body.onmousedown = undefined;
		}).bind(this); 
		
	};
	

	DropDownList.prototype.dataIn = function(data){



	};
	
	DropDownList.prototype.hide = function() {
		this.dom.className = '-sc-drop-down-list -sc-hide';
	};


	/*
	 *	Image Selector
     *
	 * */
	var ImageSelector = Class(function ImageSelector(){
		
		var container = this.elements.controlContainer;

		if(this.width) 	container.width = this.width;
		if(this.height) container.height = this.height;

		if(this.src) this.elements.controlContainer.src = this.src;

	});

	ImageSelector.prototype.dataIn = function(dataItem) {
		if(!this.dataPath) return;

		this.elements.controlContainer.src = dataItem[this.dataPath];

	};




	var DomIterator = Class( function DomIterator(args){

		this.conc = [];

		this.dom = null; 
		if(args && args.dom) this.dom = args.dom;

		var self = this;

		this.template = args.dom;
		this.container = document.createElement('span');

/*
		for(var i = 0; i < 100; i++ ){
			this.conc.push(new args.dom({parent:this}));
			nodes.push(this.conc[i].concrete.dom);
		}
*/	
		this.concrete = {
			export:function(){
				return self.container;
			}
		};

		if(!args.dom) return;

	}).extend(sjs.Controller);

	DomIterator.prototype.dataIn = function(data){
		var nToUpdate = Math.min(this.conc.length, data.length);
		var nExisting = this.conc.length;
		var nCreate = data.length - this.conc.length;

		for(var i=0; i < nToUpdate; i++){
			this.conc[i].concrete.applyContent(data[i]);
			this.conc[i].data = data[i];		
		}

		if(nCreate > 0) //add new nodes
		for(var i=0; i < nCreate; i++) {
			var n = new this.template({parent:this});
			
			n.concrete.applyContent(data[nExisting + i]);
			n.data = data[i];
			this.container.appendChild(n.concrete.dom);
			this.conc.push(n);
		}

		if(nCreate < 0) //remove existing modes
		for(var i=this.conc.length-1; i >= nToUpdate; i--){
			this.container.removeChild(this.conc[i].concrete.dom);
			this.conc.splice(i,1);
		}	

	}

	 DomIterator = scope.createComponent(DomIterator,null);



	var PullOutPanel = Class( function PullOutPanel(){
		UIControl.call(this);
	}).extend(UIControl);


	PullOutPanel.prototype.onOpen  = Event;
	PullOutPanel.prototype.onClose = Event;


	PullOutPanel.prototype.open = function(){
		this.elements.controlContainer.style.left = '0px';
		this.onOpen();

	};

	PullOutPanel.prototype.close = function(){
		this.elements.controlContainer.style.left = '-500px';
		this.onClose();
	};


	// module exports
	return {
		
		UIControl:		scope.SpliceJS.UI.UIControl,
		TextField:		TextField,
		PullOutPanel: 	PullOutPanel,
		DomIterator: 	DomIterator,
		ImageSelector:  ImageSelector,
		Button:			scope.Buttons.Button,
		CheckBox:		scope.Buttons.CheckBox,
		RadioButton:	scope.Buttons.RadioButton
		
	}

// end module definition		
}});