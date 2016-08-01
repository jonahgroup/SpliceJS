sjs.module({
prerequisite:[
	'/{sjshome}/modules/splice.module.extensions.js'
],
required:[
	{ Inheritance : '/{sjshome}/modules/splice.inheritance.js'},
	{'SpliceJS.UI':'../splice.ui.js'},
	'splice.controls.viewpanel.html',
	'splice.controls.viewpanel.css'
]
,
definition:function(scope){

	var
		sjs = scope.sjs
    ,   imports = scope.imports
	//,	overlay = sjs.display.overlay
	;
	var
	    Class 	    = imports.Inheritance.Class
	,   UIControl   = imports.SpliceJS.UI.UIControl
	;
	/**
	 *
	 * ViewPanel
	 * Allows transitioning between views
	 */

	var ViewPanel = Class(function ViewPanelController(){
		this.super();

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

	 	var self = this;
	 	this.onDisplay.subscribe(function(){
	 		self.display();
	 	});

	}).extend(UIControl);



	ViewPanel.prototype.display = function(){

		/*
			size client panels
		*/
		var contSize = _.Doc.$(this.elements.root).size();


		_.Doc.$(this.elements.panel1).size(contSize);
		_.Doc.$(this.elements.panel2).size(contSize);

		_.Doc.$(this.elements.panel2).position({left:contSize.width});

		overlay(this.viewInstances[0],this.panels[this.activePanelIndex]);

	};


	ViewPanel.prototype.switchView = function(viewIndex){

		var contSize = _.Doc.$(this.elements.root).size(),

			activePanel = this.panels[this.activePanelIndex],
			offscrPanel = this.panels[1-this.activePanelIndex],

			view = this.viewInstances[viewIndex],

			self = this;


		if(this.activeViewIndex == viewIndex) return;


		_.Doc.$(offscrPanel).embed(view);


		activePanel.className += ' -splicejs-left-transition';
		offscrPanel.className += ' -splicejs-left-transition';

		var handler = function(e){

			activePanel.className = _.Text(activePanel.className).remword('-splicejs-left-transition');
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
