$js.module({
definition:function(){
  
	var scope = this;
	var sjs = scope.imports.$js;
	
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
     * Interface emulator
     * 
    */
    function Interface(_interface){
        this._name = Object.keys(_interface)[0];
        this._interface = _interface[this._name];
    }



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

			this.prototype.base = function(){
			/*
					ensure super constructor is invoked only once
					attach super prototype methods
			*/
			this.base = function(){};

			__super(this,_class.__sjs_base__, arguments);
			this.base = function(__class){
					if(!(this instanceof __class))
						throw 'Invalid super class "' + getFunctionName(__class) + '" of class "' + getFunctionName(_class) + '"' ;
					return _inheritance_map.call(this,__class.prototype);
				}
			}
			return this;
		}
        
        _class.implement = function(_interface){
            if(!(_interface instanceof Interface) ) 
                throw 'Cannot implement: ' + _interface + ' is not instance of Interface';
                
           var keys = Object.keys(_interface._interface);
           for(var key in keys){
               if(!this.prototype[keys[key]]) {
                this.prototype[keys[key]] = new Function('return function '+keys[key]+'(){ throw "function ' + keys[key] +' is not implemented in "+ global.sjs.fname(this.constructor);};')();     
               } else {
                   throw 'Cannot implement '+ _interface._name+': function ' + keys[key] + ' already exists in ' +sjs.fname(this);
               }
           } 
           return this;         
        }
        
        
		return _class;
	};



	scope.exports(
		Class, Interface
	);

}});
