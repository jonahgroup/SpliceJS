/* global _ */
$js.module({
prerequisite:[
  '/{$jshome}/modules/splice.module.extensions.js'
],
imports:[
  	{ Inheritance : '/{$jshome}/modules/splice.inheritance.js'}
,	{ Events      : '/{$jshome}/modules/splice.event.js'}
,	{'SpliceJS.UI':'splice.ui.js'}
,	{'Controllers':'splice.controls/splice.controls.controllers.js'}
, 	{'Buttons':'splice.controls/splice.controls.buttons.js'}
,	{'DataControls':'splice.controls/splice.controls.datatable.js'}
//,	{'Charts':'splice.controls/splice.controls.charts.js'}
,	{'DataControls':'splice.controls/splice.controls.listbox.js'}
,	{'DataControls':'splice.controls/splice.controls.treeview.js'}
,	{'DataControls':'splice.controls/splice.controls.checklistbox.js'}
,	{'Panels':'splice.controls/splice.controls.drawerpanel.js'}
,	{'Panels':'splice.controls/splice.controls.scrollpanel.js'}
,	{'Panels':'splice.controls/splice.controls.viewpanel.js'}
,	{'Grids':'splice.controls/splice.controls.gridlayout.js'}
//,	{'Charts':'splice.controls/splice.controls.d3canvas.js'}
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
,	{'Buttons':'splice.controls/splice.controls.slider.js'}
,	{'DataControls':'splice.controls/splice.controls.treetable.js'}
,	'splice.controls/splice.controls.css'
, 	'splice.controls/splice.controls.html'
]
,
definition:function(){
	"use strict";

	var scope = this;

	/* imports */
	var
        imports = scope.imports
    ;

    var
        Class = imports.Inheritance.Class
	,	UIControl = imports.SpliceJS.UI.UIControl
	,   event = imports.Events.event
	;

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
		this.base();
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
	scope.exports(
		/* utility controls */
		{UIControl:		    imports.SpliceJS.UI.UIControl},
		{DomIterator: 	    imports.Controllers.DomIterator},
		{ImageSelector:     ImageSelector},
		/* buttons */
		{Button:			imports.Buttons.Button},
		{CheckBox:			imports.Buttons.CheckBox},
		{RadioButton:		imports.Buttons.RadioButton},
		{TextField:			imports.Buttons.TextField},
		{Slider:			imports.Buttons.Slider},
		/* panels */
		{DrawerPanel:		imports.Panels.DrawerPanel},
		{ViewPanel:			imports.Panels.ViewPanel},
		{ScrollPanel:		imports.Panels.ScrollPanel},
		/* charts */
		//{Chart:				imports.Charts.Chart},
		//{Dial:				imports.Charts.Dial},
		{GridLayout:        imports.Grids.GridLayout},
        {CellContainer:     imports.Grids.CellContainer},
		//{D3Canvas:			imports.Charts.D3Canvas},
		//{Map:				imports.Maps.Map},
		/* selectors */
		{DropDownSelector:	imports.Selectors.DropDownSelector},
		{DropDownList:		imports.Selectors.DropDownList},
		{DatePicker:		imports.Selectors.DatePicker},
		{Calendar:			imports.Selectors.Calendar},
		{ComboBox:			imports.Selectors.ComboBox},
		/* data controls */
		{DataTable:			imports.DataControls.DataTable},
		{DataTableRow:		imports.DataControls.DataTableRow},
		{ListBox:			imports.DataControls.ListBox},
		{ListItem:			imports.DataControls.ListItem},
		{ScrollableListBox:	imports.DataControls.ScrollableListBox},
		{StretchListBox:	imports.DataControls.StretchListBox},
		{GroupedListItem:	imports.DataControls.GroupedListItem},
		{TreeView:			imports.DataControls.TreeView},
		{TreeTable:			imports.DataControls.TreeTable},
		{CheckListBox:		imports.DataControls.CheckListBox},
		/* Navigation */
		{Popup:				imports.Navigation.Popup},
		{PageLoader:		imports.Navigation.PageLoader},
		{ToolTip:			imports.Navigation.ToolTip},
		/* Editors */
		//{CodeEditor:		imports.Editors.CodeEditor},
		/* Controllers*/
		{ListItemController:imports.DataControls.ListItemController}
	);

// end module definition
}
});
