/* global sjs */
sjs({
definition:function(sjs){

	var mixin = sjs.mixin
	,	Class = sjs.Class;

	var DataStep = function DataStep(dowork, issource){
		mixin(this,{
			input : null,
			next : [],
			data : null,
			issource: issource
			}
		);
		this.dowork = dowork;
	};	
	DataStep.prototype = {
		run:function(args){
			var in_data = null;
			if(this.issource) in_data = this.data;
			else
				in_data = this.input.data;

			this.data = this.dowork(in_data, args);
			for(var i=0; i< this.next.length; i++){
				this.next[i].run();
			}
		},
		add:function(step){
			this.next.push(step);
			step.input = this;
			return step;
		},
		setdata:function(data){
			this.data = data;
		}
	};


	function isIn(value, start,end){
		if(value == null) return false;
		if(value >= start && value <= end) return true;
		return false;	
	};

	/*
		Iterator
	*/
	function Iterator(callback){
		this.fn = (typeof callback === 'function') ? callback : function(item){return item;};
		this.length = 0;
	};

	//returns array
	Iterator.prototype.current = function(){
		var result = [];
		this.iterate(function(v,k){
			result.push(v);
		})
		return result;
	};

	Iterator.prototype.iterate = function(callback, start, end){
		throw "Abstract method: Iterator.prototype.iterate(callback) implementation is not provided";
	};
	
	Iterator.prototype.next = function(callback){
		throw "Abstract method: Iterator.prototype.next(callback) implementation is not provided";
	};
	
	Iterator.prototype.to = function(position){
		throw "Abstract method: Iterator.prototype.to(position) implementation is not provided";	
	};

	/**
	 *
	 */
	var NumericIterator = Class.extend(Iterator)(function NumericIterator(n,callback){
		this.super(callback);
		this.n = n;
		this.position = 0;
		this.length = n;
	});


	/**
	 * Returns false when last item is reached
	 */
	NumericIterator.prototype.next = function(callback){
		if(this.position == this.n) return false;
		callback(this.fn(this.position++));
		if(this.position == this.n) return false;
		return true;
	};


	NumericIterator.prototype.iterate = function(callback,start,end){
		callback = callback ? callback : function(){};
		var _start 	= 0
		,	_end 	= this.n; 

		if(start) {	_start = start;	}
		if(end) {_end = end;}

		for(var i = _start; i < _end; i++){
			callback(this.fn(i));
		}
	};
	

	/**
	 * Wraps callback around target iterator
	 */
	var NestedIterator = Class.extend(Iterator)(function NestedIterator(iterator,callback){
		this.super(callback);
		this.iterator = iterator;
		this.length = iterator.length;
	});

	NestedIterator.prototype.next = function(callback){
		var self = this;
		return this.iterator.next(function(item){
			callback(self.fn(item));
		});
	};

	NestedIterator.prototype.iterate = function(callback,start,end){
		var self = this;
		this.iterator.iterate(function(){
			arguments[0] = self.fn.apply(self,arguments);
			callback.apply(this,arguments);
		}, start, end);
	};


	/**
	 * Iterates over array elements
	 */
	var ArrayIterator = Class.extend(Iterator)(function ArrayIterator(array,callback){
		this.super(callback);
		this.array = array;
		this.position = 0;
		this.length = array.length;
	});

	ArrayIterator.prototype.next = function(callback){
		if(this.position >= this.array.length) return false;

		callback(this.fn(this.array[this.position]), this.position);
		this.position++;

		if(this.position >= this.array.length) return false;
		return true;
	};

	ArrayIterator.prototype.iterate = function(callback,start,end){
		if(typeof callback !== 'function') return;
		
		var _start = 0
		,	_end = this.length; 
		
		if(start != null) {_start = start;}
		if(end != null) {_end  = end;}
		
		for(var i = _start; i < _end; i++){
			callback(this.fn(this.array[i]),i,i);
		}
	};

	/*
		Creates paged view of the source iterator
	*/
	var PagingIterator = Class.extend(Iterator)(function PagingIterator(source, pagesize,callback){
		this.super(callback);
		this.i = source;	
		this.size = pagesize;
		this.page = 0;
		
		//total number of pages, used the next call		
		this.pages = Math.floor(source.length / pagesize) +
			( (source.length % pagesize)?1:0 );
	
		// assumes iterator length is known, may not always be the case		 
		this.length = this.size;
		
	});
	
	// in context of paging iterator start, end boundary indicates pages
	// if present for paring iterator these arguments are ignored 
	PagingIterator.prototype.iterate = function(callback, start, end){

		if(typeof callback !== 'function') return;
		
		var _start = this.page * this.size
		,	_end = _start + this.size;
		
		if(start != null) _start = start;
		if(end != null) _end = end;
		
		this.i.iterate(callback,_start,_end);		
		
	};
	// returns true and passes itself to a callback
	PagingIterator.prototype.next = function(callback){
		if(typeof callback === 'function') 
			callback(this.fn(this));
		this.page++;
		if(this.page >= this.pages) return false;
		return true;		
	};
	
	//sets are new page
	PagingIterator.prototype.to = function(page){
		this.page = page;
		return this;
	};


	/** 
	 * Creates frame view of the source iterator	
	 */
	 var FrameXIterator = Class.extend(Iterator)(function FrameXIterator(source, size, step, callback){
		this.super(callback);
		this.i = source;
		
		this.length = size;
		this.step = step; this.size = size; this.position = 0; 
	 
	 	this.steps = Math.floor(this.length / this.step) + ((this.length % this.step)?1:0);
	 
	 });


	 FrameXIterator.prototype.iterate = function(callback, start, end){
	 	 if(typeof callback !== 'function') return;
		 
		 var _start = _s = this.position * this.step;
		 var _end = _e = _start + this.size;
		 
		 if( isIn(start, _s, _e-1)) _start = start;
		 if( isIn(end, _s, _e-1)) _end = end; 
		 
		 this.i.iterate(callback,_start,_end);		 
	 };
	 
	 FrameXIterator.prototype.next = function(callback){
	 	if(typeof callback === 'function')
			callback(this.fn(this)); 
		this.position++;
		if(this.position >= this.steps) return false;
		return true;			 
	 };
	 
	 FrameXIterator.prototype.to = function(frameNo){
		 this.position = frameNo;
		 return this;
	 };
	 
	 /** 
	  *	Breaks up collection into ranges 
	  */
	var RangeIterator = Class.extend(Iterator)(function RangeIterator(source, start, size, callback){
		this.super(callback);
		this.length = size;
		this.i = source;
		
	 	this.start = start;
		this.end = start + size;	  
	});

	 
	RangeIterator.prototype.iterate = function(callback, start, end){
		var _start = this.start
		,	_end = this.end;
		
		if( isIn(start, this.start, this.end) )
			_start = start;
		
		if(isIn(end, this.start, this.end))
			_end = end;
		var counter = {i:0}	
		this.i.iterate(function(v,k,i){
			callback(v,k,counter.i+_start);
			counter.i++;
		},_start,_end);	
	}
	 
	 

	/**
	 * Iterates over object properties
	 */
	var ObjectIterator = Class.extend(Iterator)(function ObjectIterator(obj, callback){
		this.super(callback);
		this.obj = obj;
		this.keys = Object.keys(obj);
		this.position = 0;
	});

	ObjectIterator.prototype.next = function(callback){
		if(this.position >= this.keys.length) return false;
		var key = this.keys[this.position];
		callback(this.fn(this.obj[key]),key);
		this.position++;
		if(this.position >= this.keys.length) return false;
	};

	ObjectIterator.prototype.iterate = function(callback){
		for(var i=0; i< this.keys.length; i++){
			var key = this.keys[i];
			callback(this.fn(this.obj[key]),key);
		}
	};

	/**
	 * */
	var FrameArrayIterator = Class.extend(ArrayIterator)(function FrameArrayIterator(array, start, end, transformFunction){
		this.super(array, transformFunction);
		this.position = start;
		this.initialFrozenPosition = start;
		this.endPosition = Math.min(end, this.array.length);
	});

	FrameArrayIterator.prototype.next = function(callback){
		if(this.position >= this.endPosition) return false;
		callback(this.fn(this.array[this.position]), this.position - this.initialFrozenPosition);
		this.position++;
		if(this.position >= this.endPosition) return false;
	};

	FrameArrayIterator.prototype.iterate = function(callback){
		if(typeof callback !== 'function') return;
		for(var i=this.initialFrozenPosition; i< this.endPosition; i++){
			callback(this.fn(this.array[i]),i-this.initialFrozenPosition);
		}
	};

	/** 
	 * */
	var FrameIterator = Class.extend(Iterator)(function FrameIterator(array, size, step, transformFunction){
		this.super(transformFunction);
		this.data 	= array;
		this.size 	= size;
		this.step 	= step || Math.ceil(this.data.length * 0.2);
		this._cursor = {
			position: 0,
			frameCount : 0,
			hasMoreFrames : true
		};
	});

	FrameIterator.prototype.next = function(callback){
		if (!this._cursor.hasMoreFrames) return false;
		_frame.call(this,callback, this._cursor);

		return this._cursor.hasMoreFrames;
	};


	FrameIterator.prototype.iterate = function(callback){
		var _cursor = {
			position: 0,
			frameCount : 0,
			hasMoreFrames : true
		};
		while(_cursor.hasMoreFrames){
				_frame.call(this,callback, _cursor);
	 	}
	};

	var _frame = function _frame(callback, cursor){
			callback(new FrameArrayIterator(
					this.data , cursor.position + this.size > this.data.length
								? Math.max(this.data.length - this.size,0)
								: cursor.position
							  , cursor.position + this.size
							  , this.fn), ++cursor.frameCount);
		 cursor.hasMoreFrames = cursor.position + this.size < this.data.length;
		 //move frame
		 cursor.position+=this.step;
	};


	/*
		Paginator
	*/
	var Paginator = function Paginator(data, pageSize, startPage){

		this.data = data;

		this.pageSize = pageSize || 2 ;

		this.currentPage = -1;

		this.maxPage = Math.floor(this.data.length / pageSize) +
			( (this.data.length % pageSize)?1:0);

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
		},
		pages:function(){
			return this.maxPage;
		}
	};


	var Frame = function Frame(data, size, step){
		if (size == undefined) throw 'The frame size is required';

		this.data = data;
		this.size = size;
		this.step = step || Math.ceil(this.data.length * 0.2);

		this.cursor = (-1)*this.step;

		if (this.step > this.size)
		throw 'The step should not exceed the size of the frame';
	};

	Frame.prototype.next = function () {
		if (this.hasMore()){
			this.cursor+=this.step;
		}

		return _frame.call(this);
	};

	Frame.prototype.hasMore = function(){
		return this.cursor + this.size <= this.data.length + this.step;
	}

	Frame.prototype.prev = function () {
		if (this.cursor >= 0)
		this.cursor-=this.step;

		return _frame.call(this);
	};

	Frame.prototype.to = function(n){

	};

	var _frame_old = function(){
		if (this.cursor < 0 || !this.hasMore()) return [];

		var cursor = Math.min(this.cursor, this.data.length - this.size);
		return this.data.slice( cursor , Math.min(cursor + this.size, this.data.length) );
	}

	Frame.prototype.current = function(){
		return _frame.call(this);
	};


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
				callback(this[keys[i]],keys[i]);
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
					value = onitem(value,keys[i],i);

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


	function defaultComparator(a,b) {
		var aa = +a
		,	bb = +b;

		aa = Number.isNaN(aa)?a:aa;
		bb = Number.isNaN(bb)?b:bb;

		if(aa < bb) return -1;
		if(aa > bb) return 1;
		return 0;
	};


	function sort(callback){
		//may only sort arrays

		if(!callback) callback = defaultComparator;

		var target = this;
		return {
			asc:function(){
				target.sort(callback);
				return data(target);
			},
			desc:function(){
				target.sort(function(a,b) {return -1 * callback(a,b);});
				return data(target);
			}
		};
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

	function asyncIterator(d, callback,pageSize, oncomplete, oninterrupt){
		var page_size = 20
		,	length = 0;

		if(typeof d === 'number') length = d;
		if(d instanceof Array ) length = d.length;

		if(pageSize) page_size = pageSize;

		var	pages = Math.floor(length / page_size) + ( (length % page_size) / (length % page_size ))
		,	count = {p:0};

		var fn = function(){
			if(count.p >=  pages) {
				if(typeof oncomplete === 'function' ) oncomplete();
				return;
			}
			var start = page_size * count.p
			,	end  = start + page_size;
			for(var i = start;
					i < end && i < length;
					i++ ) {
				callback(i)
			}
			count.p++;
			if(typeof oninterrupt === 'function') oninterrupt();
			setTimeout(fn,1);
		}

		fn();
	};


	function data(d){
/*
		var i = null;

		if(typeof d === 'number') 		i = new NumericIterator(d);
		else if(d instanceof Array) 	i = new ArrayIterator(d);
		else if(d instanceof Iterator)	i = d;
		else if(typeof d === 'object') 	i = new ObjectIterator(d);


		return {
			length: i.length,
			to:	function to(){
				if(typeof arguments[0] === 'function') 
					return data(new NestedIterator(i, arguments[0]));
				return data(i.to.apply(i,arguments));
			},
			each:function(callback){
				i.iterate(callback);
			},
			next:function(callback){
				return i.next(callback);
			},
			array:function(callback){
				return i.current();
			},
			frame:function frame(size,step){
				return data(new FrameXIterator(i,size,step,function(item){return data(item);}));	
			},
			current: function current(){
				return i.current();
			},
			page:function page(size){
				return data(new PagingIterator(i,size,function(item){return data(item);}))
			},
			
			range:function range(start, end){
				return data(new RangeIterator(i,start,end))
			},
			
			asyncloop	:function(callback, pageSize){return function(oncomplete, onint){
						return asyncIterator(d, callback, pageSize, oncomplete, onint);}
			},
			sort		:function(callback){return sort.call(d,callback);}
		}
*/


		var _export  = {
			each		:function(callback){return forEach.call(d,callback);},
			filter		:function(callback){return filter.call(d,callback);},
			group		:function(callback,gfn){return groupBy.call(d,callback,gfn);},
			first		:function(callback){return first.call(d);},
			nth			:function(callback){return nth.call(d);},
			page        :function(size,start) { return new Paginator(d, size, start);},
			frame       :function(size,move){return new Frame(d,size,move);},
			sort		:function(callback){return sort.call(d,callback);},
			size		:function(callback){return size.call(d,callback);},
			add			:function(toadd){return add.call(d,toadd);},
			asyncloop	:function(callback, pageSize){return function(oncomplete, onint){
							return asyncIterator(d, callback, pageSize, oncomplete, onint);}
						},
			array		:function(){return d;},					
			result  	:function(){return itr.current();}
		};

		// multiplex "to" function
		if(typeof d === 'number' || (d instanceof Number)){
			_export.to = function(callback){return _numberToArray.call(d,callback);};
		} else if(typeof d === 'object' || d instanceof Array) {
			_export.to = function(callback){return _objectToArray.call(d,callback);};
		}

		return _export;

	};


	return {
		data : data,
		DataStep : DataStep,
		NumericIterator: NumericIterator,
		compare:{'default':defaultComparator}
	};
}
});
