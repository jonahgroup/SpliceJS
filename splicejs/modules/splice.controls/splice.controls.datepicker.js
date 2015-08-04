_.Module({

required:[
	_.home('modules/splice.text.js')
,	'splice.controls.calendar.js'
,	'splice.controls.selectors.js'
,	'splice.controls.datepicker.html'
]
,

definition:function(){


	var DatePicker = _.Namespace('SpliceJS.Controls').Class(function DatePicker(){

		var date = new Date();

		if(this.format){
			date = _.Text.format('{0:'+this.format+'}',date);
		}

        //listen for date updates from outside
		this.onDataIn.subscribe(function (date) {
		    this.setDate(date);
		}, this);

	}).extend(SpliceJS.Controls.UIControl);


	

	DatePicker.prototype.receiveFromCalendar = function (date) {
	    this.setDate(date);
	    this.onData(date);
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
	DatePicker.prototype.onDateSelected = _.Event;
	DatePicker.prototype.onData = _.Event;

}

});