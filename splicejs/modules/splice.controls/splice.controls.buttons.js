/* global sjs */
$js.module({
prerequisite:[
	'/{$jshome}/modules/splice.module.extensions.js'
],
imports:[
	{ Inheritance 	: '/{$jshome}/modules/splice.inheritance.js' },
	{ Events 	  	: '/{$jshome}/modules/splice.event.js' },
	{ Views			: '/{$jshome}/modules/splice.view.js'},
	{ Component		: '/{$jshome}/modules/splice.component.core.js'},
	{ Utils			: '/{$jshome}/modules/splice.util.js'},
	{'SpliceJS.UI'	: '../splice.ui.js'},
	{'Doc' : '{$jshome}/modules/splice.document.js'},
	'splice.controls.buttons.css',
	'splice.controls.buttons.html'
]
,
definition:function(){
	var scope = this
	,	sjs = this.imports.$js;
	
	var	imports = scope.imports
    ;

	var
    	Class = imports.Inheritance.Class
	, 	UIControl = imports.SpliceJS.UI.UIControl
	, 	Events = imports.Events
	, 	MulticastEvent = imports.Events.MulticastEvent
	, 	Views = imports.Views
	,	Component = imports.Component
	, 	DomMulticastEvent = imports.Views.DomMulticastEvent
	,	log 			= imports.Utils.log
	,	debug 			= imports.Utils.log.debug
	;

	var components = Component.defineComponents(scope);


	var Button = Class(function ButtonController(args){
		this.base(args);
		Events.attach(this,{
			onClick : MulticastEvent
		});
	}).extend(UIControl);


	Button.prototype.initialize = function(){

		Events.attach(this.views.root,{
			onclick		: Views.DomMulticastStopEvent,
    		onmousedown	: Views.DomMulticastStopEvent
		});

		this.views.root.onclick.subscribe(function(){
			if(this.isDisabled == true) return;
			this.onClick(this.dataItem);
		},this);

		if(this.isDisabled) this.disable();
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

	Button.prototype.onDataIn = function(item){
		if(!this.staticContent)
		this.content(item.getValue()).replace();
    };

	Button.prototype.onDataItemChanged = function(){
		this.content(this.dataItem.getValue()).replace();
	};

	/**
	 *
	 * Check box
	 * */
	var CheckBox = Class(function CheckBoxController(args){
		this.base(args);
		this.isChecked = false;

		Events.attach(this,{
			onChecked	:	MulticastEvent
		});

	}).extend(UIControl);

	CheckBox.prototype.initialize = function(){
		Events.attach(this.views.root,{
			onclick 	:	Views.DomMulticastStopEvent,
      		onmousedown : 	Views.DomMulticastStopEvent
		}).onclick.subscribe(function(){
			this.isChecked = !this.isChecked;

			if(this.dataItem) {
				this.dataItem.setValue(this.isChecked);
			}

			this.check(this.isChecked);
			this.onChecked(this.dataItem);
		},this);
	}

	CheckBox.prototype.onDataIn = function(dataItem){
		this.isChecked = dataItem.getValue() === true ? true : false;
		this.check(this.isChecked);
	};

	CheckBox.prototype.check = function(isChecked){
		this.isChecked = isChecked;
		if(isChecked === true) {
			this.views.root.cssc('checked').add();
		} else {
			this.views.root.cssc('checked').remove();
		}
	};

	CheckBox.prototype.clear = function(){
		this.views.root.cssc('checked').remove();
	};



	/**
	 * RadioButton
	 * */
	var RadioButton = Class(function RadioButtonController(args){
		this.base(arguments);

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
		this.base(args);
		this.trapMouseInput = args.trapMouseInput;
	}).extend(UIControl);


	function _textFieldOnKey(args){
		this.dataItem.setValue(args.source.value);
		this.onDataOut(this.dataItem);
	};

	TextField.prototype.initialize = function(){

		Events.attach(this.views.root, {
			onkeyup		: Views.DomMulticastStopEvent,
			onchange 	: Views.DomMulticastStopEvent
		});

		if(this.trapMouseInput === true){
			Events.attach(this.views.root, {
				onmousedown : Views.DomMulticastStopEvent,
				onclick:Views.DomMulticastStopEvent
			});
		}

		if(this.isRealtime){
			this.views.root.onkeyup.subscribe(_textFieldOnKey, this);
		}
		else {
			this.views.root.onchange.subscribe(_textFieldOnKey, this);
		}
	}


	TextField.prototype.onDataIn = function(item){
		if(!item) return;
		this.views.root.attr({value:item.getValue()});
	};

	TextField.prototype.clear = function(){
		this.elements.root.value = '';
	};

	TextField.prototype.focus = function(){
		this.elements.root.focus();
	};


	/* module scope and exports */
	scope.add(
		{ButtonController 	 : Button},
		{CheckBoxController  : CheckBox},
		{TextFieldController : TextField}
	);

	scope.exports(
		{ButtonController 	 : Button},
		{CheckBoxController  : CheckBox},
		{TextFieldController : TextField}
	);

}
});
