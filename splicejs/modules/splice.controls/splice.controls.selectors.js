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
		
		var left = this.elements.selector.offsetLeft
		,	height = this.elements.selector.offsetHeight
		,	top = height
		,	s = this.elements.dropdownContainer.style
		,	pos = SpliceJS.Ui.Positioning.absPosition(this.elements.selector)
		;
		
		//append drop down to the document root
		document.body.appendChild(this.elements.dropdownContainer);

		//cs.padding.top.value + cs.padding.bottom.value

		left = pos.x;
		top =  height +  pos.y;


		s.left = left + 'px';
		s.top =  top + 'px';

		s.display='block';

		var event 	= _.Event.attach(document.body, 'onmousedown');
		var handler = function(){
			s.display = 'none';
		};	 

		// close on body mouse down
		event.push().subscribe(handler, this).cleanup(function(){
			event.unsubscribe(handler);
			event.pop();
		}, this);
	
	};

}});