$js.module({
imports:[
  { Inheritance : '/{$jshome}/modules/splice.inheritance.js'},
  // { Document  : '/{$jshome}/modules/splice.document.js'},
  // { Views     : '/{$jshome}/modules/splice.view.js'},
  { Sync      : '/{$jshome}/modules/splice.async.js'}
],
definition:function(scope){
    "use strict";
    var
      sjs = scope.sjs
    , fname = scope.sjs.fname
    , imports = scope.imports
    , mixin = scope.sjs.mixin
    ;

    var
      Class = imports.Inheritance.Class
    ;

  	function mousePosition(e){
          //http://www.quirksmode.org/js/events_properties.html#position
  		var posx = 0
  		,   posy = 0;

  		if (e.pageX || e.pageY) 	{
  			posx = e.pageX;
  			posy = e.pageY;
  		}
  		else if (e.clientX || e.clientY) 	{
  			posx = e.clientX + document.body.scrollLeft
  				+ document.documentElement.scrollLeft;
  			posy = e.clientY + document.body.scrollTop
  				+ document.documentElement.scrollTop;
  		}

  		return {x:posx,y:posy};
  	};

  	function domEventArgs(e){
  		return {
  			mouse: mousePosition(e),
  		  source: e.srcElement,
        domEvent:e,     // source event
  			cancel: function(){
              	this.cancelled = true;
              	e.__jsj_cancelled = true;
              }
  		}
  	};








  	/**
  		@param {object} instance - target object instance to
  		receive event configuration
  	*/
  	function Event(instance){
  		if(!(this instanceof Event))
  		return {
  			attach:function(configuration){
  				var keys = Object.keys(configuration);
  				for(var i=0; i<keys.length; i++){
  					var evt = configuration[keys[i]];
  					if(!(evt instanceof Event) ) continue;
  					evt.attach(instance, keys[i]);
  				}
  				return instance;
  			}
  		}

  		this.eventType = 'multicast';
  		this.isStop = false;
  	};

  	Event.prototype.transform = function(fn){
  		var e = mixin(new Event(),this);
  		e.transformer = fn;
  		return e;
  	};

  	Event.prototype.stop = function(fn){
  		var e = new Event();
  		e.transformer = fn;
  		e.isStop = true;
  		return e;
  	};



    Event.prototype.attach = function(o,p){
      var e = null;
      if(this._type == 'multicast'){
        e = _createMulticastEvent();
      } else {
        e = _createUnicastEvent();
      }
      if(!e) return;
      return _attachEvent(o,p,e);
    }



  	Event.prototype.attach__ = function(object, property, cancelBubble){

  		var callbacks = [[]], instances = [[]];
  		var cleanup = {fn:null, instance:null };
  		var transformer = this.transformer;

  		cancelBubble = this.isStop;

  		var MulticastEvent = function MulticastEvent(){
  			var idx = callbacks.length-1;

  			/*
  				Grab callbacks and instance reference
  				stacks may be popped during handler execution
  				by another handler that subscribed to the currently
  				bubbling event inside an already invoked event handler
  			*/
  			var cbak = callbacks[idx]
  			,	inst = instances[idx]
  			,	eventBreak = false
  			,	callback_result = null;


  			// nothing to do here, callback array is empty
  			if(!cbak || cbak.length <=0 ) return;


  			for(var i=0; i < cbak.length; i++) {
  				/*check if event was cancelled and stop handing */
  				if(arguments.length > 0 && arguments[0])
  				if(arguments[0].cancelled || (arguments[0].e &&
  				   							  arguments[0].e.__jsj_cancelled == true)) {

  					eventBreak = true;
  					break;
  				}

  				//invocation parameters
  				var _args = arguments;
  				var _callback = cbak[i].callback;
  				var _inst = inst[i];

  				if(MulticastEvent.argumentFilter) {
  					if(!MulticastEvent.argumentFilter.apply(_inst, _args)) return;
  				}

  				//pass arguments without transformation
  				if(!transformer) {
  					if(cbak[i].is_async) {
  						setTimeout(function(){_callback.apply(_inst, _args);},1);
  					}
  					else
  						callback_result = _callback.apply(_inst, _args);
  				}
  				else {
  					if(cbak[i].is_async) {
  						setTimeout(function(){_callback.call(_inst, transformer.apply(_inst,_args));},1)
  					}
  					else
  						callback_result = _callback.call(_inst, transformer.apply(_inst,_args));
  				}
  			}

  			if(!eventBreak && typeof cleanup.fn === 'function') {
  				cleanup.fn.call(cleanup.instance, MulticastEvent );
  				cleanup.fn 		 = null;
  				cleanup.instance = null;
  			}

  			return callback_result;
  		}

  		MulticastEvent.__sjs_event__ = true;

  		/*
  			"This" keyword migrates between assigments
  			important to preserve the original instance
  		*/
  		MulticastEvent.subscribe = function(callback, instance){
  			if(!callback) return;
  			if(typeof callback !== 'function') throw 'Event subscriber must be a function';

  			if(!instance) instance = this;

  			var idx = callbacks.length-1;

  			for(var i=0; i<callbacks[idx].length; i++){
  				if( callbacks[idx][i].callback === callback &&
  					  instances[idx][i] === instance
  				) return object;
  			}

  			callbacks[idx].push({callback:callback,is_async:false});
  			instances[idx].push(instance);
  			return object;
  		};

  		MulticastEvent.subscribeAsync = function(callback,instance){
  			if(!callback) return;
  			if(typeof callback !== 'function') throw 'Event subscriber must be a function';

  			if(!instance) instance = this;

  			var idx = callbacks.length-1;

  			callbacks[idx].push({callback:callback,is_async:true});
  			instances[idx].push(instance);
  			return this;
  		};

  		MulticastEvent.unsubscribe = function(callback){
  			var idx = callbacks.length-1;
  			for(var i=0; i < callbacks[idx].length; i++) {
  				if( callbacks[idx][i].callback == callback ) {
  					logging.debug.log('unsubscribing...');
  					callbacks[idx].splice(i,1);
  					instances[idx].splice(i,1);
  					break;
  				}
  			}
  		};

  		MulticastEvent.push = function(){
  			callbacks.push([]);
  			instances.push([]);
  			return this;
  		};

  		MulticastEvent.pop = function(){
  			if(callbacks.length == 1) return;
  			callbacks.pop();
  			instances.pop();
  			return this;
  		};

  		MulticastEvent.cleanup = function(callback, instance){
  			cleanup.fn 		 = callback;
  			cleanup.instance = instance;
  			return this;
  		};

  		MulticastEvent.purge = function(){
  			for(var i=0; i<callbacks.length; i++) {
  				callbacks.splice(0,1);
  				instances.splice(0,1);
  			}
  		};
  		MulticastEvent.__sjs_event_name__ = property;

  		if(!object || !property) return MulticastEvent;

  		/* handle object and property arguments */
  		var val = object[property];

  		if(val && val.__sjs_event__) return val;

  		if(typeof val ===  'function') {
  			MulticastEvent.subscribe(val, object);
  		}

  		/*
  			if target object is a dom element
  			collect event arguments
  		*/
  		if(doc.isHTMLElement(object) || object === window) {
  			/*
  				wrap DOM event
  			*/
  			object[property] = function(e){

  				if(!e) e = window.event;
  				if(cancelBubble) {
  					e.cancelBubble = true;
  					if (e.stopPropagation) e.stopPropagation();
  				}
  				setTimeout((function(){
  					MulticastEvent(this);
  				}).bind(domEventArgs(e)),1);
  			};
  			object[property].__sjs_event__ = true;

  			// expose subscribe method
  			object[property].subscribe = function(){
  				MulticastEvent.subscribe.apply(MulticastEvent,arguments);
  			}

  		} else if(object instanceof View){
  			object[property] = MulticastEvent;

  			object.htmlElement[property] = (function(e){
  				if(!e) e = window.event;
  				if(cancelBubble){
  					e.cancelBubble = true;
  					if (e.stopPropagation) e.stopPropagation();
  				}
  				var eventArgs = domEventArgs(e);
  				eventArgs.view = object;
  				setTimeout((function(){
  					this.fn(this.args);
  				}).bind({fn:this[property], args:eventArgs}),1);
  				//this[property](eventArgs);
  			}).bind(object);
  		}
  		else {

  			object[property] = MulticastEvent;

  		}
  		return MulticastEvent;

  	};


    /*
        ------------------------------------------------------------------------------
        Static functions
    */

    Event.multicast = (function(){
      var e = new Event();
      e._type= 'multicast';

      e.stop = mixin(new Event(),e);
      e.stop.isStop = true;

      return e;
    })();

    Event.unicast = (function(){
      var e = new Event();
      e._type= 'unicast';

      e.stop = mixin(new Event(),e);
      e.stop.isStop = true;

      return e;
    })();




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
        return _multicastSubscribe.call(fnE,_closure,callback,instance);
      }
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
      var callbacks = this.callbacks[this.idx];
      for(var key in callbacks){
        callbacks[key][0].apply(callbacks[key][0],arguments);
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
        { 'event':Event,
          attach:_attach,
          createMulticastRunner: _createUnicastEvent,
          createUnicastRunner:_createUnicastEvent,
          MulticastEvent:new MulticastEvent(),
          UnicastEvent:new UnicastEvent()
        }
    );
}
});
