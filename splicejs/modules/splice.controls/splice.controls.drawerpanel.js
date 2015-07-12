_.Module({
	
required:[ 
	_.home('modules/splice.ui.js'),
	_.home('modules/splice.controls/splice.controls.scrollpanel.js'),
	'splice.controls.transitions.css',
	'splice.controls.drawerpanel.css',
	'splice.controls.drawerpanel.html'
],

definition:function(){

	/* DrawerPanel*/

	var DrawerPanel = _.Namespace('SpliceJS.Controls').Class(
		function DrawerPanel(){
			
			this.isOpen = false;

			if(!this.openTo) this.openTo = 0.75;

			var self = this;
			this.elements.actuator.onclick = function(){
				self.activateDrawer();		
			}
		}
	).extend(SpliceJS.Controls.UIControl);


	DrawerPanel.prototype.onDisplay = function(){
		SpliceJS.Controls.UIControl.prototype.onDisplay.call(this);

		var openWidth = this.openWidth = this.elements.controlContainer.clientWidth * this.openTo;
		
		this.elements.drawer.style.left = (-1 * openWidth) + 'px';
		

		this.elements.drawer.className += ' -splicejs-left-transition';

	};



	DrawerPanel.prototype.activateDrawer = function(){
			
		var self = this;	

		this.elements.drawer.style.width = this.openWidth + 'px';
	
		var width = this.elements.controlContainer.clientWidth;

		var actuatorIconSize = {
			width: 	this.elements.actuatorIcon.clientWidth,
			height: this.elements.actuatorIcon.clientHeight
		};

		var s = this.elements.drawer.style;
		var s_actuator = this.elements.actuator.style;


		var from = to = 0;
		var scale = 1;
		var color = "#cecece";

		if(!this.isOpen) {
			from = 0;
			to = width * this.openTo;
			scale = 0.95;
			color = "#cecece";

		} else {
			
			from = width * this.openTo;
			to = 0;
			scale = 1;
			color = "#121212";			
		}

		self.isOpen = !self.isOpen;
		
		this.elements.actuator.addEventListener("transitionend", function(e){
			
		}, true);

		
		this.elements.body.style.color = color;

		
		if(self.isOpen) {
			this.elements.drawer.style.transitionDelay = '0s';
			this.elements.body.style.transitionDelay = '0.1s';
			this.elements.drawer.style.left = '0px';
		} else {
			this.elements.drawer.style.transitionDelay = '0.1s';
			this.elements.body.style.transitionDelay = '0s';
			this.elements.drawer.style.left = (-1*this.openWidth) + 'px';
		}


		
		this.elements.body.style.left = to + 'px';

		var actuator_to = (to - actuatorIconSize.width - 10);
		if(!self.isOpen) actuator_to = 10;

		this.elements.actuator.style.left = actuator_to + 'px';



	};




}




});