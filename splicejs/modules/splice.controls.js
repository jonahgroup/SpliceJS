_.Module({
	
required:[	

			'modules/splice.controls/splice.controls.css',
          	'modules/splice.controls/splice.controls.htmlt'
 
 ],

follows:[
			
			'modules/splice.controls/splice.controls.datatable.js'

],          	
	
definition:function(){
	
	var UIControl = _.Namespace('SpliceJS.Controls').Class(function UIControl(args){
		if(this.isHidden) this.elements.controlContainer.style.display = 'none';

		/* attach style to the controlContainer */
		if(args.style)
		this.elements.controlContainer.className += ' ' + args.style; 

	});
	
	UIControl.prototype.hide = function(){
		var self = this;
		if(this.animate){
			_.Animate(this.elements.controlContainer).opacity(100, 0, 300,function(){
				self.elements.controlContainer.style.display = 'none';
			});
		}
		else {
			this.elements.controlContainer.style.display = 'none';
		}
	}
	
	UIControl.prototype.show = function(){
		if(this.animate) {
			this.elements.controlContainer.style.opacity = 0;
		}
		this.elements.controlContainer.style.display = 'block';
		
		if(this.animate) {
			_.Animate(this.elements.controlContainer).opacity(0, 100, 300);
		}
	}
	
	UIControl.prototype.changeState = function(args){
		_.debug.log('Changing button\'s state');
		if(args && args.isHidden)
			this.hide();
		else 
			this.show();
	};

	
	
	
	
	var Button = _.Namespace('SpliceJS.Controls').Class(function Button(args){
		_.info.log('Creating Button');
		SpliceJS.Controls.UIControl.apply(this,arguments);
		
		if(this.content && this.content['label']){
			this.elements.controlContainer.value = args.content['label']; 
		} else {
			this.elements.controlContainer.value = 'button';
		}
		
		var self = this;
		this.elements.controlContainer.onclick = function(){
			if(self.isDisabled == true) return;
			self.onClick();
		};
		
		if(this.isDisabled) this.disable();
		
		
	}).extend(SpliceJS.Controls.UIControl);

	
	Button.prototype.setLabel = function(label){
		this.elements.controlContainer.value = label;
	}
	
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
			self.dataItem[self.dataPath] = this.value;
			
			self.dataOut(self.dataItem);
		}
	});
	
	TextField.prototype.dataOut = function(){
		throw 'Data out interface is not assigned';
	}
		
	TextField.prototype.dataIn = function(dataItem){
		this.dataItem = dataItem;
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
			self.dataOut(self.dataItem);
		}
	
	}).extend(SpliceJS.Controls.UIControl);
	
	
	RadioButton.prototype.dataIn = function(dataItem){
		this.dataItem = dataItem;
	} 
// end module definition		
}});