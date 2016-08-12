//node.js plug
sjs.module({
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
        var instance = {}
        ,   m0 = 0
        ,   m1 = 0
        ,   u0 = 0;

        var x = event.attach(instance,{
          onBroadcast :event.MulticastEvent,
          onNotify    :event.UnicastEvent
        });

        //MulticastEvent subscription
        var s1 = x.onBroadcast.subscribe(function(e){
          m0+=e;
        });
        var s3 = x.onBroadcast.subscribe(function(e){
          m1+=e;
        });
        var s2  = x.onNotify.subscribe(function(e){
          u0+=e;
        });

        //testing multicast event
        log.info('Testing MulticastEvent');
        
        if(instance.onBroadcast.subscribers() != 2)
          throw "Failed subscriber count";
        log.info('  subscriber count - Ok(' +  instance.onBroadcast.subscribers() +')');


        instance.onBroadcast(1);
        if(m0 !== 1) throw 'Failed';
        if(m1 !== 1) throw 'Failed';
        log.info('  argument passing - Ok');

        
        s1.disable();
        instance.onBroadcast(1);
        if(m0 !== 1) throw 'Failed';
        if(m1 !== 2) throw 'Failed';
        s1.enable();
        instance.onBroadcast(1);
        if(m0 !== 2) throw 'Failed';
        if(m1 !== 3) throw 'Failed';
        log.info('  handler suspension - Ok');

        instance.onBroadcast.unsubscribe(s1);
        instance.onBroadcast(1);
        if(m0 !== 2) throw 'Failed';
        if(m1 !== 4) throw 'Failed';
        log.info('  unsubscribe - Ok');

        instance.onBroadcast(-1);
        instance.onBroadcast.dispose();
        instance.onBroadcast(1);
        if(m0 !== 2) throw 'Failed';
        if(m1 !== 3) throw 'Failed';
        log.info('  dispose - Ok');

        //testing UnicastEvent
        log.info('Testing UnicastEvent');

        if(instance.onNotify.subscribers() != 1)
          throw "Failed subscriber count";
        log.info('  subscriber count - Ok(' +  instance.onNotify.subscribers() +')');

        instance.onNotify(1);
        if(u0 !== 1) throw 'Failed argument passing';
        log.info('  argument passing - Ok');
                
        s2.disable();
        instance.onNotify(1);
        if(u0 !== 1) throw 'Failed suspension';
        s2.enable();
        instance.onNotify(1);
        if(u0 !== 2) throw 'Failed';
        log.info('  handler suspension - Ok');
        
        
        instance.onNotify.unsubscribe(s2);
        if(instance.onNotify.subscribers() !== 0)
          throw 'Failed unsubscribed'
        log.info('  unsubscribe - Ok');
        

        instance.onNotify.dispose();
        instance.onNotify(1);
        if(u0 !== 2) throw 'Failed';
        log.info('  dispose - Ok');

        //if(1) throw 'Fail';

        log.info('Pass');
    }

    Test_EventsTest();

    scope.exports(
      Test_EventsTest
    );

}})
