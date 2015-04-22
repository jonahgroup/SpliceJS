_.Module({

required:[	
			
	'modules/splice.ui.js',
	'modules/splice.controls/splice.controls.css',
  	'modules/splice.controls/splice.controls.htmlt',
	'modules/splice.controls/splice.controls.datatable.js',
	'modules/splice.controls/splice.controls.scrollpanel.js'
], 	
         	
definition:function(){
	
	
	
	var Button = _.Namespace('SpliceJS.Controls').Class(function Button(args){
		
		SpliceJS.Controls.UIControl.apply(this,arguments);
		
			
		var self = this;
		this.elements.controlContainer.onclick = function(){
			if(self.isDisabled == true) return;
			self.onClick(self.dataItem);

		};
		
		if(this.isDisabled) this.disable();
		
		
	}).extend(SpliceJS.Controls.UIControl);

	
	Button.prototype.handleContent = function(content){
		if(!content) return;
		
		if(content['label']){
			this.elements.controlContainer.value = content['label']; 
		} else {
			this.elements.controlContainer.value = 'button';
		}
	};

	Button.prototype.setLabel = function(label){
		this.elements.controlContainer.value = label;
	};
	
	Button.prototype.onClick = function(){
		_.debug.log('Event is not assigned');
	};
	
	Button.prototype.enable = function(){
		this.elements.controlContainer.className = '-splicejs-button';
		this.isDisabled = false;
	};
	
	Button.prototype.disable = function(){
		this.elements.controlContainer.className = '-splicejs-button-disabled';
		this.isDisabled = true;
	}
	
	
	
	var TextField = _.Namespace('SpliceJS.Controls').Class(function TextField(){
		SpliceJS.Controls.UIControl.apply(this,arguments);

		var self = this;
		this.elements.controlContainer.onchange = function(){
			if(self.dataPath) {
				self.dataItem[self.dataPath] = this.value;
			}
			else {
				self.dataItem = {value:this.value};
			}
			self.dataOut(self.dataItem);
		}
	});
	
	TextField.prototype.dataOut = function(){
		
	};
		
	TextField.prototype.dataIn = function(dataItem){
		SpliceJS.Controls.UIControl.prototype.dataIn.call(this,dataItem);
		var value = this.dataItem[this.dataPath];
		
		if(value) this.elements.controlContainer.value = value;
	};
	
	TextField.prototype.clear = function(){
		this.elements.controlContainer.value = '';
	};
	
	
	/**
	 * 
	 * Check box
	 * */
	var CheckBox = _.Namespace('SpliceJS.Controls').Class(function CheckBox(args){
		SpliceJS.Controls.UIControl.apply(this,arguments);

		var self = this;
		
		
		
		this.concrete.dom.onclick = function(){
			_.debug.log('I am check box');
			var isChecked = self.concrete.dom.checked; 
			if(self.dataItem) {
				self.dataItem[self.dataPath] = isChecked;
			}
			
			if(self.dataOut) 	self.dataOut(self.dataItem);
			if(self.onCheck)	self.onCheck(isChecked);
		};
	
	}).extend(SpliceJS.Controls.UIControl);

	
	CheckBox.prototype.dataIn = function(dataItem){
		this.dataItem = dataItem;
		if(this.dataItem && (this.dataItem[this.dataPath] === true)){
			this.concrete.dom.checked = true;
		}
		else this.concrete.dom.checked = false; 
	};
	
	CheckBox.prototype.clear = function(){
		this.concrete.dom.checked = false;
	};
	

	/**
	 * RadioButton
	 * */
	var RadioButton = _.Namespace('SpliceJS.Controls').Class(function RadioButton(args){
		SpliceJS.Controls.UIControl.apply(this,arguments);
	
		var self = this;
		this.elements.controlContainer.onclick = function(){

			if(self.elements.controlContainer.checked) {
				if(self.dataPath)
				self.dataItem[self.dataPath] = true
			} else {
				if(self.dataPath)
				self.dataItem[self.dataPath] = false;
			}
			self.dataOut(self.dataItem);
		}
	
	}).extend(SpliceJS.Controls.UIControl);
	
	
	RadioButton.prototype.dataIn = function(dataItem){
		SpliceJS.Controls.UIControl.prototype.dataIn.call(this,dataItem);

		if(!this.dataPath) {
			this.elements.controlContainer.checked = false;
			return;
		}

		if(this.dataItem[this.dataPath] === true) {
			this.elements.controlContainer.checked = true;
		}
		else {
			this.elements.controlContainer.checked = false;	
		}
	};


// end module definition		
}});