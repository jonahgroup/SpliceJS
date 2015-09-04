sjs({

required:[
	{'SpliceJS.UI':'../splice.ui.js'}
,	{'Text':'{sjshome}/modules/splice.text.js'}
,	{'SpliceJS.Controls':'splice.controls.calendar.js'}
,	{'SpliceJS.Controls':'splice.controls.selectors.js'}
,	'splice.controls.datepicker.html'
]
,

definition:function(){

	var scope = this.scope
	,	Class = this.Class
	,	Event = this.Event;
	
	var UIControl = scope.SpliceJS.UI.UIControl;

	var DatePicker = Class.extend(UIControl)(function DatePickerController(){
		UIControl.call(this);
		
		var date = new Date();

		if(this.format){
			date = _.Text.format('{0:'+this.format+'}',date);
		}

        //listen for date updates from outside
		this.onDataIn.subscribe(function (date) {
		    this.setDate(date);
		}, this);

	});


	

	DatePicker.prototype.receiveFromCalendar = function (date) {
	    this.setDate(date);
	    this.onData(date);
	    this.ref.selector.close();
	}



    //sets dates and will not trigger events    
	DatePicker.prototype.setDate = function (date) {
	    if (!date) return;

	    if (this.format) {
	        date = _.Text.format('{0:' + this.format + '}', date);
	    }

	    this.ref.selector.dataIn(date);
	}


	//override reflow call from parent componenets
	DatePicker.prototype.reflow = function(){};

    // fires when date has been selected
	DatePicker.prototype.onDateSelected = Event;
	DatePicker.prototype.onData 		= Event;


	return {};
}

});