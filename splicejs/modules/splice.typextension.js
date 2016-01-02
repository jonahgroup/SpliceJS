Array.prototype._peek = function(){
		if(this.length > 0) return this[this.length - 1];
		return null;
	};

Array.prototype._select = function(fn){
	if(this.length <= 0) return null;
	if(typeof(fn) !== 'function') return null;
	
	var a = new Array();
	for(var i=0; i<this.length; i++){
		var item = fn(this[i]);
		if(item) a.push(item);
	}
	return a;
};

Array.prototype._foreach = function(fn){
	for(var i=0; i<this.length; i++){
		fn(this[i],i);
	}
};


Array.prototype._copy = function(source){
	for(var i=0; i<source.length; i++){
		this.push(source[i]);
	}
};


if (typeof Object.assign != 'function') {
  (function () {
    Object.assign = function (target) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var output = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source !== undefined && source !== null) {
          for (var nextKey in source) {
            if (source.hasOwnProperty(nextKey)) {
              output[nextKey] = source[nextKey];
            }
          }
        }
      }
      return output;
    };
  })();
};