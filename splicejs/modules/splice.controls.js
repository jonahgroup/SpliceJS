/* global _ */
_.Module({

required:[	
			
	{'SpliceJS.UI':'splice.ui.js'}
,	'splice.controls/splice.controls.css'
,  	'splice.controls/splice.controls.html'

,  	{'Buttons':'splice.controls/splice.controls.buttons.js'}
,	{'DataControls':'splice.controls/splice.controls.datatable.js'}
,	{'Charts':'splice.controls/splice.controls.charts.js'}
,	{'DataControls':'splice.controls/splice.controls.listbox.js'}
,	{'Panels':'splice.controls/splice.controls.drawerpanel.js'}
,	{'Panels':'splice.controls/splice.controls.scrollpanel.js'}	
,	{'Panels':'splice.controls/splice.controls.viewpanel.js'}
,	{'Grids':'splice.controls/splice.controls.gridlayout.js'}
,	{'Charts':'splice.controls/splice.controls.d3canvas.js'}
,	{'Maps':'splice.controls/splice.controls.map.js'}
,	{'Selectors':'splice.controls/splice.controls.selectors.js'}
,	{'Selectors':'splice.controls/splice.controls.datepicker.js'}
,	{'Selectors':'splice.controls/splice.controls.dropdownlist.js'}
/*
,	'splice.controls/splice.controls.codeeditor.js'

,	'splice.controls/splice.controls.calendar.js'

,	'splice.controls/splice.controls.treeview.js'
,	'splice.controls/splice.controls.popup.js'
,   'splice.controls/splice.controls.pageloader.js'
,   'splice.controls/splice.controls.slider.js'
*/
]
, 	
definition:function(){
	"use strict";
	var scope = this;

	/* imports */
	var Class = this.framework.Class
	, 	Event = this.framework.Event
	,	Controller = this.framework.Controller
	, 	UIControl = this.SpliceJS.UI.UIControl
	,	Component = this.framework.Component;
	
	
	
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




	var DomIterator = Component(null)( function DomIterator(args){

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

	}).extend(Controller);

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
		/* utility controls */
		UIControl:			scope.SpliceJS.UI.UIControl,
		TextField:			TextField,
		DomIterator: 		DomIterator,
		ImageSelector:  	ImageSelector,
		/* buttons */
		Button:				scope.Buttons.Button,
		CheckBox:			scope.Buttons.CheckBox,
		RadioButton:		scope.Buttons.RadioButton,
		/* panels */
		PullOutPanel: 		PullOutPanel,
		DrawerPanel:		scope.Panels.DrawerPanel,
		ViewPanel:			scope.Panels.ViewPanel,
		ScrollPanel:		scope.Panels.ScrollPanel,
		/* charts */
		Chart:				scope.Charts.Chart,
		Dial:				scope.Charts.Dial,
		GridLayout:			scope.Grids.GridLayout,
		D3Canvas:			scope.Charts.D3Canvas,
		Map:				scope.Maps.Map,
		/* selectors */
		DropDownSelector:	scope.Selectors.DropDownSelector,
		DropDownList:		scope.Selectors.DropDownList,		
		DatePicker:			scope.Selectors.DatePicker,
		/* data controls */
		DataTable:			scope.DataControls.DataTable,
		ListBox:			scope.DataControls.ListBox,
		ListItem:			scope.DataControls.ListItem,
		ScrollableListBox:	scope.DataControls.ScrollableListBox,
		StretchListBox:		scope.DataControls.StretchListBox,
		GroupedListItem:	scope.DataControls.GroupedListItem
	}

// end module definition		
}});