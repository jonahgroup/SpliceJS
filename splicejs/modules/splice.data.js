_.data = (function(){

	/*
		Paginator
	*/

	var Paginator = function Paginator(data, pageSize, startPage){

		this.data = data;
		
		this.pageSize = pageSize || 2 ;
		
		
		
		this.currentPage = -1;
		
		this.maxPage = Math.floor(this.data.length / pageSize) + 
			( (this.data.length % pageSize) / (this.data.length % pageSize)) ;
		
		this.minPage = -1;
				
		if(startPage > 0) this.currentPage = startPage-1;
		
		this.next();
	};

	
	function _page(){
		this.current = [];
		
		if(this.currentPage > this.maxPage) {
			this.currentPage = this.maxPage;
			return this;
		}

		if(this.currentPage < this.minPage) {
			this.currentPage = this.minPage;
			return this;
		}

		for(var i=0; i<this.pageSize; i++){
			var idx = this.currentPage * this.pageSize + i;
			
			// boundary check
			if(idx > this.data.length-1) {
				break;
			}
			if(idx < 0) {
				break;
			}	
			
			this.current.push(this.data[idx]);
		}
		return this;
	};
	
	Paginator.prototype = {
		hasNext : function(){
			/* compare next page idex to last element's index */
			if( (this.currentPage + 1) * this.pageSize > (this.data.length-1) ) return false;
			return true;
		}
		,
		next : function(){
			this.currentPage++;
			return _page.call(this);
		}
		,
		prev : function(){
			this.currentPage--;
			return _page.call(this);
		},
		to:function(pageNumber){
			this.currentPage = pageNumber;
			return _page.call(this);
		}
	};


	var Frame = function(size, step){
		
	};

	Frame.prototype.next = function(){};
	Frame.prototype.prev = function(){};


	function forEach(callback){
		
		// array iterator
		if(this instanceof Array){
			for(var i=0; i<this.length; i++){
				callback(this[i]);
			}
		}

		// property iterator
		if(this instanceof Object){
			var keys = Object.keys(this);
			for(var i=0; i<keys.length; i++){
				callback( keys[i],this[keys[i]]);
			}	
		}
		return data(this);
	};


	function groupBy(grouping, groupingFunction){
		var groupings = {};
		
		//array iterator
		if(this instanceof Array){
			for(var i=0; i<this.length; i++){
				
				var groupkey = typeof grouping === 'function' ? grouping(this[i],groupings) : null;
				if(!groupkey) groupkey = 'default';			

				var value = groupings[groupkey];
				if(!value) {
					if(typeof groupingFunction === 'function' && groupkey !== 'default') 
						groupings[groupkey] = null;
					else 
						groupings[groupkey] = [];
				}

				if(typeof groupingFunction === 'function' && groupkey !== 'default') {

					groupings[groupkey] = groupingFunction(this[i], groupings[groupkey]);

				} else {
					
					groupings[groupkey].push(this[i]);
				}
			}	
		
			return data(groupings);
		}


		//map iterator
		if(this instanceof Object){
			return data(groupings);
		}	

		return data(this);
	};


	function filter(condition){
		
		//array iterator
		if(this instanceof Array){
			var result = [];
			if(typeof condition !== 'function') return data(this);
			for(var i=0; i<this.length; i++){
				if(condition({key:i,value:this[i]}) === true) {
					result.push(this[i]);
				}
			}
			return data(result);
		}

		// map iterator
		if(this instanceof Object){
			result = {};
			var keys = Object.keys(this);

			if(!keys) 			return data(result);
			if(keys.length < 1) return data(result);

			for(var i=0; i<keys.length; i++){
				if(this.hasOwnProperty(keys[i]))
				if(condition({key:keys[i],value:this[keys[i]]}) === true)
					result[keys[i]] = this[keys[i]];
			}
			return data(result);
		}
	};


	/**
	 *	Array transformation function 
	 */
	function _objectToArray(onitem){
		var result = []
		, keys = Object.keys(this);
		
		if(!keys) return data(result);
		if(keys.length < 1) return data(result);
		
		for(var i=0; i<keys.length; i++){
			if(this.hasOwnProperty(keys[i])){
				var value = this[keys[i]];	
				if(typeof onitem === 'function')
					value = onitem(keys[i],value,i);
				
				if(value == null || value == undefined) continue;
				result.push(value);
			}
		}
		return data(result);
	};

	/**
	 *	Array transformation function 
	 */
	function _numberToArray(onitem){
		var n = +this
		,	result = []; 
		
		for(var i=0; i < n; i++){
			var value = i;

			if(typeof onitem === 'function')
				value = onitem(i,value,i);	

			if(value == null || value == undefined) continue;
			result.push(value);
		}
		return data(result);
	};	
	
	function _contArrays(target, source){
		if(!target) return;
		if(!(source instanceof Array)) return;
		
		for(var i=0; i<source.length; i++){
			target.push(source[i]);
		}
		return target;	
	};
	
	
	function sort(){

	};

	function first(){
		if(! (this instanceof Array) ) return null;
		return data(this[0]);
	};


	function nth(n){
		if(!(this instanceof Array)) return null;
		return data(this[n]);	
	};
	
	function size(){
		if(this instanceof Array) return this.length;	
	};
	
	function add(source){
		if(!source) return data(this);
		
		if(this instanceof Array && source instanceof Array ){
			return data(_contArrays(this,source));
		}
		
		if(this instanceof Array){
			return data(this.push(source));
		}	
		
		return data(this);
	};


	function data(d){
		
		var _export  = {
			foreach		:function(callback){return forEach.call(d,callback);},
			filter		:function(callback){return filter.call(d,callback);},
			group		:function(callback,gfn){return groupBy.call(d,callback,gfn);},
			first		:function(callback){return first.call(d);},
			nth			:function(callback){return nth.call(d);},		
			page        :function(size,start) { return new Paginator(d, size, start);},
			frame       :function(size,move){return new Frame(size,move);},
			sort		:function(callback){return sort.call(d,callback);},
			size		:function(callback){return size.call(d,callback);},
			add			:function(toadd){return add.call(d,toadd);},
			result  	:d
		};

		// multiplex "to" function
		if(typeof d === 'number' || (d instanceof Number)){
			_export.to = function(callback){return _numberToArray.call(d,callback);}; 
		} else if(typeof d === 'object' || d instanceof Array) {
			_export.to = function(callback){return _objectToArray.call(d,callback);};
		}
		
		
		return _export;
	};
	return data;
})();


