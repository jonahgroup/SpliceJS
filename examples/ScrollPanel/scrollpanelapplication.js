_.Module({
	
required:[
	'modules/splice.controls.js',
	'../examples/BasicApplication/basicapplication.js',
	'../examples/ScrollPanel/scrollpanelapplications.css',
	'../examples/ScrollPanel/scrollpanelapplication.htmlt'
],

definition:function(){
	

	var ScrollPanelApplication = _.Namespace('UserApplications').Class(
		function ScrollPanelApplication(){

			
	});


	ScrollPanelApplication.prototype.onDisplay = function(){
			this.ref.scrollPanel.reflow();
	};




	var ImageLoader = this.ImageLoader = _.Class(function ImageLoader(){
		var self = this;
		this.elements.sourceImage.onload = function(){
			_.debug.log('Image loaded');
			self.onImageLoaded();
		};
	});



}});