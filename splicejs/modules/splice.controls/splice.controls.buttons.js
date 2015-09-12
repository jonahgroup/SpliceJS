/* global _ */
sjs({
required:[
	{'SpliceJS.UI':'../splice.ui.js'},
	'splice.controls.buttons.css',
	'splice.controls.buttons.html'
]
,
definition:function(){

	var scope = this.scope
	, 	Class = this.sjs.Class
	,	Event = this.sjs.Event
	,	debug = this.sjs.debug;
	
	var	UIControl = scope.SpliceJS.UI.UIControl;

	var Button = Class.extend(UIControl)(function ButtonController(args){
		
		this.super(arguments);
			
		var self = this;
		this.elements.root.onclick = function(){
			if(self.isDisabled == true) return;
			self.onClick(self.dataItem);

		};
		
		if(this.isDisabled) this.disable();
		
	});

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
	var CheckBox = Class.extend(UIControl)(function CheckBoxController(args){
		this.super(arguments);

		var self = this;
		
		this.concrete.dom.onclick = function(){
			debug.log('I am check box');
			var isChecked = self.concrete.dom.checked; 
			if(self.dataItem) {
				self.dataItem[self.dataPath] = isChecked;
			}
			
			if(self.dataOut) 	self.dataOut(self.dataItem);
			if(self.onCheck)	self.onCheck(isChecked);
		};
	});

	
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
	var RadioButton = Class.extend(UIControl)(function RadioButtonController(args){
		this.super(arguments);
	
		var self = this;
		this.elements.root.onclick = function(){

			if(self.elements.root.checked) {
				if(self.dataPath)
				self.dataItem[self.dataPath] = true
			} else {
				if(self.dataPath)
				self.dataItem[self.dataPath] = false;
			}
			self.dataOut(self.dataItem);
		}
	
	});
	
	
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
	
	
	var TextField = Class.extend(UIControl)(function TextFieldController(){
		this.super(arguments);

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

	});
	
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
	
	TextField.prototype.focus = function(){
		this.elements.root.focus();	
	};


	//returning exports

}


});