_.Module({

required:[_.home('modules/splice.controls.js'),
		  '../BasicApplication/basicapplication.js',
		  '../ScrollPanel/scrollpanelapplication.js',
		  'controlsandbindings.css',
          'controlsandbindings.htmlt'],	
	
definition:function(){
	var LocalScope = this;
	
	var ControlsAndBindings = _.Namespace('UserApplications').Class(function ControlsAndBindings(){

		var self = this;
		_.HttpRequest.get({
			url:SPLICE_PUBLIC_ROOT + '/../examples/ControlsAndBindings/data/dataApr-2-2015.json',
			onok:function(data){
				eval('var sampleData = ' + data.text);
			
				self.sourceData = sampleData.data; 
				self.dataColumns = sampleData.cols;

				
				self.sourceData.forEach(function(item){
					item.push(Math.random()*100);
				});
				self.dataColumns.push('Temperature');

				self.orderData = self.sourceData;
				
				self.updateOrders();
			}
		});
		

		this.columnPaths = [0,1,2,3,4,5,6,7,8];

		_.Doc.display(this);
		
	});
	
	

	ControlsAndBindings.prototype.onSearchValue = function(dataItem){
		_.debug.log('Searching for: ' + dataItem.value);
		
		this.currentSearchValue = dataItem.value;
		this.updateOrders();
		this.ref.searchClearButton.show();
	};

	ControlsAndBindings.prototype.clearSearch = function(){
		this.currentSearchValue = null;
		this.ref.searchTextField.clear();
		this.updateOrders();
		this.ref.searchClearButton.hide();
	};

	ControlsAndBindings.prototype.getHighlightValue = function(){
		return this.currentSearchValue;
	};



	ControlsAndBindings.prototype.onAddRecord = function(){
		_.info.log('Creating new record');
		
		/* reconfigure buttons */
		this.ref.deleteButton.disable();
		this.ref.editButton.disable();
		
		this.ref.cancelButton.show();
		this.ref.cancelButton.enable();

		this.ref.addButton.setLabel('Save');
		this.ref.addButton.onClick = this.onSaveNewRecord.bind(this);
		
		


		this.actuateEditPanel().open((function(){
			this.isAddMode = true;
		
			this.newRecord = [];
			for(var i=0; i < this.dataColumns.length; i++){
				this.newRecord.push({field:this.dataColumns[i], value:''});
			}
			this.onEditRecordData({data:this.newRecord});
		
		}).bind(this));
		
		
		this.elements.editSectionLabel.innerHTML = 'Create New Record';

	};
	
	
	ControlsAndBindings.prototype.onToggleDelete 	= new _.Multicaster();
	ControlsAndBindings.prototype.onClearDelete 	= new _.Multicaster();
	ControlsAndBindings.prototype.onToggleEdit 		= new _.Multicaster();
	ControlsAndBindings.prototype.resetEditForm 	= new _.Multicaster();
	ControlsAndBindings.prototype.onOrderData 		= new _.Multicaster();
	
	
	
	ControlsAndBindings.prototype.onDelete = function(args){
		
		this.ref.cancelButton.enable();
		this.ref.cancelButton.show();
		
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
		
		this.sourceData.splice(0,0,r);
		
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

		this.ref.cancelButton.hide();
		
		// Cancel edit mode
		if(this.isEditMode) {
			this.isEditMode = false;
			this.onToggleEdit({isHidden:!this.isEditMode});
			this.actuateEditPanel({isEdit:true}).close();
			
			this.ref.editButton.setLabel('Edit');
			this.ref.editButton.onClick = this.onEdit.bind(this);

			this.resetEditForm();
			
			if(this.currentEditItem) {
				this.currentEditItem['_edit_flag'] = false;
				this.currentEditItem = null;
			}
			this.updateOrders();
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
			return;
		}
		
		
		
	};
	
	ControlsAndBindings.prototype.updateOrders = function(){
		/*
			Apply search filters
		*/
		if(this.currentSearchValue){
			this.orderData = [];
			for(var i=0; i<this.sourceData.length; i++){
				for(var j=0; j< this.sourceData[i].length; j++){
					var v = this.sourceData[i][j]; 
					if(!v) continue;	
					if((v+'').indexOf(this.currentSearchValue) > -1) { 
						this.orderData.push(this.sourceData[i]);
						break;
					}
				}
			}
		} else {
			this.orderData = this.sourceData;
		}

		this.onOrderData({data:this.orderData, headers:this.dataColumns});
	}
	
	
			
	
	
	ControlsAndBindings.prototype.onEditItemSelected = function(dataItem){
		if(!dataItem) return;
		this.editRecord = [];
		
		if(this.currentEditItem === dataItem) return;

		if(this.currentEditItem) {
			this.currentEditItem['_edit_flag'] = false;
		}

		this.currentEditItem = dataItem;
		
		for(var i=0; i < this.dataColumns.length; i++){
			this.editRecord.push({field:this.dataColumns[i], value:dataItem[i]});
		}
		
		this.updateOrders();
		this.onEditRecordData({data:this.editRecord});
	}
	
	
	ControlsAndBindings.prototype.onEdit = function(){
		
		this.isEditMode = true;
		
		this.ref.cancelButton.show();
		this.ref.cancelButton.enable();
		
		this.ref.deleteButton.disable();
		this.ref.addButton.disable();
		
		this.ref.editButton.setLabel('Save');
		this.ref.editButton.onClick = this.onSaveEditRecord.bind(this);

		this.elements.editSectionLabel.innerHTML = 'Edit Record';
		
		this.actuateEditPanel({isEdit:true}).open();
	};

	
	ControlsAndBindings.prototype.actuateEditPanel = function(args){
		
		var objStyle = this.elements.editPanel.style;
		var objDataStyle = this.elements.dataPanel.style;

		var self = this;
		
		var actuate = function(from, to, oncomplete){
			
			new _.StoryBoard([
			new _.Animation(from,  to, 800, _.Animation.cubicEaseInOut, 
			    function(value){
			    	objStyle.width = value+'px';
			    	objDataStyle.left = value + 'px';
			    	self.ref.ordersTable.reflow();
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
				if(typeof oncomplete === 'function') oncomplete(); 
			}),
			new _.Animation(to+25,from+25,600, _.Animation.easeOut, function(value){
				self.elements.editInstructionsLabel.style.left = (value + 'px');
				self.elements.editSectionLabel.style.left = (value + 'px');
			})

			]).animate();
			
		}
		
		return {
			open:function(oncomplete){ actuate(0,300, oncomplete);},
			close:function(oncomplete){ actuate(300,0, oncomplete);}
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
	


	var DataRowBuilder = _.Class(function DataRowBuilder(){
		
		this.concrete = new SpliceJS.Modular.Concrete(document.createElement('span'));
 		this.concrete.export = function(){ 
 			return this.dom.childNodes;
 		}
		
		for(var i=0; i<this.columnPath.length; i++) {
			var div = document.createElement('div');
			div.innerHTML = '@'+this.columnPath[i];
			this.concrete.dom.appendChild(div);
		}
	});

	LocalScope.DataRowBuilder = this.createComponent(DataRowBuilder,null);
	
}});