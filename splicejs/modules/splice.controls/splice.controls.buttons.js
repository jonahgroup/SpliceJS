/* global _ */
sjs({
required:[
	{'SpliceJS.UI':'../splice.ui.js'},
	{'Doc': '{sjshome}/modules/splice.document.js'},
	'splice.controls.buttons.css',
	'splice.controls.buttons.html'
]
,
definition:function(sjs){

	var scope = this.scope
	, Class = this.sjs.Class
	,	event = sjs.event
	,	exports = sjs.exports
	,	debug = this.sjs.debug;

	var	UIControl = scope.SpliceJS.UI.UIControl;

	var Button = Class(function ButtonController(args){
		this.super(args);

		event(this).attach({
			onClick : event.multicast
		});

	}).extend(UIControl);


	Button.prototype.initialize = function(){

		event(this.views.root).attach({
			onclick	:	event.unicast
		});

		this.views.root.onclick.subscribe(function(){
			if(this.isDisabled == true) return;
			this.onClick(this.dataItem);
		},this);

		if(this.isDisabled) this.disable();
	};

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
	};

	Button.prototype.dataIn = function(dataItem){
		this.super(UIControl).dataIn(dataItem);
		this.views.root.content({label:dataItem.toString()}).replace();
	};

	/**
	 *
	 * Check box
	 * */
	var CheckBox = Class(function CheckBoxController(args){
		this.super(args);
		this.isChecked = false;

		event(this).attach({onChecked:event.multicast});

	}).extend(UIControl);

	CheckBox.prototype.initialize = function(){
		event(this.views.root).attach({
			onclick :	event.multicast
		}).onclick.subscribe(function(){

		var dataItem = this.dataItem;

		if(dataItem) {
				if(this.dataPath) {
					sjs.propvalue(dataItem)(this.dataPath).value = this.isChecked = !dataItem[this.dataPath];
				} else {
					dataItem['checked'] = this.isChecked = !dataItem['checked'];
				}
			} else {
				this.isChecked = !this.isChecked;
			}

			this.check(this.isChecked);
			this.onChecked(dataItem);

		},this);
	}

	CheckBox.prototype.dataIn = function(dataItem){
		this.dataItem = dataItem;

		if(this.dataPath) {
			this.isChecked = sjs.propvalue(this.dataItem)(this.dataPath).value;
		} else {
			this.isChecked = this.dataItem['checked'];
		}
		this.check(this.isChecked);

	};

	CheckBox.prototype.check = function(isChecked){
		this.isChecked = isChecked;
		if(isChecked === true) {
			this.views.root.class('checked').add();
		} else {
			this.views.root.class('checked').remove();
		}
	};

	CheckBox.prototype.clear = function(){
		this.views.root.class('checked').remove();
	};



	/**
	 * RadioButton
	 * */
	var RadioButton = Class(function RadioButtonController(args){
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


	var TextField = Class(function TextFieldController(args){
		this.super(args);

		event(this).attach({
			onData : event.multicast
		});
		this.trapMouseInput = args.trapMouseInput;

	}).extend(UIControl);


	function _textFieldOnKey(args){
		if(this.dataPath) {
			this.dataItem[self.dataPath] = args.source.value;
		}
		else {
			this.dataItem = {value:args.source.value};
		}
		this.onData(this.dataItem);
	};

	TextField.prototype.initialize = function(){

		event(this.views.root).attach({
			onkeyup		:	event.unicast,
			onchange 	: event.unicast
		});

		if(this.trapMouseInput === true){
			event(this.views.root).attach({
				onmousedown : event.unicast.stop
			});
		}

		if(this.isRealTime){
			this.views.root.onkeyup.subscribe(_textFieldOnKey, this);
		}
		else {
			this.views.root.onchange.subscribe(_textFieldOnKey, this);
		}

	}


	TextField.prototype.dataIn = function(dataItem){
		var value = this.dataItem = dataItem;
		if(this.dataPath) value = this.dataItem[this.dataPath];

		if(value!=null && value != undefined)
			this.elements.root.value = value;
	};

	TextField.prototype.clear = function(){
		this.elements.root.value = '';
	};

	TextField.prototype.focus = function(){
		this.elements.root.focus();
	};





	/* module scope and exports */

	exports.scope(
		{ButtonController 	 : Button},
		{CheckBoxController  : CheckBox},
		{TextFieldController : TextField}
	);

	exports.module(
		{ButtonController 	 : Button},
		{CheckBoxController  : CheckBox},
		{TextFieldController : TextField}
	);


}


});
