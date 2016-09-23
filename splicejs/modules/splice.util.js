$js.module({
definition:function(scope){
  "use strict";
  var scope = this;

  var sjs = scope.imports.$js;

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



scope.exports({
  Text:{
    join:join
  }
});


}
});
