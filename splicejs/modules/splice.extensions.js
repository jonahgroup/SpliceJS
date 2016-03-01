sjs.module({
required:[],
definition:function(){
  function functionName(foo){
    if(foo.name) return foo.name;
    var _fNameRegex = /function\s+([A-Za-z_\$][A-Za-z0-9_\$]*)\(/ig;

    if(typeof foo != 'function') throw 'Unable to obtain function name, argument is not a function'

    var functionString = foo.toString();
    var match = _fNameRegex.exec(functionString);

    if(!match)  return 'anonymous';
    return match[1];
  }
}
});
