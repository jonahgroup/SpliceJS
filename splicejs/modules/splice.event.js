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
      fnE.unsubscribe = function(fn){
        //log.error('Multicast event unsubsribe is not implemented');
      };
      return fnE;
    }

    function _multicastSubscribe(_closure,callback,instance){
      if(!instance) instance = this.__sjs_owner__;
      if(!_closure.callbacks) _closure.callbacks = [[]];

      var callbacks = _closure.callbacks[_closure.idx];
      callbacks.push([callback, instance]);

      return this.__sjs_owner__;
    }

    function _multicastRun(){
      if(!this.callbacks) return;
      var callbacks = this.callbacks[this.idx];

      for(var key in callbacks){
        callbacks[key][0].apply(callbacks[key][1],arguments);
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
      _closure[0] = [callback, instance];
      return this.__sjs_owner__;
    }

    function _unicastRun(){
      this[0][0].apply(this[0][1],arguments);
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
