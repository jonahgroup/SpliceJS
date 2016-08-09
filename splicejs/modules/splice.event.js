sjs.module({
required:[
  { Inheritance : '/{sjshome}/modules/splice.inheritance.js'},
  { Sync      : '/{sjshome}/modules/splice.async.js'}
],
definition:function(scope){
    "use strict";
    var sjs = scope.sjs
    ,   fname = scope.sjs.fname
    ,   imports = scope.imports
    ,   mixin = scope.sjs.mixin
    ,   log = scope.sjs.log
    ;

    var
      Class = imports.Inheritance.Class
    ;

    function Subscription(instance, callback){
      this.instance = instance;
      this.callback = callback;
    }
    Subscription.prototype = {
      disable:function(){this.isDisabled = true;},
      enable:function(){this.isDisabled = false;}
    };


    /*
        ------------------------------------------------------------------------------

    */
    function BaseEvent(){}
    BaseEvent.prototype.attach = function attach(){
      throw fname(this.constructor) + ' must iplement attach() function';
    };


    /*
        ------------------------------------------------------------------------------
        Events
    */
    var MulticastEvent = Class(function MulticastEvent(){
    }).extend(BaseEvent);

    MulticastEvent.prototype.attach = function(instance, property){
      var event = _createMulticastEvent();
      _attachEvent(instance, property, event);
      return event;
    }


    var UnicastEvent = Class(function UnicastEvent(){
    }).extend(BaseEvent);

    UnicastEvent.prototype.attach = function(instance,property){
      var event = _createUnicastEvent();
      _attachEvent(instance,property,event);
      return event;
    };



    /*
        ------------------------------------------------------------------------------
        Private functions
    */
    /**
    */
    function _attachEvent(o,p,e){
      if(!o || !p) return e;

      var v = o[p];
      if(v && v.__sjs_event__) return v;

      //target property is a function
      if(typeof v === 'function') {
          return e.subscribe(o,v);
      }
      return o[p] = e;
    }



    /*
      Multicast Event
    */

    function _createMulticastEvent(){
      var _closure = {idx:0};
      var fnE = function MulticastEvent(){
        _multicastRun.apply(_closure,arguments);
      };
      fnE.subscribe = function(callback,instance){
        if(callback == fnE) throw 'Recursive event subscription on ' + fname(instance.constructor) + ' "' + fname(callback)+'"';
        return _multicastSubscribe.call(fnE,_closure,callback,instance);
      };
      fnE.unsubscribe = function(callback){
        return _multicastUnsubscribe.call(fnE,_closure,callback);
      };
      return fnE;
    }

    function _multicastSubscribe(_closure,callback,instance){
      if(!instance) instance = this.__sjs_owner__;
      if(!_closure.callbacks) _closure.callbacks = [[]];

      var callbacks = _closure.callbacks[_closure.idx];
      var subs = new Subscription(instance,callback);
      callbacks.push(subs);

      return subs;
    }

    function _multicastUnsubscribe(_closure,callback){
      if(!_closure.callbacks) return;
      var callbacks = _closure.callbacks[_closure.idx];
      for(var i = callbacks.length-1; i >= 0; i--){
        if(callbacks[i][0] == callback) { 
          callbacks.splice(i,1);
          return; 
        }
      }
    }



    function _multicastRun(){
      if(!this.callbacks) return;
      var callbacks = this.callbacks[this.idx];

      for(var key in callbacks){
        if(callbacks[key].isDisabled === true) continue;
        callbacks[key].callback.apply(callbacks[key].instance,arguments);
      }
    }



    /**
      Unicast event
    */
    function _createUnicastEvent(){
      var _closure = [];
      var fnE = function UnicastEvent(){
        _unicastRun.apply(_closure,arguments);
      };
      fnE.subscribe = function(callback,instance){
        return _unicastSubscribe.call(fnE,_closure,callback,instance);
      };
      return fnE;
    }

    function _unicastSubscribe(_closure,callback,instance){
      if(!instance) instance = this.__sjs_owner__;
      _closure[0] = new Subscription(instance,callback);
      return _closure[0];
    }

    function _unicastRun(){
      //do not run disabled subscriptions
      if(this[0].isDisabled === true) return;
      this[0].callback.apply(this[0].instance,arguments);
    }


    /**
    */
    function _attach(instance,events){
      var keys = Object.keys(events);
      for(var key in  keys){
        var evt = events[keys[key]];
        if(!evt) {
          throw 'Invalid event property ' + keys[key] + ':' + evt;
        }
        if(!(evt instanceof BaseEvent) ) {
          throw 'Invalid event property ' + keys[key] + ':' + fname(evt.constructor) + ' does not implement "attach(object, string)" function';
        }
        var e = evt.attach(instance, keys[key]);
        e.__sjs_event__ = true;
        e.__sjs_owner__ = instance;

      }
      return instance;
    }



    /*
        ------------------------------------------------------------------------------
        Exports
    */
    scope.exports(
        BaseEvent,
        { attach:_attach,
          createMulticastRunner: _createMulticastEvent,
          createUnicastRunner:_createUnicastEvent,
          MulticastEvent:new MulticastEvent(),
          UnicastEvent:new UnicastEvent()
        }
    );
}
});
