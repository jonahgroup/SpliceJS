_.Module({
	
required:['modules/splice.controls/splice.controls.css',
          'modules/splice.controls/splice.controls.htmlt'],	
	
definition:function(){
	
	
	var Button = _.Namespace('SpliceJS.Controls').Class(function Button(args){
		_.info.log('Creating Button');
		
		if(this.content && this.content['label']){
			this.elements.buttonContainer.value = args.content['label']; 
		} else {
			this.elements.buttonContainer.value = 'button';
		}
		
		var self = this;
		this.elements.buttonContainer.onclick = function(){
			if(self.isDisabled == true) return;
			self.onClick();
		};
		
		if(this.isDisabled) this.disable();
		if(this.isHidden) 	this.hide();
		
	});

	
	Button.prototype.onClick = function(){
		_.debug.log('Event is not assigned');
	};
	
	
	Button.prototype.changeState = function(args){
		_.debug.log('Chaning button\'s state');
		if(args && args.isHidden)
			this.hide();
		else 
			this.show();
	};
	
	
	Button.prototype.hide = function(){
		var self = this;
		if(this.animate){
			_.Animate(this.elements.buttonContainer).opacity(100, 0, 300,function(){
				self.elements.buttonContainer.style.display = 'none';
			});
		}
		else {
			this.elements.buttonContainer.style.display = 'none';
		}
	}
	
	Button.prototype.show = function(){
		if(this.animate) {
			this.elements.buttonContainer.style.opacity = 0;
		}
		this.elements.buttonContainer.style.display = 'block';
		
		if(this.animate) {
			_.Animate(this.elements.buttonContainer).opacity(0, 100, 300);
		}
	}
	
	Button.prototype.enable = function(){
		this.elements.buttonContainer.className = '-splicejs-button';
		this.isDisabled = false;
	};
	
	Button.prototype.disable = function(){
		this.elements.buttonContainer.className = '-splicejs-button-disabled';
		this.isDisabled = true;
	}
	
	
	
	var TextField = _.Namespace('SpliceJS.Controls').Class(function TextField(){
		var self = this;
		this.elements.textFieldContainer.onchange = function(){
			self.onValueChanged({value:this.value});
		}
	});
	
	TextField.prototype.onValueChanged = function(){}
	
	TextField.prototype.onDataItem = function(dataItem){
		_.debug.log('TextField on Data item ' + dataItem);
	};
	
	
	var DataTable = _.Namespace('SpliceJS.Controls').Class(function DataTable(args){
		/* call parent constructor */
		SpliceJS.Controls.UIControl.call(this,args);
		
		_.info.log('Constructing date table');
		this.dom = this.elements.dataTableContainer;
	
	}).extend(SpliceJS.Controls.UIControl);
	
	

	
	DataTable.prototype.onData = function(data){
		
		var data = data.data;
		
		/*process array of things */
		_.info.log('onData Called ');
	
		if(!(data instanceof Array)) return;
		for(var i=0; i<data.length; i++){
			var r = data[i];
			
			/* insert templated row */
			if(this.itemTemplate) {
				var dataRow = new this.itemTemplate({parent:this});
				dataRow.setDataItem(r);
				if(! (dataRow.concrete instanceof SpliceJS.Modular.Concrete)) throw 'DataTable: rowTemplate type is invalid must be concrete';
				this.addDomRow(dataRow.concrete.dom);
				continue;
			}
			this.addRow(r);
			
		}
		
	};
	
	DataTable.prototype.clear = function(){
		
	};
	
	DataTable.prototype.addHeader = function(headers){
		
		if(!headers) return;
		if(this.dom.tHead) this.dom.deleteTHead();
		
		var headRow = this.dom.createTHead().insertRow();
		for(var i=0; i<headers.length; i++){
			headRow.insertCell().innerHTML = headers[i];
		}
	};
	
	DataTable.prototype.addRow = function(row){
		
		if(!row) return;
		if(!(row instanceof Array)) throw 'Argument must be of type Array';
		
		var tBody = this.dom.tBodies[0]; 
		if(!tBody) tBody = this.dom.createTBody();
		
		var newrow =  tBody.insertRow();
		
		for(var i=0; i < row.length; i++ ){
			
			var cell = newrow.insertCell();
			
			if(typeof(row[i]) == 'object')
				cell.appendChild(row[i]);
			else {
				cell.appendChild(document.createTextNode(row[i]));
			}
		}
	};

	DataTable.prototype.addDomRow = function(dom){
		var row = [];	
		for(var i=0; i< dom.childNodes.length; i++){
			row.push(dom.childNodes[i]);
		}
		this.addRow(row);
	};
	
	
}	
});