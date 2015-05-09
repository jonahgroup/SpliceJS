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


	function groupBy(grouping){
		var groupings = [];
		
		//array interator
		if(this instanceof Array){
			for(var i=0; i<this.length; i++){
				
				var groupkey = grouping(this[i]);
				if(!groupkey) continue;			

				var group = groupings[groupkey];
				if(!group) {
					group = {key:groupkey, value:[]};
					groupings.push(group);
				}
				group.value.push(this[i]);
			}	
		}
		return data(groupings);
	}


	function filter(condition){
		
		//array iterator
		if(this instanceof Array){
			var result = [];
			if(typeof condition !== 'function') return data(this);
			for(var i=0; i<this.length; i++){
				if(condition(this[i]) === true) {
					result.push(this[i]);
				}
			}
			return data(result);
		}
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
			groupBy	:function(callback){return groupBy.call(dataObj,callback);},
			first	:function(callback){return first.call(dataObj)}, 	 
			result  :dataObj
		}
	};
	return data;
})();