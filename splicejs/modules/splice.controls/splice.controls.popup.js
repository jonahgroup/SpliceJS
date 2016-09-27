$js.module({
prerequisite:[
	'/{$jshome}/modules/splice.module.extensions.js'
],
imports:[
	{ Inheritance : '/{$jshome}/modules/splice.inheritance.js' },
	{'SpliceJS.UI':'../splice.ui.js'},
	'splice.controls.popup.html',
	'splice.controls.popup.css'
],
definition:function(scope){
    "use strict";
	var scope = this
	,	sjs = this.imports.$js;

	var imports = scope.imports;

	var
		Class = imports.Inheritance.Class
	,	UIControl = imports.SpliceJS.UI.UIControl

	var Popup = Class(function PopupController(){
		this.base();

		this.ratio = { width: 4, height: 3 };

    /* subscribe to display events */
		this.onDisplay.subscribe(this.display,this);
		this.onAttach.subscribe(this.attach, this);

	}).extend(UIControl);


	Popup.prototype.attach = function () {
	}


	Popup.prototype.display = function () {
	    var popup = this.elements['popup'];
	    var mask = this.elements['popupMask'];

	    //measure document
	    var dim = scope.SpliceJS.UI.Positioning.windowDimensions();

	    var size = { width: 10, height: 10 };
	    var position = { left: 0, top: 0 };


	    size.width = Math.round(dim.width * 0.46);
	    size.height = Math.round(dim.height * 0.49);

        /*
	    if (dim.width <= dim.height) {
	        size.width = Math.round(dim.width / 3);
	        size.height = size.width * this.ratio.height / this.ratio.width;
	    } else {
	        size.height = Math.round(dim.height / 3);
	        size.width = size.height * this.ratio.width / this.ratio.height;
	    }
        */

	    position.left = Math.round(dim.width / 2 - size.width / 2)  / dim.width;
	    position.top = Math.round(dim.height / 2 - size.height / 2) / dim.height;

	    var s = popup.style;

	    s.left = Math.round(100 * position.left,2) + '%';
	    s.top = (-1*(size.height + 100)) + 'px';

	    s.width = 46 + '%';
	    s.height = 49 + '%';

	    mask.style.visibility = 'visible';
	    s.visibility = 'visible';

	    window.setTimeout(function () {
	        s.opacity = 1;
	        s.top = Math.round(100 * position.top, 2) + '%';
	        mask.style.backgroundColor =  'rgba(35,35,35,0.85)';
	    }, 1);
	};

    scope.add(
        Popup         
    );

    scope.exports(
        Popup    
    );


}

})
