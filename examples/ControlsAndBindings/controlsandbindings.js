_.Module({

required:['modules/splice.controls.js',
          '../examples/ControlsAndBindings/controlsandbindings.css',
          '../examples/ControlsAndBindings/controlsandbindings.htmlt'],	
	
definition:function(){
	var LocalScope = this;
	
	var ControlsAndBindings = _.Namespace('UserApplications').Class(function ControlsAndBindings(){

		var self = this;
		_.HttpRequest.post({
			url:SPLICE_PUBLIC_ROOT + '/../examples/ControlsAndBindings/data/dataApr-2-2015.json',
			onok:function(data){
				eval('var sampleData = ' + data.text);
			
				self.orderData = sampleData.data;
				self.dataColumns = sampleData.cols;
				
				self.updateOrders();
			}
		});
		
		
		_.Doc.display(this);
	});
	
	
	ControlsAndBindings.prototype.onAddRecord = function(){
		_.info.log('Creating new record');
		
		/* reconfigure buttons */
		this.ref.deleteButton.disable();
		this.ref.editButton.disable();
		this.ref.cancelButton.enable();
		this.ref.addButton.setLabel('Save');
		this.ref.addButton.onClick = this.onSaveNewRecord.bind(this);
		
		
		this.actuateEditPanel().open();
		this.isAddMode = true;
		
		this.newRecord = [];
		for(var i=0; i < this.dataColumns.length; i++){
			this.newRecord.push({field:this.dataColumns[i], value:''});
		}
		
		this.onEditRecordData({data:this.newRecord});
	};
	
	
	ControlsAndBindings.prototype.onToggleDelete 	= new _.Multicaster();
	ControlsAndBindings.prototype.onClearDelete 	= new _.Multicaster();
	ControlsAndBindings.prototype.onToggleEdit 		= new _.Multicaster();
	ControlsAndBindings.prototype.resetEditForm 	= new _.Multicaster();
	
	
	ControlsAndBindings.prototype.onDelete = function(args){
		this.ref.cancelButton.enable();
		
		this.ref.addButton.disable();
		this.ref.editButton.disable();
		
		this.ref.deleteButton.onClick = this.onDeleteRecords.bind(this);
		
		this.isDeleteMode = true;
		
		var self = this;
		
		this.activateHeader({isExpanded:true, oncomplete:function(){
			self.onToggleDelete({isHidden:false});
		}});
		
		
	};
	
	
	ControlsAndBindings.prototype.onDeleteRecords = function(args){
		_.debug.log('Deleting Records');
		for(var i=this.orderData.length-1; i >= 0; i--){
			if(!this.orderData[i]['_del_flag']) continue;
			
			_.debug.log('Deleting record: ' + i);
			this.orderData.splice(i,1);
		}
		this.updateOrders();
	};
	
	ControlsAndBindings.prototype.onSaveNewRecord = function(args){
		
		var r = []; 
		for(var i=0; i<this.dataColumns.length-1; i++){
			r.push(this.newRecord[i].value);
		}
		
		this.orderData.splice(0,0,r);
		
		this.updateOrders();
	};
	
	
	
	ControlsAndBindings.prototype.onSaveEditRecord = function(args){
		
		for(var i =0; i<this.editRecord.length; i++){
			this.currentEditItem[i] = this.editRecord[i].value;
		}
		
		
		this.updateOrders();
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
			this.actuateEditPanel({isEdit:true}).close();
			
			this.ref.editButton.setLabel('Edit');
			this.ref.editButton.onClick = this.onEdit.bind(this);

			this.resetEditForm();
			
			return;
		}
		
		// Cancel delete mode
		if(this.isDeleteMode) {
			this.isDeleteMode = false;
			this.onToggleDelete({isHidden:!this.isDeleteMode});
			
			this.ref.deleteButton.onClick = this.onDelete.bind(this);
			this.activateHeader({isExpanded:false});
			return;
		}
		
		//Cancel add mode
		if(this.isAddMode) {
			this.isAddMode = false;
			this.actuateEditPanel().close();
		
			this.ref.addButton.setLabel('Add');
			this.ref.addButton.onClick = this.onAddRecord.bind(this);
			
			this.resetEditForm();
		
		}
		
		
	};
	
	ControlsAndBindings.prototype.updateOrders = function(){
		this.onOrderData({data:this.orderData, headers:this.dataColumns});
	}
	
	ControlsAndBindings.prototype.onOrderData = function(data){
		_.info.log('Unassigned onOrderData function');
	};
	
			
	
	
	ControlsAndBindings.prototype.onEditItemSelected = function(dataItem){
		if(!dataItem) return;
		this.editRecord = [];
		this.currentEditItem = dataItem;
		
		for(var i=0; i < this.dataColumns.length; i++){
			this.editRecord.push({field:this.dataColumns[i], value:dataItem[i]});
		}
		
		this.onEditRecordData({data:this.editRecord});
	}
	
	
	ControlsAndBindings.prototype.onEdit = function(){
		
		this.isEditMode = true;
		
		this.ref.cancelButton.enable();
		
		this.ref.deleteButton.disable();
		this.ref.addButton.disable();
		
		this.ref.editButton.setLabel('Save');
		this.ref.editButton.onClick = this.onSaveEditRecord.bind(this);

		
		
		this.actuateEditPanel({isEdit:true}).open();
	};

	
	ControlsAndBindings.prototype.actuateEditPanel = function(args){
		
		var objStyle = this.elements.editPanel.style;
		var objDataStyle = this.elements.dataPanel.style;

		var self = this;
		
		var actuate = function(from, to){
			
			new _.StoryBoard([
			new _.Animation(from,  to, 800, _.Animation.qubicEaseInOut, 
			    function(value){
			    	objStyle.width = value+'px';
			    	objDataStyle.left = value + 'px';
			},
			function(){
				if(args && args.isEdit){
					if(from < to) self.activateHeader({
						isExpanded:true,
						oncomplete:function(){self.onToggleEdit({isHidden:false})}
					});
					if(from > to) self.activateHeader({
						isExpanded:false,
						oncomplete:function(){self.onToggleEdit({isHidden:true})}
					});
					
					
					
				}
			}	
			)]).animate();
			
		}
		
		return {
			open:function(){ actuate(0,250);},
			close:function(){ actuate(250,0);}
		}
		
	};
	
	
	
	
	var FancyHeaderRow = LocalScope.FancyHeaderRow = _.Class(function FancyHeaderRow(){
		SpliceJS.Controls.DataTableRow.call(this);
	}).extend(SpliceJS.Controls.DataTableRow);
	
	
	FancyHeaderRow.prototype.activate = function(args){
		_.debug.log('Activating header');
		
		if(args.isExpanded){
			_.Animate(this.elements.controlColumn).width(0,18,600,args.oncomplete);
		} else {
			_.Animate(this.elements.controlColumn).width(18,0,600,args.oncomplete);
		}
	};
	

	
}});