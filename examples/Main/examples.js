
function BasicApplication(){
	_.load(['BasicApplication/basicapplication.js'],function(){
		new UserApplications.BasicApplication().exitApplication = function(){
			_.Doc.display(new UserApplications.MainMenu());
		};
	});
}


function ControlsApplication(){
	_.load(['Controls/controlsdemoapplication.js'],function(){
		_.Doc.display(new UserApplications.ControlsDemoApplication());
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
