var CSSParser = function(){

	var SPACE = 'SPACE', COMMENT = 'COMMENT', IDENTIFIER = 'IDENTIFIER', 
		OPEN_BRACKET = 'OPEN_BRACKET', CLOSE_BRACKET = 'CLOSE_BRACKET',
		OPEN_BRACE = 'OPEN_BRACE', CLOSE_BRACE='CLOSE_BRACE',
		OPEN_PARENTHESIS = 'OPEN_PARENTHESIS', CLOSE_PARENTHESIS='CLOSE_PARENTHESIS',
		COLON = 'COLON', SEMICOLON = 'SEMICOLON', COMMA = 'COMMA';

	var SELECTOR = 1, OPENSCOPE = 2, CLOSESCOPE = 3, RULE = 4;	

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
			if(a) return a;

			if(a = comment(this)) 		return a;
			
			if(a = identifier(this)) 	return a;

			if(a = bracket(this)) 		return a;

			if(a = brace(this)) 		return a;

			if(a = parenthesis(this)) 	return a;
			
			if(a = colon(this)) 		return a;

			if(a = semicolon(this)) 	return a;

			if(a = comma(this)) 		return a;

	};


	function isSpace(c){
		if(	c === ' ' 	|| 
			c === '\n'	||
			c === '\t') return true;
	};


	function space(lex){
		if(isSpace(lex.c)) return [SPACE, lex.consume()];
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
		if(!comment || comment == '') return null;
		return [COMMENT, comment];
	}


	function identifier(lex){

		var c = lex.c;
		var code = c.charCodeAt();

		var result = '';

		while(	c == '.' || c == '#' || c =='-'  || 
				c == '%' || c == '*' ||
				(code >= 48 && code <= 57)	||	/*0-9*/ 
				(code >= 65 && code <= 90 ) || 	/*A-Z*/
				(code >= 97 && code <= 122) 	/*a-z*/ ){
			
			result += lex.consume();

			c = lex.c;
			code = c.charCodeAt();
			
		}

		if(!result || result == '') return null;
		return [IDENTIFIER, result];
	}
	
	function bracket(lex){
		if(lex.c == '[') return [OPEN_BRACKET,  lex.consume()];
		if(lex.c == ']') return [CLOSE_BRACKET, lex.consume()];
	}

	function brace(lex){
		if(lex.c == '{') return [OPEN_BRACE,  lex.consume()];
		if(lex.c == '}') return [CLOSE_BRACE, lex.consume()];
	}

	function parenthesis(lex) {
		if(lex.c == '(') return [OPEN_PARENTHESIS, lex.consume()];
		if(lex.c == ')') return [CLOSE_PARENTHESIS,lex.consume()];
	}

	function colon(lex){
		if(lex.c == ':') return [COLON, lex.consume()];
	}

	function semicolon(lex){
		if(lex.c == ';') return [SEMICOLON, lex.consume()];
	}

	function comma(lex){
		if(lex.c == ',') return [COMMA, lex.consume()];	
	}



	
	var CSSParser = function(input){

		this.lexer =  new CSSLexer(input);
		this.consume();

	}

	CSSParser.prototype.consume = function(){
	
		var token = this.token;
		var t = this.lexer.getNextToken();
		
		if(!t) { this.token = null; return token; }

		if(t[0] == COMMENT) this.consume(); //skip comments
		this.token = {type:t[0], text:t[1]};

		return token;
	}


	CSSParser.prototype.nextStatement = function(){

		if(!this.token) return null;

		whitespace(this);
		
		var sel =  selector(this);
				   this.match(OPEN_BRACE);  this.consume();
		var rul =  rules(this);
				   this.match(CLOSE_BRACE); this.consume();

		if(!sel || !rul) return null;		   

		return {selector:sel, rules:rul};
	}

	CSSParser.prototype.match = function(type){
		if(!this.token) return;

		for(var i=0; i<arguments.length; i++){
			if(this.token.type == arguments[i]) return;
		}
		
		throw 'Invalid syntax';
	}


	function whitespace(parser){
		if(!parser.token) return;
		while( parser.token &&	(
				parser.token.type == SPACE || 
				parser.token.type == COMMENT)
			) parser.consume();
	}


	function selector(parser){
		if(!parser.token) return null;
		var text = '';
		while(parser.token.type == IDENTIFIER) {
			text += parser.consume().text; 
			parser.match(SPACE, OPEN_BRACE, COLON);
			
			if(parser.token.type == COLON) {
				text += parser.consume().text;
				parser.match(IDENTIFIER);
				continue;
			}

			if(parser.token.type == SPACE) {
				text += parser.consume().text;
				whitespace(parser);
			}

		}
		return text;
	};


	function rule(parser){
		if(!parser.token) return;

		whitespace(parser);

		var r = '';
		parser.match(IDENTIFIER);
			r += parser.consume().text;
		whitespace(parser);
		parser.match(COLON);
			r += parser.consume().text;
		whitespace(parser);
		parser.match(IDENTIFIER);
		
		while(parser.token.type == IDENTIFIER || 
		      parser.token.type == SPACE) {
				r += parser.consume().text;

				if(parser.token.type == OPEN_PARENTHESIS){
					r += multivalue(parser);
				}	
		}

		whitespace(parser);

		parser.match(SEMICOLON);
			r += parser.consume().text;

		whitespace(parser);

		return r;
	}

	function multivalue(parser){
		if(!parser.token) return;

		var result = parser.consume().text;
		whitespace(parser);
		while(	parser.token.type == IDENTIFIER || 
				parser.token.type == SPACE ||
				parser.token.type == COMMA ){
			result += parser.consume().text;
		}
		parser.match(CLOSE_PARENTHESIS);
			result += parser.consume().text;

		return result;
	}

	function rules(parser){
		if(!parser.token) return;

		var r = null;
		var result = [];
		while(r = rule(parser)){
			result.push(r);
			if(parser.token.type == CLOSE_BRACE) break;
		}
		whitespace(parser);
		
		return result;
	}


	function parse(input,oncomplete){
		if(!oncomplete || typeof(oncomplete)!= 'function' ) return;

		var parser = new CSSParser(input);
		
		var statement = null, counter = 0, result = [];

		while(statement = parser.nextStatement()){
			result.push(statement);
			counter++;
			if(counter > 100000) break;
			
		}

		oncomplete(result);
	}



	return function(filePath){

		return function(oncomplete){
			if(!oncomplete || typeof(oncomplete)!= 'function' ) return;
			_.HttpRequest.get({
				url:filePath,
				onok:function(result){
					parse(result.text, oncomplete);
				}
			});	
		}
	}; 

}();


function ComposeStyle(rules){

	var r = '';
	for (var i =0; i <  rules.length; i++) {
		r+= ' ' + rules[i];
	};

	return r;
}

function ApplyCSSRules(rules, element){


	for(var i=0; i<rules.length; i++){
		var rule = rules[i];
		var elements = element.querySelectorAll(rule.selector);		


		style = ComposeStyle(rule.rules);

		for (var n = 0; n < elements.length; n++) {
			elements[n].setAttribute('style', style);
		}
		_.debug.log('Getting elements by selector');

	}

	_.debug.log('Working on CSS Rules');
}