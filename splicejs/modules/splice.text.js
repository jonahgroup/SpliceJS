	
var Formatter = (function(){

var STRINGBODY = 0
, 	FORMAT = 1
,	ARGUMENTPOSITION = 3
,	FORMATSYMBOL = 4
,	SYMBOL = 5;

var FormatLexer = function FormatLexer(input, isFormatMode){
	this.input = input;
	this.c = this.input[0];

	this.i = 0;
	this.totalLength = this.input.length;

	this.isEOF = false;
	this.isFormatMode = isFormatMode;

}


FormatLexer.prototype.lookahead = function(n){
	return this.input[this.i + n];
}


FormatLexer.prototype.consume = function(){
	var r = this.c;
	this.c = this.input[++this.i];

	if(this.i == this.totalLength) this.isEOF = true;;

	return r;
}


function isSpace(c){
	if(	c === ' ' 	|| 
		c === '\n'	||
		c === '\r'  ||	
		c === '\t') return true;
};

function isDigit(c){

	var code = c.charCodeAt();
			  //0			//9
	if(code >= 48 && code <= 57){
		return true;
	}

	return false;
};

function isLetter(c){

	var code = c.charCodeAt();

	if(	(code >= 65 && code <= 90 ) || 	/*A-Z*/
		(code >= 97 && code <= 122) 	/*a-z*/) return true;
	return false;	
}


function isFormatSymbol(c){

	var code = c.charCodeAt();

	if(	c == '#' || c == '(' || c == ')' || c == ',' || c == '.' ||
		(code >= 65 && code <= 90 ) || 	/*A-Z*/
		(code >= 97 && code <= 122) 	/*a-z*/) return true;
	return false;	

}


function whitespace(){
	while(isSpace(this.c)) this.consume();
}

function stringbody(){
	var result = '';
	while(this.c != '{' && !this.isEOF) { 
	
		result+=this.consume();

		/*process escape sequence*/
		if(this.c == '\\') {
			if(this.lookahead(1) == '{'){
				this.consume(); //consume slash
				result += this.consume(); //consume char {
			}
		}
	}
	return [STRINGBODY, result];
}

function formatsequence(){
	var result = '';
	this.consume(); //skip {
	while(this.c != '}' && !this.isEOF){
		result += this.consume();
	}

	if(this.c != '}') throw 'Invalid format syntax, { and } must be escaped';
	
	this.consume(); // consume }
	return [FORMAT, result];
}



function argumentposition(){
	var result = '';

	if(!isDigit(this.c)) return [null,null];

	while(!this.isEOF && isDigit(this.c) ){
		result += this.consume();
	}

	if(this.c != ':') throw 'Invalid argument position specifier';
	this.consume(); //consume :
	return [ARGUMENTPOSITION,result];
}

function formatsymbol(){
	
	var result = '';

	while(!this.isEOF && isFormatSymbol(this.c)  ){
		result += this.consume();
	}
	
	return [FORMATSYMBOL, result];
}

function symbol(){

	var result = '';
	while(!this.isEOF && !isFormatSymbol(this.c) ){
		result += this.consume();
	}
	
	return [SYMBOL, result];

	

}



FormatLexer.prototype.stringMode = function(){

	if(this.isEOF) return;

	var a = stringbody.call(this);

	if(a[1]) return a;

	a = formatsequence.call(this);

	if(a[1]) return a;

	return null;

}


FormatLexer.prototype.formatMode = function(){

	if(this.isEOF) return;

	var a = argumentposition.call(this);

	if(a[1]) return a;

	a = formatsymbol.call(this);

	if(a[1]) return a;

	a = symbol.call(this);

	if(a[1]) return a;

	return null;
}


FormatLexer.prototype.nextToken = function(){

	if(this.isFormatMode) return this.formatMode();

	else return this.stringMode();

};

var formatLookup = {
	"yyyy":function(d){
		if(!(d instanceof Date)) return '{error}';
		return d.getFullYear();
	},
	"mm":function(d){
		if(!(d instanceof Date)) return '{error}';
		var month = d.getMonth()+1;
		return (100 + 1*month).toString().substring(1);
	},
	"dd":function(d){
		if(!(d instanceof Date)) return '{error}';
		var date = d.getDate()+1;
		return (100 + 1*date).toString().substring(1);
	}
};
	
function executeFormat(format, value){

	var fn = formatLookup[format];
	if(typeof fn == 'function') {
		return fn(value);
	}

	return value;

};


function processFormat(format, valueArgs){
	//start in format mode
	var lexer = new FormatLexer(format, true)
	,	token = ''
	,	result = ''
	,	count = 0;

	var value = null;
	while(token = lexer.nextToken()){
		
		if(token[0] == ARGUMENTPOSITION) {
			value = valueArgs[token[1]*1+1];
			continue;
		}

		if(token[0] == FORMATSYMBOL){
			result += executeFormat(token[1], value); 
			continue;
		}

		if(token[0] == SYMBOL){
			result += token[1];
			continue;
		}

		if(count++ > 100) throw 'Format parsing error!';
	}

	return result;
}

function format(){

	if(arguments.length < 2) throw '_.Text.format(string, values) takes two arguments '; 

	var input = arguments[0];

	var lexer = new FormatLexer(input)
	,	count = 0
	, 	token = null
	,	result = ''
	,	nextArgument = 1;

	while(token = lexer.nextToken()){

		_.debug.log('Ma token:' + token[1]);

		if(token[0] == STRINGBODY) {
			result += token[1];
			continue;
		}
		
		if(token[0] == FORMAT) {

			result += processFormat(token[1],arguments);

			nextArgument++;
			continue;
		}
		
		if(count++ > 10000) throw 'Something went wrong';
	}

	return result;
}

return format;

})();

	/**
	 * Text manupulation wrapper function	
	 * @text parameter primitive type object String, Number	
	 * @return object supporting text manipulation API
	 */
_.Text = function(text){
	if( typeof text !=='string') return null;

	return {
		text:text,
		
		endswith:function(ending){
			var matcher = new RegExp("^.+"+ending.replace(/[.]/,"\\$&")+'$');
			var result = matcher.test(this.text); 
			return result;
		},

		/**
	 	 * Removes string or a collection of string from the a text blob
		 * @arguments: String, Array
		 */
		remword:function(){

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
		},

	/**
	 *	Builds string by concatinating element of the array and separated
	 *  by the delimiter. If delimiter is not provided, default delimiter is "space"
	 */	
		join : function(delimiter){
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
		wordcount : function(){
			var parts = this.text.split(/\s/);
			if(!parts) return 0;

			return parts.length;
		},


		strip : function(c,count){
			if(!count) count = 1;
			for(var i=0; i<this.length; i++){
				if( this.charAt(this.length-1-i) == c) count--;
				if(count == 0) return this.substring(0,this.length - i-1);
			}
		},

		clip : function(text){
			var index = this.match(new RegExp(text));
			
			if(!index || index == -1) return this;
			index = index.index;
			var result = this.substring(0, index) + this.substring(index + text.length, this.length); 
			return  result;
			
		},	

	/**
	 *	Counts number of words in the string
	 */	
		format : function(){

		}	
	};
};

_.Text.format = Formatter;
