//node.js plug
global.sjs.module({
required:[
  {'Event':'/{sjshome}/modules/splice.event.js'}
],
definition:function(scope){
    "use strict";
    var log = scope.sjs.log
    ,   event = scope.imports.Event;
    ;

    var orders = [
      {id:1, desc:'Sample order', items:[{id:24, name:'note book', qty:1}]},
      {id:2, desc:'Sample order', items:[{id:7, name:'pencil', qty:3}]}
    ];

    function Test_EventsTest(){
        var instance = {};

        var x = event.attach(instance,{
          onBroadcast :event.MulticastEvent,
          onNotify    :event.UnicastEvent
        });

        var s1 = x.onBroadcast.subscribe(function(e){
          log.info("Subscriber 0:" + e);
        });
        
        var s2  = x.onNotify.subscribe(function(e){
          log.info("Subscriber 1:" + e);
        });
        
        var s3 = x.onBroadcast.subscribe(function(e){
          log.info("Subscriber 2:" + e);
        });

        s2.disable();

        instance.onNotify("this is a test");
        instance.onBroadcast("this is a broadcast");
    }

    Test_EventsTest();

    scope.exports(
      Test_EventsTest
    );

}})
