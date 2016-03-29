sjs.module({
type:'component'
,
required:[
	{ Inheritance : '/{sjshome}/modules/splice.inheritance.js'},
	{ Events			: '/{sjshome}/modules/splice.event.js'},
	{'SpliceJS.UI':'../splice.ui.js'},
	{'Text':'/{sjshome}/modules/splice.text.js'},
	{'SpliceJS.Controls':'splice.controls.calendar.js'},
	{'SpliceJS.Controls':'splice.controls.selectors.js'},
	'splice.controls.datepicker.html'
]
,
definition:function(scope){
	"use strict";

	var sjs = scope.sjs
	,	imports = scope.imports
	;

	var
		Class       = imports.Inheritance.Class
	,	event       = imports.Events.event
	,   UIControl   = imports.SpliceJS.UI.UIControl
	,	format      = imports.Text.format
	;

	var DatePicker = Class(function DatePickerController(){
		this.base();

		event(this).attach({
			onDateSelected : event.multicast
		});

		var date = new Date();

		if(this.format){
			date = format('{0:'+this.format+'}',date);
		}

	}).extend(UIControl);

	DatePicker.prototype.initialize = function(){

	};

	DatePicker.prototype.onDataIn = function(item){
		this.setDate(item.getValue());
	};

	DatePicker.prototype.receiveFromCalendar = function (date) {
	    this.setDate(date);
	    this.onData(date);
	    this.children.selector.close();
	};

    //sets dates and will not trigger events
	DatePicker.prototype.setDate = function (date) {
	    if (!date) return;

	    if (this.format) {
	      date = format('{0:' + this.format + '}', date);
	    } else {
				date = date.toString();
			}

	    this.children.selector.dataIn(date);
	};

	scope.add (
		DatePicker
	);

	scope.exports(
		DatePicker
	);

}

});
