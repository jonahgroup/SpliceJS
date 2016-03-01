sjs.module({
definition:function(){


  	/*
  		Inheritance model
  	*/

  		function __super(inst,b,args){
  			if(!b) return;
  			__super(inst,b.constructor.__sjs_base__,args);
  			b.constructor.apply(inst,args);
  		};

  		function __invoke(inst,method,b,args){
  			if(!b) return;
  			__invoke(inst,method,b.constructor.__sjs_base__,args);
  			var method = b.constructor.prototype[method];
  			method.apply(inst,args);
  		}

  		/**
  			@param {prototype} p
  		*/
  		function _inheritance_map(p){
  			var map = Object.create(null);

  			while(p) {
  				var keys = Object.keys(p);
  				for(var i=0; i<keys.length; i++){
  					var key = keys[i];
  					if(map[key]) continue;
  					map[key] = (function(){
  						this.proto[this.key].apply(this.instance,arguments);
  					}).bind({instance:this,proto:p,key:key});
  				}

  				p = p.constructor.__sjs_base__;
  			}

  			return map;
  		};

  		/**
  		 * pseudo class wrapper
  		 * */
  		 function Class(_class){
  			if(!_class) throw 'constructor function may not be empty';
  			if(typeof(_class) !== 'function' ) throw 'Constructor must be a function';

  			_class.extend = function(base){
  				this.prototype = Object.create(base.prototype);
  				this.prototype.constructor = this;
  				/*
  					we will need to invoke base prototypes methods thus
  					constructor's base is a prototype
  				*/
  				this.__sjs_base__ = base.prototype;

  				this.prototype.super = function(){
  					/*
  						ensure super constructor is invoked only once
  						attach super prototype methods
  					*/
  					this.super = function(){};

  					__super(this,_class.__sjs_base__, arguments);
  					this.super = function(__class){
  						if(!(this instanceof __class))
  							throw 'Invalid super class "' + getFunctionName(__class) + '" of class "' + getFunctionName(_class) + '"' ;
  						return _inheritance_map.call(this,__class.prototype);
  					}
  				}

  				return this;
  			}

  			return _class;
  		};



}
});
