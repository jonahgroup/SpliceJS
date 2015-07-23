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


		this.onDateSelected(date.toString());

	}).extend(SpliceJS.Controls.UIControl);


	DatePicker.prototype.onDateSelected = _.Event;

}

});