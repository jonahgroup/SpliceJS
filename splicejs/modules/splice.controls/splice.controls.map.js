sjs({


required:[
	{'SpliceJS.UI':'../splice.ui.js'},
	'{sjshome}/lib/leaflet-0.7.3/leaflet.css',
	'{sjshome}/lib/leaflet-0.7.3/leaflet-src.js',
	'splice.controls.map.css',
	'splice.controls.map.html',
],

definition:function(){
	var scope = this.scope
	, 	Class = this.Class;
	
	var	UIControl = scope.SpliceJS.UI.UIControl;
	
	var Map = Class.extend(UIControl)(function MapController(){
		this.super();
		this.onDisplay.subscribe(this.display,this);
	});


	Map.prototype.display = function(){
		if(!this.elements.root.parentNode) return; 
		if(this.isInitialized) return;

		var mapID = 'drogozhkin.kgb6lfoc';
		var mapContainerId = 'map'+Math.round(1000*Math.random());
		

		this.elements.root.id = mapContainerId;
		
		/*WTF why are we still using ids?*/
		var map = L.map(this.elements.root,{ trackResize:true}).setView([43.654, -79.387], 16);
		L.tileLayer('http://{s}.tiles.mapbox.com/v3/'+mapID+'/{z}/{x}/{y}.png', {
		    attribution:' ',
		    //attribution: 'Imagery © <a href="http://mapbox.com">Mapbox</a>',
		    maxZoom: 18
		}).addTo(map);

		this.isInitialized = true;

	};

	//any class exports go here
	return {};

}
});