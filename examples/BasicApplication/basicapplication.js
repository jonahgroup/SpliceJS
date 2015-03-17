_.Module({

required:['../examples/BasicApplication/basicapplication.css',
          '../examples/BasicApplication/main.htmlt'],

definition:function(){

	var BasicApplication = _.Namespace('UserApplications').Class(function BasicApplication(){
		
		var clock = new UserControls.Clock();
		clock.start();
		
		_.Doc.display(clock,function(x){
			_.Animate(x.concrete.dom).opacity(0, 100, 900);
		});

	});
	
	
	
	/*
	 * 
	 * Clock class
	 * */
	var Clock = _.Namespace('UserControls').Class(function Clock(){
	});
	
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