/* global _ */
sjs.module({

required:[
	{'SpliceJS.UI':'splice.ui.js'}
,	{'Controllers':'splice.controls/splice.controls.controllers.js'}
, {'Buttons':'splice.controls/splice.controls.buttons.js'}
,	{'DataControls':'splice.controls/splice.controls.datatable.js'}
,	{'Charts':'splice.controls/splice.controls.charts.js'}
,	{'DataControls':'splice.controls/splice.controls.listbox.js'}
,	{'DataControls':'splice.controls/splice.controls.treeview.js'}
,	{'DataControls':'splice.controls/splice.controls.checklistbox.js'}
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
,	{'Selectors':'splice.controls/splice.controls.combobox.js'}
,	{'Navigation':'splice.controls/splice.controls.popup.js'}
,	{'Navigation':'splice.controls/splice.controls.pageloader.js'}
,	{'Navigation':'splice.controls/splice.controls.tooltip.js'}
,	{'Editors':'splice.controls/splice.controls.codeeditor.js'}
,	{'Buttons':  'splice.controls/splice.controls.slider.js'}
,	{'DataControls':'splice.controls/splice.controls.treetable.js'}
,	'splice.controls/splice.controls.css'
, 'splice.controls/splice.controls.html'
]
,
definition:function component(sjs){
	"use strict";
	var scope = this.scope;

	/* imports */
	var Class 	= sjs.Class
	, 	event 	= sjs.event
	,		exports = sjs.exports;


	var UIControl = scope.SpliceJS.UI.UIControl;

	/*
	 *	Image Selector
     *
	 * */
	var ImageSelector = Class(function ImageSelectorController(){

		var container = this.elements.root;

		if(this.width) 	container.width = this.width;
		if(this.height) container.height = this.height;

		if(this.src) this.elements.root.src = this.src;
	});

	ImageSelector.prototype.dataIn = function(dataItem) {
		if(!this.dataPath) return;

		this.elements.root.src = dataItem[this.dataPath];
	};


	var PullOutPanel = Class( function PullOutPanelController(){
		this.super();
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
	exports.module(
		/* utility controls */
		{UIControl:			scope.SpliceJS.UI.UIControl},
		{DomIterator: 	scope.Controllers.DomIterator},
		{ImageSelector: ImageSelector},
		/* buttons */
		{Button:				scope.Buttons.Button},
		{CheckBox:			scope.Buttons.CheckBox},
		{RadioButton:		scope.Buttons.RadioButton},
		{TextField:			scope.Buttons.TextField},
		{Slider:				scope.Buttons.Slider},
		/* panels */

		{DrawerPanel:		scope.Panels.DrawerPanel},
		{ViewPanel:			scope.Panels.ViewPanel},
		{ScrollPanel:		scope.Panels.ScrollPanel},
		/* charts */
		{Chart:							scope.Charts.Chart},
		{Dial:							scope.Charts.Dial},
		{GridLayout:        scope.Grids.GridLayout},
    {CellContainer:     scope.Grids.CellContainer},
		{D3Canvas:					scope.Charts.D3Canvas},
		{Map:								scope.Maps.Map},
		/* selectors */
		{DropDownSelector:	scope.Selectors.DropDownSelector},
		{DropDownList:			scope.Selectors.DropDownList},
		{DatePicker:				scope.Selectors.DatePicker},
		{Calendar:					scope.Selectors.Calendar},
		{ComboBox:					scope.Selectors.ComboBox},
		/* data controls */
		{DataTable:					scope.DataControls.DataTable},
		{DataTableRow:			scope.DataControls.DataTableRow},
		{ListBox:						scope.DataControls.ListBox},
		{ListItem:					scope.DataControls.ListItem},
		{ScrollableListBox:	scope.DataControls.ScrollableListBox},
		{StretchListBox:		scope.DataControls.StretchListBox},
		{GroupedListItem:		scope.DataControls.GroupedListItem},
		{TreeView:					scope.DataControls.TreeView},
		{TreeTable:					scope.DataControls.TreeTable},
		{CheckListBox:			scope.DataControls.CheckListBox},

		/* Navigation */
		{Popup:					scope.Navigation.Popup},
		{PageLoader:		scope.Navigation.PageLoader},
		{ToolTip:				scope.Navigation.ToolTip},
		/* Editors */
		{CodeEditor:		scope.Editors.CodeEditor},
		/* Controllers*/
		{ListItemController:scope.DataControls.ListItemController}
	);

// end module definition
}});
