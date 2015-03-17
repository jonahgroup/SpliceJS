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

String.prototype._endswith = function(ending){
	var matcher = new RegExp("^.+"+ending.replace(/[.]/,"\\$&")+'$');
	var result = matcher.test(this); 
	return result;
};


String.prototype._strip = function(c,count){
	if(!count) count = 1;
	for(var i=0; i<this.length; i++){
		if( this.charAt(this.length-1-i)  == c) count--;
		if(count == 0) return this.substring(0,this.length - i-1);
	}
};

String.prototype._clip = function(text){
	var index = this.match(new RegExp(text));
	
	if(!index || index == -1) return this;
	index = index.index;
	var result = this.substring(0, index) + this.substring(index + text.length, this.length); 
	return  result;
	
};