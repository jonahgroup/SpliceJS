$js.module({
definition:function(scope){
  "use strict";
  var scope = this;

  var sjs = scope.imports.$js;

function fileExt(f){
	return f.substring(f.lastIndexOf('.'));
}

function mixin(_t, _s){
	if(!_s) return _t;
	var keys = Object.keys(_s);
	if(	_s == window || _s == document ||
			_t == window || _t == document
			){
		log.error("Invalid object access " + _s.toString());
		return _t;
	}
	for(var key in keys){
		var p = _s[keys[key]];
		_t[keys[key]] = p;
	}
	return _t;
}

function trim(s){if(!s) return s;
	if(String.prototype.trim) return s.trim();
	return s.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
}

function fname(foo){
	/*
	-- support regular expression only
	because MS Edge browser does not support the name property
	if(foo.name != null) {
		if(foo.name) return foo.name;
		return 'anonymous';
	}
	*/
if(typeof foo != 'function') throw 'unable to obtain function name, argument is not a function'
var match = /function(\s*[A-Za-z0-9_\$]*)\(/.exec(foo.toString());
if(!match)  return 'anonymous';
	var name = trim(match[1]);
	if(!name) return 'anonymous';
	return name;
}


function join(separator, collection, start){
  if(start == null) start = 0;
  if(start > collection.length - 1) return null;
  var result = '', s = '';

  for(var i = start; i < collection.length; i++ ){
    result += (s + collection[i]);
    s = separator;
  }
  return result;
}

//logging setup
var log = !window.console ? {} : window.console;
//console log interface
if(!log.error) 	log.error = function(){};
if(!log.debug) 	log.debug = function(){};
if(!log.info) 	log.info  = function(){};
if(!log.warn) 	log.warn = function(){};
if(!log.log) 	log.log = function(){};

scope.exports({
  log,mixin,fname,
  Text:{
    join:join, trim:trim
  }, 
  File:{
    ext:fileExt
  }
});


}
});
