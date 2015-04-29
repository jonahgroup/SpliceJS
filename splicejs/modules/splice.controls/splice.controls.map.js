_.Module({


required:[
	_.home('lib/leaflet-0.7.3/leaflet.css'),
	_.home('lib/leaflet-0.7.3/leaflet-src.js'),
	'splice.controls.map.css',
	'splice.controls.map.htmlt',
],

definition:function(){

	var Map = _.Namespace('SpliceJS.Controls').Class(
		function Map(){
		}
	);


	Map.prototype.onDisplay = function(){
		var mapID = 'drogozhkin.kgb6lfoc';
		var mapContainerId = 'map'+Math.round(1000*Math.random());
		

		this.elements.controlContainer.id = mapContainerId;
		
		/*WTF why are we still using ids?*/
		var map = L.map(mapContainerId,{ trackResize:true}).setView([43.654, -79.387], 16);
		L.tileLayer('http://{s}.tiles.mapbox.com/v3/'+mapID+'/{z}/{x}/{y}.png', {
		    attribution:' ',
		    //attribution: 'Imagery © <a href="http://mapbox.com">Mapbox</a>',
		    maxZoom: 18
		}).addTo(map);

	};


}
});