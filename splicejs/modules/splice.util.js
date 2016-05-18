sjs.module({
definition:function(sjs){


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



sjs.exports({
  Text:{
    join:join
  }
});


}
});
