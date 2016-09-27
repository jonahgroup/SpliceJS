_.Module({
	
imports:[
	_.home('modules/splice.controls.js'),
	'../BasicApplication/basicapplication.js',
	'scrollpanelapplications.css',
	'scrollpanelapplication.html'
],

definition:function(){
	

	var ScrollPanelApplication = _.Namespace('UserApplications').Class(
		function ScrollPanelApplication(){

			
	});


	ScrollPanelApplication.prototype.onDisplay = function(){
			this.ref.scrollPanel.reflow();
	};



	/*
	* Image loader class 
	*/
	var ImageLoader = this.ImageLoader = _.Class(function ImageLoader(){
		var self = this;
		this.elements.sourceImage.onload = function(){
			_.debug.log('Image loaded');
			self.onImageLoaded();
		};
	});



}});