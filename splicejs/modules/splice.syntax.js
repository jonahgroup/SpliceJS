$js.module({
imports:[
	{ Utils : '/{$jshome}/modules/splice.util.js'}
],	
definition:function(){
var scope = this
,	imports = this.imports;

var 
    mixin = imports.Utils.mixin
;

function Tokenizer(input, alphanum, space){
	if(!(this instanceof Tokenizer) ) return new Tokenizer(input, alphanum, space);
	mixin(this, {
		input: input,	i : 0,	c : input[0]
	});

	this.alphanum = Tokenizer.isAlphaNum;
	if(alphanum) this.alphanum = alphanum;

	this.space = Tokenizer.isSpace;
	if(space) this.space = space;
};


Tokenizer.isSpace = function(c){
		if(	c === ' ' 	||
			c === '\n'	||
			c === '\r'  ||
			c === '\t') return true;
};

Tokenizer.isAlphaNum = function(c){
		if(!c) return false;
		var code = c.charCodeAt();
		if(	c === '_' ||
			(code >= 48 && code <= 57)	||	/*0-9*/
			(code >= 65 && code <= 90 ) || 	/*A-Z*/
			(code >= 97 && code <= 122) 	/*a-z*/ )
		return true;
		return false;
};

Tokenizer.prototype = {
	consume : function(){
		if(this.input.length <= this.i) return null;
		var cons = this.c;
		this.c = this.input[++this.i];
		return cons;
	},

	nextToken : function(){
		var c = this.c;
		if(this.alphanum(c)) {
			return this.identifier();
		}
		return this.consume();
	},

	identifier:function(){
		var result = '';
		while(this.alphanum(this.c)){
			result += this.consume();
		}
		return result;
	}
}
scope.exports(
	Tokenizer
);
}
});
