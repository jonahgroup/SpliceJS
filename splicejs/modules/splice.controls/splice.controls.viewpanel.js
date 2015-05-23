_.Module({
	
required:[
	'splice.controls.viewpanel.htmlt',
	'splice.controls.viewpanel.css'
],

definition:function(){
	

	/**
	 *	
	 * ViewPanel
	 * Allows transitioning between views
	 */

	var ViewPanel = _.Namespace('SpliceJS.Controls').Class(function ViewPanel(){

	 	this.viewInstances = [];

	 	if(this.views && this.views.length > 0) {
	 		for(var i=0; i < this.views.length; i++){
	 			var v = this.views[i];
	 			this.viewInstances.push(new v.view({parent:this}));
	 		}
	 	}

	 	this.panels = [
	 		this.elements.panel1,
	 		this.elements.panel2
	 	];

	 	this.activePanelIndex = 0;

	}).extend(SpliceJS.Controls.UIControl);


	ViewPanel.prototype.onDisplay = function(){

		/*
			size client panels
		*/
		var contSize = _.Doc.$(this.elements.controlContainer).size();
			
		
		_.Doc.$(this.elements.panel1).size(contSize);
		_.Doc.$(this.elements.panel2).size(contSize);
				
		_.Doc.$(this.elements.panel2).position({left:contSize.width});

		_.Doc.$(this.panels[this.activePanelIndex]).embed(this.viewInstances[0]);
	};


	ViewPanel.prototype.switchView = function(viewIndex){

		var contSize = _.Doc.$(this.elements.controlContainer).size(),

			activePanel = this.panels[this.activePanelIndex],
			offscrPanel = this.panels[1-this.activePanelIndex],

			view = this.viewInstances[viewIndex],

			self = this;


		if(this.activeViewIndex == viewIndex) return;


		_.Doc.$(offscrPanel).embed(view);
		
		
		activePanel.className += ' -splicejs-left-transition';
		offscrPanel.className += ' -splicejs-left-transition';

		var handler = function(e){
									
			activePanel.className = _.text(activePanel.className).remword('-splicejs-left-transition');
			activePanel.style.left = '100%';	

			self.activePanelIndex = 1 - self.activePanelIndex;
			self.activeViewIndex = viewIndex;

			activePanel.transitionend = null;
			
			activePanel.removeEventListener("transitionend", handler , true);
		};

		activePanel.addEventListener("transitionend", handler , true);

		activePanel.style.left = (-1 * _.Doc.$(activePanel).size().width) + 'px';
		offscrPanel.style.left = 0;

	};

}

});