_.Module({

required:['../resources/fontfaces.css',
          'basicapplication.css',
          'basicapplication.htmlt'],

definition:function(){

	var BasicApplication = _.Namespace('UserApplications').Class(function BasicApplication(){
		
		//var clock = new UserControls.Clock();
		this.ref.clock.start();
		
		_.Doc.display(this,function(x){
			_.Animate(x.concrete.dom).opacity(0, 100, 900);
		});
		
		var self = this;
		this.elements.mainMenuButton.onclick = function(){
			self.exitApplication();
		};

	});
	
	
	BasicApplication.prototype.exitApplication = function(){
		
	};
	
	
	/*
	 * 
	 * Clock class
	 * */
	var Clock = _.Namespace('UserControls').Class(function Clock(){
		if(this.autoStart === true) this.start();
		if(this.staticDate === true) this.setDateTime(new Date());
		this.start();
	});
	

	Clock.prototype.setDateTime = function(dateTime){
		if(!dateTime) return;

		var d = dateTime;
		var l = (100 + d.getHours()+'').substr(1,2) + ':' + 
				(100 + d.getMinutes()+'').substr(1,2) + ':' + 
				(100 + d.getSeconds()+'').substr(1,2);
		
		this.elements.clockLabel.innerHTML = l;
	};



	Clock.prototype.start = function(){
		
		var labelElement = 	this.elements.clockLabel; 
		
		var looper = function(){
			var d = new Date();
			var l = (100 + d.getHours()+'').substr(1,2) + ':' + 
					(100 + d.getMinutes()+'').substr(1,2) + ':' + 
					(100 + d.getSeconds()+'').substr(1,2);
		
			labelElement.innerHTML = l;
			window.setTimeout(looper,1000);
		}
		
		looper();
	};

}});