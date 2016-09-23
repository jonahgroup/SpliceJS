
$js.module({
definition:function(){

var scope = this;

var STRINGBODY = 0
, 	FORMAT = 1
,	ARGUMENTPOSITION = 3
,	FORMATOPTION = 4
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
	if(	c === ' ' 	||		c === '\n'	||
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


function isSymbol(c){
	var code = c.charCodeAt();
	if(!isLetter(c) && !isDigit(c)) return true;
	return false;
}

function whitespace(){
	while(isSpace(this.c)) this.consume();
}

function stringbody(){
	var result = '';
	while(this.c != '{' && !this.isEOF) {

	reult+=this.consume();

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

function formatOption(){
	var result = "";

	if(!this.isEOF && isDigit(this.c)) {
		result = this.consume();
		return [FORMATOPTION, result];
	}

	while(!this.isEOF && isLetter(this.c) ){
		result += this.consume();
	}
	return [FORMATOPTION,result];
}

function formatSeparator(){

	var result = "";

	if(!this.isEOF && isSymbol(this.c)){
		result = this.consume();
	}
	return [SYMBOL,result];
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

	var a = formatOption.call(this);

	if(a[1]) return a;

	a = formatSeparator.call(this);

	if(a[1]) return a;


	return null;

}


FormatLexer.prototype.nextToken = function(){

	if(this.isFormatMode) return this.formatMode();

	else return this.stringMode();

};


var Fast = function Fast(input){

	this.lex = new FormatLexer(input,true);
	this.consume();

	this.tree = this.root = {fn:null, operand:null};

};

Fast.prototype.consume = function(){
	this.token = this.lex.nextToken();
}

Fast.prototype.isToken = function(value){
	if(!this.token) return false;
	if(this.token[1] == value) return true;
	return false;
}


Fast.prototype.exec = function(valueArgs){

	var result = '';

	if(this.token[0] == FORMATOPTION){

		var argument = valueArgs[(this.token[1]*1+1)];

		this.consume();

		if(this.token[1] != ':') throw 'Invalid format argument posittion syntax';
		this.consume();
	} else {
		throw 'Invalid format argument posittion syntax';
	}



	while(this.token != null){

		var t = this.token[1];


		if(t == '#' || t == '0' || t == '('){
			return result + numberFormat.call(this, argument);
		}

		if(t == 'dd' || t == 'yyyy' || t == 'mm' || t == 'm' || t == 'MM' || t == 'MMM'){
			return result + dateFormat.call(this, argument);
		}

		result += this.token[1];
		this.consume();
	}

};

//this - Fast
function numberFormat(argument){
	var padding = 0
	, 	factoring = 0
	,	precision = 0;


	if( this.isToken('(') ) {
		var b = ['',''];
		if(argument < 0) b = ['(',')'];

		this.consume();

		var result = b[0] + numberFormat.call(this, Math.abs(argument)) + b[1];

		if(this.token[1] != ')') throw 'Invalid format syntax';

		return result;
	}

	var sign = (argument/Math.abs(argument))<0?'-':'';

	argument = Math.abs(argument);
	//parse padding size
	while(this.isToken('0') || this.isToken('#')) {
		if(this.isToken('0') ) padding++;
		this.consume();
	}

	//parse factor size
	if(this.isToken(',') ){
		this.consume();
		while(this.isToken('#')){
			factoring++;
			this.consume();
		}
	}

	if( this.isToken('.')){
		this.consume();
		while(this.isToken('#')){
			precision++;
			this.consume();
		}
		if(precision == 0) argument = Math.round(argument);
	}


	//Apply format calculation

	var precisionAmount = '';
	if(precision > 0) {
		var n = Math.pow(10,precision);

		argument = Math.round(argument * n );
		precisionAmount = (argument % n).toString();
		argument = Math.floor(argument / n);
	} else {
		var x = argument.toString();
		var idx = x.indexOf('.');
		if(idx > -1) precisionAmount = x.substring(idx+1);
	}

	argument = Math.floor(argument);

	if(factoring > 0) {
		var n = Math.pow(10,factoring)
		, 	result = ''
		,	f = argument;

		for(; f >= n; f = Math.floor(f/n) ) {
	        result = ','+ (f % n) +result;
    	}
    	argument = f + result;
	}

	var result = sign + argument + (precisionAmount?('.'+precisionAmount):'');
	return result;
}


//--- Operations
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
	"m":function(d){
		if(!(d instanceof Date)) return '{error}';
		return d.getMonth()+1;
	},
	"dd":function(d){
		if(!(d instanceof Date)) return '{error}';
		var date = d.getDate();
		return (100 + 1*date).toString().substring(1);
	},
	"d":function(d){
		if(!(d instanceof Date)) return '{error}';
		return d.getDate();
	}

};

function dateFormat(value){
	var result = ""
	,	token = null;

	while(token = this.token){
		var fn = formatLookup[token[1]];
		if(fn) {
			result += fn(value);
			this.consume();
			continue;
		}
		result += token[1];
		this.consume();
	}

	return result;
};


// ()
function bracketOperation(value){
	if(typeof value == 'number') {
		if( value < 0) return '('+Math.abs(value)+')';
		return value;
	}
	return '('+value+')';
}





function processFormat(format, valueArgs){
	var fast  = new Fast(format);
	return fast.exec(valueArgs);
}

function format(){

	if(arguments.length < 2) throw 'format(string, values) takes two arguments ';

	var input = arguments[0];

	var lexer = new FormatLexer(input)
	,	count = 0
	, 	token = null
	,	result = ''
	,	nextArgument = 1;

	while(token = lexer.nextToken()){



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
};



/**
	* Text manupulation wrapper function
	* @text parameter primitive type object String, Number
	* @return object supporting text manipulation API
	*/
var Text = function Text(text){
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

scope.exports(
	format, Text
);

}
});
