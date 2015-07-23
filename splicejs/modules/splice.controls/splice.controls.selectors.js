_.Module({

required:[
	'splice.controls.selectors.css',
	'splice.controls.selectors.html'
]
,
definition:function(){	

	var DropDownSelector = _.Namespace('SpliceJS.Controls').Class( function DropDownSelector(){
		SpliceJS.Core.Controller.call(this);
	
		var self = this;
		this.elements.controlContainer.onclick = function(){
			self.dropDown();
		} 

	}).extend(SpliceJS.Core.Controller)


	DropDownSelector.prototype.dataIn = function(data){
		this.data = data;
		this.elements.selector.innerHTML = data.toString();		
	};


	DropDownSelector.prototype.dropDown = function(){
		
		var left = this.elements.selector.offsetLeft;
		var height = this.elements.selector.offsetHeight;
		
		var cs = _.Doc.style(this.elements.selector);

		var s = this.elements.dropdownContainer.style;

		s.left = left + 'px';
		s.top =  cs.padding.top.value + cs.padding.bottom.value + height + 'px';

		s.display='block';

		var event 	= _.Event.attach(document.body, 'onmousedown');
		var handler = function(){
			s.display = 'none';
		};	 

		event.push().subscribe(handler, this).cleanup(function(){
			event.unsubscribe(handler);
			event.pop();
		}, this);
	};

}});