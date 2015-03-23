_.Module({

required:['modules/splice.controls.js',
          '../examples/ControlsAndBindings/controlsandbindings.htmlt'],	
	
definition:function(){
	
	var ControlsAndBindings = _.Namespace('UserApplications').Class(function ControlsAndBindings(){

		this.orderData = [
		   ['345341', 'Basketball', 40.99],
		   ['987633', 'Kayak', 		2340.99]
		];
		
		
		this.updateOrders();
		
		_.Doc.display(this);
	});
	
	
	ControlsAndBindings.prototype.onNewRecord = function(){
		_.info.log('Creating new record');
		
		this.orderData.push(['2344','Test test', 3432]);
		
		this.updateOrders();
	};
	
	ControlsAndBindings.prototype.onDeleteRecord = function(){
		_.info.log('Deleting record...');
	};
	
	ControlsAndBindings.prototype.onCancel = function(){
		_.info.log('Deleting record...');
	};
	
	ControlsAndBindings.prototype.updateOrders = function(){
		this.onOrderData(this.orderData);
	}
	
	ControlsAndBindings.prototype.onOrderData = function(data){
		_.info.log('Unassigned onOrderData function');
	};
	
}});