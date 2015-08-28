sjs({

required:[
	'examples.html',
	'examples.css'

],

definition:function(){

	var Controller = this.framework.Controller
	,	Component = this.framework.Component
	,	Event = this.framework.Event;
	
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


	MainMenu.prototype.onData = Event;
	MainMenu.prototype.onLinkClick = Event;

	MainMenu.prototype.onOpenPanel 	= Event;
	MainMenu.prototype.onClosePanel = Event;

	return {
		
		MainMenu:MainMenu
		
	}

}


});
