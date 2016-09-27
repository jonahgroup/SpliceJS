$js.module({
imports:[
  { Inheritance : '/{$jshome}/modules/splice.inheritance.js'},
  { Sync      : '/{$jshome}/modules/splice.async.js'}
],
definition:function(){
    "use strict";

    var scope = this;
    var sjs = scope.imports.$js;
    var 
        fname = sjs.fname
    ,   imports = scope.imports
    ,   mixin = sjs.mixin
    ,   log = sjs.log
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
      var _closure = {subs:[]};
      var f = function MulticastEvent(){
        _multicastRun.apply(_closure,arguments);
      };
      f.subscribe = function(callback,instance){
        if(callback == f) throw 'Recursive event subscription on ' + fname(instance.constructor) + ' "' + fname(callback)+'"';
        return _multicastSubscribe.call(f,_closure,callback,instance);
      };
      f.unsubscribe = function(callback){
        return _multicastUnsubscribe.call(f,_closure,callback);
      };
      f.dispose = function(){
        return _multicastDispose(_closure);
      };
      f.subscribers = function(){
        return _closure.subs.length;  
      };
      return f;
    }

    function _multicastSubscribe(_closure,callback,instance){
      if(!instance) instance = this.__sjs_owner__;
      var sub = new Subscription(instance,callback);
      _closure.subs.push(sub);
      return sub;
    }

    function _multicastUnsubscribe(_closure,callback){
      if(!_closure.subs) return;
      var subs = _closure.subs;
      for(var i = subs.length-1; i >= 0; i--){
        
        if( subs[i] == callback || subs[i].callback == callback) { 
          subs.splice(i,1);
          return; 
        }
      }
    }

    function _multicastDispose(_closure){
      _closure.subs = [];
    }

    function _multicastRun(){
      if(!this.subs) return;
      var callbacks = this.subs;

      for(var key in callbacks){
        if(callbacks[key].isDisabled === true) continue;
        callbacks[key].callback.apply(callbacks[key].instance,arguments);
      }
    }



    /**
      Unicast event
    */
    function _createUnicastEvent(){
      var _closure = {subs:[]};
      var f = function UnicastEvent(){
        _unicastRun.apply(_closure,arguments);
      };
      f.subscribe = function(callback,instance){
        return _unicastSubscribe.call(f,_closure,callback,instance);
      };
      f.dispose = function(){
        _closure.subs = [];
      };
      f.unsubscribe = function(callback){
        if(_closure.subs[0] === callback || _closure.subs[0].callback === callback)
          _closure.subs = [];
      };
      f.subscribers = function(){
        return _closure.subs.length;  
      };
      return f;
    }

    function _unicastSubscribe(_closure,callback,instance){
      if(!instance) instance = this.__sjs_owner__;
      _closure.subs[0] = new Subscription(instance,callback);
      return _closure.subs[0];
    }

    function _unicastRun(){
      if(!this.subs[0]) return;
      //do not run disabled subscriptions
      if(this.subs[0].isDisabled === true) return;
      this.subs[0].callback.apply(this.subs[0].instance,arguments);
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
