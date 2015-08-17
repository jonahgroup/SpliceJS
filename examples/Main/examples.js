
_.Module({

required:[
	'examples.html',
	'examples.css'

],

definition:function(){

	var Controller = this.framework.Controller
	,	Component = this.framework.Component;

	var MENU_DATA = [
		['BasicApplication', 'A simple application to demonstrate template use... '],
		['Controls Demo',	 'A simple application to demonstrate template use... '],
		['Data Table',		 'A simple application to demonstrate template use... '],
		['Web Dashboard',	 'A simple application to demonstrate template use... '],
		['D3 Rectangles',	 'A simple application to demonstrate template use... ']
	]


	var MainMenu = Component('MainMenu')(function MainMenu(){
		Controller.call(this);

		var self = this;
		this.onData(MENU_DATA);
			
		this.onLinkClick.subscribe(function(a){
			self.onClosePanel();
		});

	}).extend(Controller);




	MainMenu.prototype.onData = _.Event;
	MainMenu.prototype.onLinkClick = _.Event;

	MainMenu.prototype.onOpenPanel 	= _.Event;
	MainMenu.prototype.onClosePanel = _.Event;



	return {
		
		MainMenu:MainMenu
		
	}


}


});



function BasicApplication(){
	_.load(['BasicApplication/basicapplication.js'],function(){
		new UserApplications.BasicApplication().exitApplication = function(){
			_.Doc.display(new UserApplications.MainMenu());
		};
	});
}


function ControlsApplication(){
	_.load(['Controls/controlsdemoapplication.js'],function(){
		_.display(new UserApplications.ControlsDemoApplication());		
	});
}



function ControlsAndBindings(){
	_.load(['ControlsAndBindings/controlsandbindings.js'],function(){
		_.Doc.display(new UserApplications.ControlsAndBindings());
	});
}


function ScrollPanelSample(){
	_.load(['ScrollPanel/scrollpanelapplication.js'],function(){
		_.Doc.display(new UserApplications.ScrollPanelApplication());
	});
}

function WebDashboard(){
	_.load(['WebDashboard/webdashboard.js'],function(){
		_.Doc.display(new UserApplications.WebDashboard());
	});
}

function D3DemoA(){
	_.load(['D3/rectangles.js'],function(){
		_.display(new UserApplications.D3Rectangles2());
	});
}

function D3DemoB(){
	_.load(['D3/streamgraph.js'],function(){
		_.display(new UserApplications.D3StreamGraph({width:800, height:400}));
	});
}