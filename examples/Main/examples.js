
_.Module({

required:[
	'examples.htmlt',
	'examples.css'

],

definition:function(){


	var MENU_DATA = [
		{linkname:'BasicApplication'},
		{linkname:'Controls Demo'},
		{linkname:'Data Table'},
		{linkname:'Web Dashboard'},
		{linkname:'D3 Rectangles'}
	]


	var MainMenu = _.Namespace('UserApplications').Class(function MainMenu(){

		this.onData(MENU_DATA);
		this.onLinkClick.subscribe(function(a){

			_.debug.log('booya');

		});




	});




	MainMenu.prototype.onData = _.Event;
	MainMenu.prototype.onLinkClick = _.Event;

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