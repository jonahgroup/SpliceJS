_.Module({

required:[	
			
	'splice.ui.js',
	'splice.controls/splice.controls.css',
  	'splice.controls/splice.controls.htmlt',
	'splice.controls/splice.controls.datatable.js',
	'splice.controls/splice.controls.scrollpanel.js',
	'splice.controls/splice.controls.chart.js',
	'splice.controls/splice.controls.listbox.js'
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




	/**
	 * Drop down list
	 * */
	var DropDownList = _.Namespace('SpliceJS.Controls').Class(function DropDownList(args){
		this.dom = this.concrete.dom;
	}).extend(SpliceJS.Controls.UIControl); 





	DropDownList.prototype.show = function(args){
		if(!args || !args.parent) return;
		
		var parent_size 	= _.Doc.elementSize(args.parent);
		var parent_position = _.Doc.elementPosition(args.parent);
		var documentHeight 	= _.Doc.getHeight();
		
		this.dom.style.maxHeight = (documentHeight - parent_position.y - parent_size.height - 5) + 'px';
		
		
		document.body.appendChild(this.dom);
		
		if(typeof(args.content) ==  'string') {
			this.dom.innerHTML = args.content;
		} else if( typeof(args.content) == 'object'){
			this.dom.innerHTML = '';
			this.dom.appendChild(args.content);
		}
		
		
		var style = this.dom.style;
		style.left = parent_position.x + 'px';
		style.top  = parent_position.y + parent_size.height + 'px';
		
		this.dom.className = '-sc-drop-down-list -sc-show';
		
		
		/* remove list on defocus*/
		
		document.body.onmousedown = (function(){
			this.hide();
			document.body.onmousedown = '';
		}).bind(this); 
		
	};
	

	DropDownList.prototype.dataIn = function(data){



	};
	
	DropDownList.prototype.hide = function() {
		this.dom.className = '-sc-drop-down-list -sc-hide';
	};





	/* DrawerPanel*/

	var DrawerPanel = _.Namespace('SpliceJS.Controls').Class(
		function DrawerPanel(){
			
			this.isOpen = false;

			var self = this;
			this.elements.actuator.onclick = function(){
				self.openDrawer();		
			}

		}
	);


	DrawerPanel.prototype.openDrawer = function(){
			
		var self = this;	

		
	
		var width = this.elements.controlContainer.clientWidth;

		var actuatorIconSize = {
			width: 	this.elements.actuatorIcon.clientWidth,
			height: this.elements.actuatorIcon.clientHeight
		};

		var s = this.elements.drawer.style;
		var s_actuator = this.elements.actuator.style;


		var from = to = 0;

		if(!this.isOpen) {
			from = 0;
			to = width / 2;
		} else {
			from = width / 2;
			to = 0;
		}


		this.elements.actuator.addEventListener("transitionend", function(e){
			self.isOpen = !self.isOpen;
		}, true);

		this.elements.drawer.style.width = to + 'px';
		this.elements.actuator.style.left = (to - actuatorIconSize.width - 10) + 'px';


	};


// end module definition		
}});