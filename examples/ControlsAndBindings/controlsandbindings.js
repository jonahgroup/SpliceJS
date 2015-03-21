_.Module({

required:['modules/splice.controls.js',
          '../examples/ControlsAndBindings/controlsandbindings.htmlt'],	
	
definition:function(){
	
	var ControlsAndBindings = _.Namespace('UserApplications').Class(function ControlsAndBindings(){

		this.orderData = [
		   ['345341', 'Basketball', 40.99],
		   ['987633', 'Kayak', 		2340.99]
		];
		
		
		this.onOrderData(this.orderData);
		
		_.Doc.display(this);
	});
	
	
	ControlsAndBindings.prototype.onOrderData = function(data){
		_.info.log('Unassigned onOrderData function');
		
	};
	
}});