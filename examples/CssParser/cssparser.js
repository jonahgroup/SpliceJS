var CSSParser = function(){

	var SPACE = 'SPACE', COMMENT = 'COMMENT', 
		IDENTIFIER = 'IDENTIFIER', BRACKET = 'BRACKET',
		COLON = 'COLON', SEMICOLON = 'SEMICOLON', COMMA = 'COMMA';



	var CSSLexer = function CSSLexer(input){
		
		this.i = 0;
		this.input = input;
		this.c = input[0];
	};

	CSSLexer.prototype.consume = function(){
		var cons = this.c;
		this.c = this.input[++this.i];

		return cons;
	};

	CSSLexer.prototype.lookahead = function(n){
		return this.input[this.i+n];
	}

	CSSLexer.prototype.getNextToken = function(){

			if(!this.c) return null;

			var a = space(this);
			if(a) return {type:SPACE, 		text:a};

			a = comment(this);
			if(a) return {type:COMMENT, 	text:a};

			a = identifier(this);
			if(a) return {type:IDENTIFIER, 	text:a};

			a = bracket(this);
			if(a) return {type:BRACKET, 	text:a};
			
			a = colon(this);
			if(a) return {type:COLON, 		text:a};

			a = semicolon(this);
			if(a) return {type:SEMICOLON, 	text:a};

			a = comma(this);
			if(a) return {type:COMMA, 		text:a};
	};


	function isSpace(c){
		if(	c === ' ' 	|| 
			c === '\n'	||
			c === '\t') return true;
	};


	function space(lex){
		if(isSpace(lex.c)) return lex.consume();
	}


	function comment(lex){
		var c 	= lex.c;
		var c1 	= lex.lookahead(1);
		var comment = '';

		if(c == '/' && c1 == '*') {
			comment += lex.consume();
			c = lex.c;
			while(c && c != '/') {
				comment += lex.consume();
				c = lex.c;
			}
			comment += lex.consume();
		}

		return comment;
	}


	function identifier(lex){

		var c = lex.c;
		var code = c.charCodeAt();

		var result = '';

		while(	c == '.' || c == '#' || c =='-' || c == '%' ||
				(code >= 48 && code <= 57)	||	/*0-9*/ 
				(code >= 65 && code <= 90 ) || 	/*A-Z*/
				(code >= 97 && code <= 122) 	/*a-z*/ ){
			
			result += lex.consume();

			c = lex.c;
			code = c.charCodeAt();
			
		}

		return result;
	}
	
	function bracket(lex){
		if(lex.c == '{') return lex.consume();
		if(lex.c == '}') return lex.consume();
		if(lex.c == '(') return lex.consume();
		if(lex.c == ')') return lex.consume();
	}

	function colon(lex){
		if(lex.c == ':') return lex.consume();
	}

	function semicolon(lex){
		if(lex.c == ';') return lex.consume();
	}

	function comma(lex){
		if(lex.c == ',') return lex.consume();	
	}




	function parse(input){

		var lexer = new CSSLexer(input);
		var token = null;
		
		while(token = lexer.getNextToken()){
			
			//skep while space
			if(token.type == SPACE) 	continue;
			if(token.type == COMMENT)	continue;


			if(token.type == IDENTIFIER) { selector(lexer);}

			_.debug.log(token.type);
		}

	}


	function selector(parser){



	}



	return function(filePath){
			_.HttpRequest.get({
			url:filePath,
			onok:function(result){
				parse(result.text);
			}
		});	
	};

}();