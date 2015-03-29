_.Module({

required:['modules/splice.controls.js',
          '../examples/ControlsAndBindings/controlsandbindings.htmlt'],	
	
definition:function(){
	var LocalScope = this;
	
	var ControlsAndBindings = _.Namespace('UserApplications').Class(function ControlsAndBindings(){

		this.orderData = [
		   ['345341', 'Basketball', 40.99],
		   ['987633', 'Kayak', 		2340.99],
		   ['2341', 'Hiking Pole', 40.99]
		];
		
		
		this.updateOrders();
		
		_.Doc.display(this);
	});
	
	
	ControlsAndBindings.prototype.onNewRecord = function(){
		_.info.log('Creating new record');
		
		this.ref.deleteButton.disable();
		this.ref.cancelButton.enable();
		
		this.orderData.push(['2344','Test test', 3432]);
		
		this.updateOrders();
	};
	
	ControlsAndBindings.prototype.onDeleteRecord = function(args){
		_.info.log('Deleting record...');
	};
	
	ControlsAndBindings.prototype.onCancel = function(){
		_.info.log('Cancel record edit...');
		this.ref.cancelButton.disable();
		this.ref.deleteButton.enable();
	};
	
	ControlsAndBindings.prototype.updateOrders = function(){
		this.onOrderData(this.orderData);
	}
	
	ControlsAndBindings.prototype.onOrderData = function(data){
		_.info.log('Unassigned onOrderData function');
	};
	
	
	var OrderRow = LocalScope.OrderRow = _.Class(function OrderRow(args){
		
		var db = this.ref.deleteButton;
		_.debug.log(db);
		
	});
	
	OrderRow.prototype.onDeleteClick = function(){
		this.onDelete(this);
	};
	
	OrderRow.prototype.setDataItem = function(dataItem){
		var textNodes = _.Doc.selectTextNodes(this.concrete.dom);
	
		for(var i=0; i<textNodes.length; i++){
			var value = textNodes[i].nodeValue;
			if(!value) continue;
			if(!value.startsWith('@')) continue;
			
			var key = value.substring(1,value.length);
			var data = dataItem[key];
			
			if(data){
				var text = document.createTextNode(data);
				textNodes[i].parentNode.replaceChild(text, textNodes[i]);
			}
			
		}
	
	};
	
	
	
}});