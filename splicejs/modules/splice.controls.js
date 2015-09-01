/* global _ */
sjs({

required:[	
			
	{'SpliceJS.UI':'splice.ui.js'}
,	'splice.controls/splice.controls.css'
,  	'splice.controls/splice.controls.html'
,	{'Controllers':'splice.controls/splice.controls.controllers.js'}
,  	{'Buttons':'splice.controls/splice.controls.buttons.js'}
,	{'DataControls':'splice.controls/splice.controls.datatable.js'}
,	{'Charts':'splice.controls/splice.controls.charts.js'}
,	{'DataControls':'splice.controls/splice.controls.listbox.js'}
,	{'DataControls':'splice.controls/splice.controls.treeview.js'}
,	{'Panels':'splice.controls/splice.controls.drawerpanel.js'}
,	{'Panels':'splice.controls/splice.controls.scrollpanel.js'}	
,	{'Panels':'splice.controls/splice.controls.viewpanel.js'}
,	{'Grids':'splice.controls/splice.controls.gridlayout.js'}
,	{'Charts':'splice.controls/splice.controls.d3canvas.js'}
,	{'Maps':'splice.controls/splice.controls.map.js'}
,	{'Selectors':'splice.controls/splice.controls.selectors.js'}
,	{'Selectors':'splice.controls/splice.controls.datepicker.js'}
,	{'Selectors':'splice.controls/splice.controls.dropdownlist.js'}
,	{'Selectors':'splice.controls/splice.controls.calendar.js'}
,	{'Navigation':'splice.controls/splice.controls.popup.js'}
,	{'Navigation':'splice.controls/splice.controls.pageloader.js'}
,	{'Editors':'splice.controls/splice.controls.codeeditor.js'}
,	{'Buttons':  'splice.controls/splice.controls.slider.js'}

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
	

	/*
	 *	Image Selector
     *
	 * */
	var ImageSelector = Component('ImageSelector')(function ImageSelector(){
		
		var container = this.elements.controlContainer;

		if(this.width) 	container.width = this.width;
		if(this.height) container.height = this.height;

		if(this.src) this.elements.controlContainer.src = this.src;
	});

	ImageSelector.prototype.dataIn = function(dataItem) {
		if(!this.dataPath) return;

		this.elements.controlContainer.src = dataItem[this.dataPath];
	};


	var PullOutPanel = Component('PullOutPanel')( function PullOutPanel(){
		UIControl.call(this);
	}).extend(UIControl);


	PullOutPanel.prototype.onOpen  = Event;
	PullOutPanel.prototype.onClose = Event;


	PullOutPanel.prototype.open = function(){
		this.elements.root.style.left = '0px';
		this.onOpen();
	};

	PullOutPanel.prototype.close = function(){
		this.elements.root.style.left = '-500px';
		this.onClose();
	};


	// module exports
	return {
		/* utility controls */
		UIControl:			scope.SpliceJS.UI.UIControl,
		DomIterator: 		scope.Controllers.DomIterator,
		ImageSelector:  	ImageSelector,
		/* buttons */
		Button:				scope.Buttons.Button,
		CheckBox:			scope.Buttons.CheckBox,
		RadioButton:		scope.Buttons.RadioButton,
		TextField:			scope.Buttons.TextField,
		Slider:				scope.Buttons.Slider,
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
		Calendar:			scope.Selectors.Calendar,
		/* data controls */
		DataTable:			scope.DataControls.DataTable,
		DataTableRow:		scope.DataControls.DataTableRow,
		ListBox:			scope.DataControls.ListBox,
		ListItem:			scope.DataControls.ListItem,
		ScrollableListBox:	scope.DataControls.ScrollableListBox,
		StretchListBox:		scope.DataControls.StretchListBox,
		GroupedListItem:	scope.DataControls.GroupedListItem,
		TreeView:			scope.DataControls.TreeView,
		/* Navigation */
		Popup:				scope.Navigation.Popup,
		PageLoader:			scope.Navigation.PageLoader,
		/* Editors */
		CodeEditor:			scope.Editors.CodeEditor
		
	}

// end module definition		
}});