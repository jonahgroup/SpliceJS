_.Module({

definition:function(){

	var UIControl = _.Namespace('SpliceJS.Controls').Class(function UIControl(args){
		if(this.isHidden) this.elements.controlContainer.style.display = 'none';

		/* attach style to the controlContainer */
		if(args.style)
		this.elements.controlContainer.className += ' ' + args.style; 


		this.dataItem = null;

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

	UIControl.prototype.dataIn = function(data){
		this.dataItem = data;
	};
	
	UIControl.prototype.dataOut = function(){};

	}




});