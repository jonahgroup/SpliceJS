_.Module({
required:[
	'splice.controls.calendar.html',
	'splice.controls.calendar.css'
	],	
definition:function(){ 

	var _Calendar = {
	
		
		DAYS_MONTH : [/* non leap year*/ [31,28,31,30,31,30,31,31,30,31,30,31],
					  /* leap year */	 [31,29,31,30,31,30,31,31,30,31,30,31]],
					  
		MONTHS_NAME:['January', 'February', 'March', 'April', 'May', 'June', 
					 'July', 'August', 'September','October', 'November', 'December'],			  
		
		
		/* 
		 * number of milliseconds in a day
		 * */
		DAY_MILS : (3600 * 24 * 1000),
		
		CALENDAR : null,
		CURRENT_DATE : null,
		
		CURRENT_PARENT:null,
	
		create:function(){
			if(!this.CALENDAR){
				var cldr = document.createElement('div');
				cldr.className = 'cl-popup-calendar';
				
				cldr.innerHTML = this.HTML_CAL_GRID;
				
				this.CALENDAR = cldr;
				
				
				var anchors = _$_('id-popup-calendar-controls').getElementsByTagName('a');
				
				for(var i=0; i<anchors.length; i++){
					anchors[i].onmousedown = function(e){CSDialogs.Calendar.trapEvent(e);};
				}
			}
		},
		
		showCalendar: function(year, month, day) {
			
			this.create();
			
			if(year && month && day  ) {
				this.CURRENT_DATE = new Date(year,month-1,day,0,0,0,0);
			}
			else {
				this.CURRENT_DATE = new Date();
			}
			
			this.renderMonth(this.CURRENT_DATE);
			
			this.CALENDAR.style.visibility = 'visible';
			//document.body.onmousedown = function(){CSDialogs.Calendar.hide();};
		},
		
		isLeapYear: function(year){
			
			/* 
			 * create date object for the March 1st of the required year
			 * */
			var td = new Date(year,2,1,0,0,0,0);
						
			/* 
			 * previous day
			 * */
			td.setTime(td.valueOf() - this.DAY_MILS);
			
			if(td.getDate() == 29) return true;
			
			return false;
		},
	
	
		renderMonth:function(dt) {
						
			var year 	= dt.getFullYear();
			var month 	= dt.getMonth();
			var day 	= dt.getDate();
			
			var is_leap = this.isLeapYear(year)?1:0;
			var days 	= this.DAYS_MONTH[is_leap][month];

			var start_week_day = new Date(year, month,1,0,0,0,0).getDay();  
			
			
			
			/* Iterate over days */
			var row = 0;
			var col = 0;
			
			var overflow = 7-start_week_day+ 7;
			
			
			var cde = document.getElementById('id-popup-calendar-current-date');
 			cde.innerHTML = this.MONTHS_NAME[month] + ', ' + year;
			
			
			/*
			 * Back track into a previous month
			 * */
			if(start_week_day > 0) {
			
				var _days 	= this.DAYS_MONTH[is_leap][(month-1)<0?11:(month-1)];
				var _offset = _days - start_week_day+1;  
			
				for(var i=0; i < start_week_day; i++){
					row = Math.floor(i / 7);				
					col = i % 7;
					
					_day = i+_offset;
					
					var cell = this.getCell(row+2,col);
					cell.xdateprev = true;  
					
					if(!cell ) return;
					/* 
					 * register bubble mode event handler 
					 * */
					if(!cell.onclick) cell.onclick = function(e){
						if(!e) e = window.event;
						
						CSDialogs.Calendar.decorateCell(this); 
						CSDialogs.Calendar.hide();
					};
					
					cell.onmousedown = function(e){CSDialogs.Calendar.trapEvent(e);};
				
					cell.innerHTML = _day;
					cell.className = 'none';
				}
			}
			
			/*
			 * Render this month and the overflow
			 * */
			for(var i=start_week_day; i < days+start_week_day + overflow; i++){
				row = Math.floor(i / 7);				
				col = i % 7;

				_day = ((i-start_week_day) % days)+1;
				
				var cell = this.getCell(row+2,col);
				

				
				
				if(!cell) return;
				if(!cell.onclick) cell.onclick = function(e){
					if(!e) e = window.event;
					e.cancelBubble = true;
					if (e.stopPropagation) e.stopPropagation();
					
					CSDialogs.Calendar.decorateCell(this);
					CSDialogs.Calendar.hide();
				};
				
				cell.onmousedown = function(e){CSDialogs.Calendar.trapEvent(e);};
			
				
				cell.innerHTML = _day;
				/* style this month*/
				if(i < days+start_week_day) {
					cell.className = 'cl-this-month';
					cell.xdatenext = false;
					cell.xdateprev = false;
				} else {
					cell.className = 'none';
					cell.xdatenext = true;  
				}
				if(_day == day && i<days+start_week_day ) cell.className = 'cl-today';
 			}
 			
 		},

		getCell:function(row, col) {
			try {
			var t = this.CALENDAR.childNodes[0];
			var r = t.rows[row];
			return r.cells[col]; } catch(e) {return null;}
		},
		
		next:function(){
			var m = this.CURRENT_DATE.getMonth();
			var y = this.CURRENT_DATE.getFullYear();
			var d = 1;
			
			m++;
			if(m > 11) { y++; 
				m = 1;
			}
			
			this.CURRENT_DATE = new Date(y,m,d,0,0,0,0);
			
			this.renderMonth(this.CURRENT_DATE);
		},
				
		prev:function(){
			var m = this.CURRENT_DATE.getMonth();
			var y = this.CURRENT_DATE.getFullYear();
			var d = 1;
			m--;
			if(m < 0) {
				m = 11;
				y--;
			}
			
			this.CURRENT_DATE = new Date(y,m,d,0,0,0,0);
			this.renderMonth(this.CURRENT_DATE);
		},
		
		decorateCell:function(cell){
			var date_value = cell.innerHTML;
			
			if(cell.xdateprev){
				this.prev();
			}
			if(cell.xdatenext){
				this.next();
			}
			this.CURRENT_DATE.setDate(date_value);
			this.CURRENT_PARENT.value = this.formatDate(this.CURRENT_DATE); 
		},
		
		
		formatDate:function(date){
			//var str_d = (date.getMonth()+1) + '/' + date.getDate() + '/' + date.getFullYear();
			
			var str_d = CSDialogs.Calendar.MONTHS_NAME[(date.getMonth())] + ' ' + date.getDate() + ', ' + date.getFullYear();
			return str_d;
		},
		
		parseDate:function(strDate){
			var dateParts = strDate.split("/");
			if ( !isNaN(dateParts[2]) && !isNaN(dateParts[1]) && !isNaN(dateParts[0]) ) {
				var date = new Date(dateParts[2], (dateParts[1] - 1), dateParts[0]);
				var str_d = (date.getMonth()+1) + '/' + date.getDate() + '/' + date.getFullYear();
				return str_d;
			}
			else {
				return null;
			}
		},
		hide:function(){ this.CALENDAR.style.visibility = 'hidden';
						document.body.onmousedown = null;
						if(typeof(this.onClose) === "function" ) this.onClose();
						this.onClose = null;
						this.CURRENT_PARENT.focus();
		},
		
		showAt:function(parent, onclose, year, month, day){
		
			this.create();
			
			this.CURRENT_PARENT = parent;
			
			var p = JSPositioning.absPosition(parent);
			
			var w = {w:document.documentElement.clientWidth,
					 h:document.documentElement.clientHeight};
			
			var d = {w:parent.offsetWidth,
					 h:parent.offsetHeight};
			
			var calendar_d = {w:this.CALENDAR.offsetWidth,
					 		  h:this.CALENDAR.offsetHeight};
			
			var cp = {x:0, y:0};
			
			if( (p.y + d.h + calendar_d.h) > w.h  ) {
				cp.y = p.y - calendar_d.h;
			} else {
				cp.y = p.y + d.h;
			}
			
			if(p.x + calendar_d.w > w.w) {
				cp.x = w.w - calendar_d.w;
			} else {
				cp.x = p.x;
			}
			
			this.CALENDAR.style.left = cp.x + 'px';
			this.CALENDAR.style.top = cp.y + 'px';
			
			this.onClose = onclose;
			

			//var date = parent.value.match(/[0-9]+/g);
			var date = null;
			if (date && date.length > 0){
				this.showCalendar(date[2], date[0], date[1]);
			}
			else{
				this.showCalendar();
			}
		
		},
		
		onClose:null,
		
		trapEvent:function(e){
			if(!e) e = window.event;
			e.cancelBubble = true;
			if (e.stopPropagation) e.stopPropagation();
		}
		
	}; //var Calendar



	var Calendar = _.Namespace('SpliceJS.Controls').Class(function Calendar(){



	}).extend(SpliceJS.Core.Controller);




}

});