	/**
	 * Text manupulation wrapper function	
	 * @text parameter primitive type object String, Number	
	 * @return object supporting text manipulation API
	 */
_.Text = function(text){
	if( typeof text !=='string') return null;

		text.endswith  = function(ending){
			var matcher = new RegExp("^.+"+ending.replace(/[.]/,"\\$&")+'$');
			var result = matcher.test(this.text); 
			return result;
		};

		/**
	 	 * Removes string or a collection of string from the a text blob
		 * @arguments: String, Array
		 */
		text.remword = function(){

			if(arguments.length < 1) return this.text;
			
			var parts = this.text.split(/\s/);	

			// process all supplied arguments			
			for(var i=0; i<arguments.length; i++){
				var arg = arguments[i];		

				if(typeof arg === 'number' )
					arg = arg.toString();

				if(typeof arg === 'string' ) {
					for(var pi=parts.length-1; pi>=0; pi-- ){
						if(parts[pi] === arg) parts.splice(pi,1);
					}
				}
			}
			return this.join.call({text:parts});
		};

	/**
	 *	Builds string by concatinating element of the array and separated
	 *  by the delimiter. If delimiter is not provided, default delimiter is "space"
	 */	
		text.join = function(delimiter){
			if(!delimiter) delimiter = ' ';
		
			var runningDelimiter = '';
			var result = '';
			for(var i=0; i< this.text.length; i++){
				result = result + runningDelimiter + this.text[i];
				runningDelimiter = delimiter;
			}

			return result;
		},

	/**
	 *	Counts number of words in the string
	 */	
		text.wordcount = function(){
			var parts = this.text.split(/\s/);
			if(!parts) return 0;

			return parts.length;
		},


		text.strip = function(c,count){
			if(!count) count = 1;
			for(var i=0; i<this.length; i++){
				if( this.charAt(this.length-1-i) == c) count--;
				if(count == 0) return this.substring(0,this.length - i-1);
			}
		};

		text.clip = function(text){
			var index = this.match(new RegExp(text));
			
			if(!index || index == -1) return this;
			index = index.index;
			var result = this.substring(0, index) + this.substring(index + text.length, this.length); 
			return  result;
			
		};	

	/**
	 *	Counts number of words in the string
	 */	
		text.format = function(){

		}	

		return text;
};