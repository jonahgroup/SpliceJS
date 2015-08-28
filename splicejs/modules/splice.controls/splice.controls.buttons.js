/* global _ */
sjs({
required:[
	{'SpliceJS.UI':'../splice.ui.js'},
	'splice.controls.buttons.css',
	'splice.controls.buttons.html'
]
,
definition:function(){

	var Class = this.framework.Class
	, 	Component = this.framework.Component
	,	Event = this.framework.Event
	,	UIControl = this.SpliceJS.UI.UIControl;
	
	
		
	
	var Button = Component('Button')(function Button(args){
		
		UIControl.apply(this,arguments);
			
		var self = this;
		this.elements.root.onclick = function(){
			if(self.isDisabled == true) return;
			self.onClick(self.dataItem);

		};
		
		if(this.isDisabled) this.disable();
		
	}).extend(UIControl);

	Button.prototype.onClick = Event;

	Button.prototype.handleContent = function(content){
		if(!content) return;
		
		if(content['label']){
			this.elements.root.value = content['label']; 
		} else {
			this.elements.root.value = 'button';
		}
	};

	Button.prototype.setLabel = function(label){
		this.elements.root.value = label;
	};
	
	Button.prototype.enable = function(){
		this.elements.root.className = '-splicejs-button';
		this.isDisabled = false;
		this.onDomChanged();
	};
	
	Button.prototype.disable = function(){
		this.elements.root.className = '-splicejs-button-disabled';
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

			if(self.elements.root.checked) {
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
			this.elements.root.checked = false;
			return;
		}

		if(this.dataItem[this.dataPath] === true) {
			this.elements.root.checked = true;
		}
		else {
			this.elements.root.checked = false;	
		}
	};
	
	
	var TextField = Component('TextField')(function TextField(){
		UIControl.apply(this,arguments);

		var self = this;
		
		var f = function(args){
			if(this.dataPath) {
				this.dataItem[self.dataPath] = args.source.value;
			}
			else {
				this.dataItem = {value:args.source.value};
			}
			
			this.onData(this.dataItem);
		};
		
		this.onKeyUp  = Event.attach(this.elements.root,'onkeyup');
		this.onChange = Event.attach(this.elements.root,'onchange');
		
		if(this.isRealTime){
			this.onKeyUp.subscribe(f, this);
		}
		else { 
			this.onChange.subscribe(f, this);
		}

	}).extend(UIControl);
	
	TextField.prototype.onData = Event;
		
	TextField.prototype.dataIn = function(dataItem){
		UIControl.prototype.dataIn.call(this,dataItem);
		var value = null;
		if(this.dataPath) value = this.dataItem[this.dataPath];
		else value = dataItem;
		
		if(value!=null && value != undefined) 
			this.elements.root.value = value;
	};
	
	TextField.prototype.clear = function(){
		this.elements.root.value = '';
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