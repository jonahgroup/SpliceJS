sjs({

required:[
	{'SpliceJS.UI':'../splice.ui.js'}
,	{'Text':'{sjshome}/modules/splice.text.js'}
,	{'SpliceJS.Controls':'splice.controls.calendar.js'}
,	{'SpliceJS.Controls':'splice.controls.selectors.js'}
,	'splice.controls.datepicker.html'
]
,

definition:function(sjs){

	var scope = this.scope
	,	Class = this.sjs.Class
	,	event = this.sjs.event
	,	exports = this.sjs.exports;

	var UIControl = scope.SpliceJS.UI.UIControl
	,	format = scope.Text.format;

	var DatePicker = Class(function DatePickerController(){
		this.super();

		event(this).attach({
			onDateSelected : event.multicast
		});

		var date = new Date();

		if(this.format){
			date = format('{0:'+this.format+'}',date);
		}

	}).extend(UIControl);


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

	exports.scope (
		DatePicker
	);

	exports.module(
		DatePicker
	);

}

});
