_.data = (function(){



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
				callback({
					property: keys[i],
					value:this[keys[i]]
				});
			}	
		}
		return data(this);
	}


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
		
	}


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


	}


	function toArray(){

		var result = [];

		var keys = Object.keys(this);
		if(!keys) return result;
		if(keys.length < 1) return result;
		
		for(var i=0; i<keys.length; i++){
			if(this.hasOwnProperty(keys[i]))
				result.push(this[keys[i]]);
		}

		return result;
	}


	function sort(){

	}

	function first(){
		if(! (this instanceof Array) ) return null;
		return this[0];
	}

	function data(dataObj){
		return {
			forEach	:function(callback){return forEach.call(dataObj,callback);},
			filter	:function(callback){return filter.call(dataObj,callback);},
			groupBy	:function(callback,gfn){return groupBy.call(dataObj,callback,gfn);},
			first	:function(callback){return first.call(dataObj)},
			toArray :function(){return toArray.call(dataObj);}, 	 
			result  :dataObj
		}
	};
	return data;
})();