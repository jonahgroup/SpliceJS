sjs({
  definition:function(sjs){

    console.log('Performance testings');


    var div = document.createElement('div');
    div.innerHTML = 'test1';


    var div2 = document.createElement('div');
    var txt = document.createTextNode('test2');
    div2.appendChild(txt);


    document.body.appendChild(div);
    document.body.appendChild(div2);


    var fn1 = function(){
      for(var i=0; i<1000; i++){
        div.innerHTML = 'test'+i;
      }
    };

    var fn2 = function(){
      for(var i=0; i<1000; i++){
        txt.nodeValue = 'test'+i;
      }
    };

    function test(){
      var t1 = sjs.timing(fn1);
      var t2 = sjs.timing(fn2);

      console.log('Inner HTML: ' + t1);
      console.log('Text Node: ' + t2);
    }

    return {test:test};
  }
})
