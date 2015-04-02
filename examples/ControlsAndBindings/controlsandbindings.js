_.Module({

required:['modules/splice.controls.js',
          '../examples/ControlsAndBindings/controlsandbindings.css',
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
	
	
	ControlsAndBindings.prototype.onAddRecord = function(){
		_.info.log('Creating new record');
		
		this.ref.deleteButton.disable();
		this.ref.editButton.disable();
		this.ref.addButton.disable();
		this.ref.cancelButton.enable();
		
		
		
		this.actuateEditPanel().open();
		
		this.isAddMode = true;
		
		//this.orderData.push(['2344','Test test', 3432]);
		
		//this.updateOrders();
		var newRecordTemplate = [['SKU'],['Name'],['Price']];
		this.onNewRecordData({data:newRecordTemplate});
	};
	
	
	ControlsAndBindings.prototype.onToggleDelete 	= new _.Multicaster();
	ControlsAndBindings.prototype.onToggleEdit 		= new _.Multicaster();
	
	
	ControlsAndBindings.prototype.onDelete = function(args){
		this.ref.cancelButton.enable();
		
		this.ref.deleteButton.disable();
		this.ref.addButton.disable();
		this.ref.editButton.disable();
		
		this.isDeleteMode = true;
		
		this.onToggleDelete({isHidden:!this.isDeleteMode});
		
	};
	
	ControlsAndBindings.prototype.onDeleteRecord = function(args){
		var dataItem = args.dataItem;
		_.info.log('Deleting record...');
	};
	
	ControlsAndBindings.prototype.onCancel = function(){
		_.info.log('Cancel button pressed');
		
		// Reset buttons
		this.ref.cancelButton.disable();
		this.ref.deleteButton.enable();
		this.ref.addButton.enable();
		this.ref.editButton.enable();
		
		// Cancel edit mode
		if(this.isEditMode) {
			this.isEditMode = false;
			this.onToggleEdit({isHidden:!this.isEditMode});
			this.actuateEditPanel().close();
			return;
		}
		
		// Cancel delete mode
		if(this.isDeleteMode) {
			this.isDeleteMode = false;
			this.onToggleDelete({isHidden:!this.isDeleteMode});
			return;
		}
		
		//Cancel add mode
		if(this.isAddMode) {
			this.isAddMode = false;
			this.actuateEditPanel().close();
		}
		
		
	};
	
	ControlsAndBindings.prototype.updateOrders = function(){
		this.onOrderData({data:this.orderData});
	}
	
	ControlsAndBindings.prototype.onOrderData = function(data){
		_.info.log('Unassigned onOrderData function');
	};
	
	ControlsAndBindings.prototype.onNewRecordData = function(data){
		
	}
	
	ControlsAndBindings.prototype.onNewRecordValue = function(dataItem){
		_.debug.log('Data item change ' + dataItem);
	}
	
	ControlsAndBindings.prototype.onEdit = function(){
		
		this.isEditMode = true;
		
		this.ref.cancelButton.enable();
		
		this.ref.deleteButton.disable();
		this.ref.addButton.disable();
		this.ref.editButton.disable();
		
		
		this.actuateEditPanel().open();
		
	};

	
	ControlsAndBindings.prototype.actuateEditPanel = function(){
		
		var objStyle = this.elements.editPanel.style;
		var objDataStyle = this.elements.dataPanel.style;

		
		var actuate = function(from, to){
			
			new _.StoryBoard([
			new _.Animation(from,  to, 800, _.Animation.qubicEaseInOut, 
			    function(value){
			    	objStyle.width = value+'px';
			    	objDataStyle.left = value + 'px';
			},
			    function(){}	
			)]).animate();
			
		}
		
		return {
			open:function(){ actuate(0,250);},
			close:function(){ actuate(250,0);}
		}
		
	};
	
	
	
	
	var SimpleCheckBox = LocalScope.SimpleCheckBox = _.Class(function SimpleCheckBox(args){
		
		var self = this;
		this.concrete.dom.onclick = function(){
			_.debug.log('I am check box');
			self.onCheck();
		};
	});
	
	
	var OrderRow = LocalScope.OrderRow = _.Class(function OrderRow(args){
		
		var db = this.ref.deleteButton;
		_.debug.log(db);
		
	});
	
	OrderRow.prototype.selectRow = function(){
		_.debug.log('select row');
	};
	
	OrderRow.prototype.onDeleteClick = function(){
		this.onDelete(this.dataItem);
	};
	
	OrderRow.prototype.setDataItem = function(dataItem){
		
		var textNodes = _.Doc.selectTextNodes(this.concrete.dom);
		this.dataItem = dataItem;
		
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
		
		this.onDataItem(this.dataItem);
	
	};
	
	OrderRow.prototype.onDataItem = new _.Multicaster();
	
	
}});