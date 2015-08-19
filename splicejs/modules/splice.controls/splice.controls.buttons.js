_.Module({
required:[
	{'SpliceJS.UI':'../splice.ui.js'},
	'splice.controls.buttons.css',
	'splice.controls.buttons.html'
]
,
definition:function(){

	var Class = this.framework.Class;
	var Component = this.framework.Component;
	var UIControl = this.SpliceJS.UI.UIControl;
	
	
		
	
	var Button = Component('Button')(function Button(args){
		
		UIControl.apply(this,arguments);
			
		var self = this;
		this.elements.controlContainer.onclick = function(){
			if(self.isDisabled == true) return;
			self.onClick(self.dataItem);

		};
		
		if(this.isDisabled) this.disable();
		
	}).extend(UIControl);

	Button.prototype.onClick = _.Event;

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
	
	Button.prototype.enable = function(){
		this.elements.controlContainer.className = '-splicejs-button';
		this.isDisabled = false;
		this.onDomChanged();
	};
	
	Button.prototype.disable = function(){
		this.elements.controlContainer.className = '-splicejs-button-disabled';
		this.isDisabled = true;
		this.onDomChanged();
	}



	/**
	 * 
	 * Check box
	 * */
	var CheckBox = Component('CheckBox')(function CheckBox(args){
		UIControl.apply(this,arguments);

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
	
	}).extend(UIControl);

	
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
	var RadioButton = Component('RadioButton')(function RadioButton(args){
		UIControl.apply(this,arguments);
	
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
	
	}).extend(UIControl);
	
	
	RadioButton.prototype.dataIn = function(dataItem){
		UIControl.prototype.dataIn.call(this,dataItem);

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
	
	
	var TextField = Component('TextField')(function TextField(){
		UIControl.apply(this,arguments);

		var self = this;
		
		var f = function(){
			if(self.dataPath) {
				self.dataItem[self.dataPath] = this.value;
			}
			else {
				self.dataItem = {value:this.value};
			}
			self.onData(self.dataItem);
		};

		if(this.isRealTime){
			this.elements.controlContainer.onkeyup = f;
		}
		else { 
			this.elements.controlContainer.onchange = f;
		}

	}).extend(UIControl);
	
	TextField.prototype.onData = Event;
		
	TextField.prototype.dataIn = function(dataItem){
		UIControl.prototype.dataIn.call(this,dataItem);
		var value = this.dataItem[this.dataPath];
		
		if(value) this.elements.controlContainer.value = value;
	};
	
	TextField.prototype.clear = function(){
		this.elements.controlContainer.value = '';
	};


	//returning exports
	return {
		Button:	Button,
		CheckBox: CheckBox,
		RadioButton: RadioButton,
		TextField: 	TextField	
	}

}


});