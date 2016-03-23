global.sjs.module({
required:[
  {Inheritance:'/{sjshome}/modules/splice.inheritance.js'}
]
,
definition:function(sjs){
  "use strict";

  var
    exports = sjs.exports
  ;

  var
    Class = this.scope.Inheritance.Class
  ;

  	var EXCEPTIONS  = {
  		invalidSourceProperty : 'Invalid source property',
  		invalidPath :						'Reference data-item path is not specified',
  		invalidPathDepth:				'Ivalid DataItem path',
  		invalidDeleteOperation:	'Invalid delete operation, on an object'
  	}




    //hoisted
    var DataItem = function DataItem(data){
  		this.source = data;
  		this.parent = null;
  		this.pathmap = {};
  	};

  	DataItem.prototype.getValue = function(){
  		if(this._state == 'd' || this.source == null ) return null;
  		if(this._path == null) return this.source;
  		return this.source[this._path];
  	}

    /*
      setValue must not access arbitrary object keys
      rework and ArrayDataItem
    */

  	DataItem.prototype.setValue = function(value){
  		if(this.source == null) throw EXCEPTIONS.invalidSourceProperty + ' ' +this.source;

  		if(typeof this.source != 'object') {
  			this.source = value;
  			this._path = null;
  			return this;
  		}

  		if(this._path == null) throw EXCEPTIONS.invalidPath + ' ' + this._path;

  		var old = this.source[this._path];
  		//same value no change
  		if(old === value) return this;

  		if(!this.source.hasOwnProperty(this._path)){
  			this._isnew = true;
  		}

  		// set value
  		this.source[this._path] = value;

  		_setChangeState(this);
  		_bubbleChange(this);


  		_dataItem_triggerOnChange.call(this, old);
  		return this;
  	}

  	/**
  		returns child DataItem
  	*/
  	DataItem.prototype.path = function(path){
      return _path(this,path);
  	};

  	DataItem.prototype.fullPath = function(){
  		var node = this;
  		var path = '', separator = '';
  		while(node != null){
  			if(node._path != null) {
  				path = node._path + separator + path;
  				separator = '.';
  			}
  			node = node.parent;
  		}
  		return path;
  	};

  	//tranverse path map tree to get change paths at current level
  	DataItem.prototype.changes = function(onItem){
  		var keys = Object.keys(this.pathmap);
  		for(var key in keys){
  			if(this.pathmap[keys[key]]._state)
  				onItem(this.pathmap[keys[key]]);
  		}
  	}

  	DataItem.prototype.subscribe = function(handler, instance){
  		var node = this;
  		while(node != null){
  			if(node.onChanged) {
  				node.onChanged.subscribe(handler,instance);
  				break;
  			}
  			node = node.parent;
  		}
  	};

    /**
      ArrayDataItem
    */
    var ArrayDataItem = Class(function ArrayDataItem(data){
      this.base(data);
      this._length = data.length;
    }).extend(DataItem);

    ArrayDataItem.prototype.remove = function(dataItem){
      if(!(this.source instanceof Array)) throw EXCEPTIONS.invalidDeleteOperation;
      _setChangeState(this,true);
      _bubbleChange(this);
      return this;
    };

    /**
      Virtual Append, adds new element to source array
      initial value is undefined
    */
    ArrayDataItem.prototype.append = function(){
      var d = new DataItem(this.source);
      d._path = this._length++;
      this.pathmap[d._path] = d;
      return d;
    };

    ArrayDataItem.prototype.commit = function(){
    };

    ArrayDataItem.prototype.commit = function(){

    };


    /**
      Module private methods
    */
    function _path(dataItem, path){
      if(path == null || path === '') return dataItem;

      var parts = path.toString().split('.');

      var parent = dataItem;
      for(var i=0; i < parts.length; i++){

        var child = parent.pathmap[parts[i]];
        var ref = parent._path != null?parent.source[parent._path] : parent.source;

        if(ref[parts[i]] == null) throw EXCEPTIONS.invalidPathDepth + ': ' + path;

        if(child == null || ref[parts[i]] == null) {
          if(ref[parts[i]] instanceof Array)
            child = new ArrayDataItem(ref);
          else
            child = new DataItem(ref);

          child._path = parts[i];
          parent.pathmap[parts[i]] = child;
          child.parent = parent;

          if(ref[parts[i]] == null) {
            if(parts.length > 1) throw EXCEPTIONS.invalidPathDepth + ' ' + path;
            return child;
          }
        }
        parent = child;
      }
      return parent;
    }

  	function _setChangeState(dataItem, isDelete){
  		if(!dataItem) return dataItem;
  		if(isDelete === true) {
  			dataItem._state = 'd'; return;
  		}
  		if(dataItem._isnew == true){
  			dataItem._state = 'n'; return;
  		}
  		dataItem._state = 'u';
  		return dataItem;
  	};

  	function _bubbleChange(dataItem){
  		var p = dataItem;
  		while(p = _setChangeState(p.parent));
  	}

  	function _dataItem_triggerOnChange(old){
  		var node = this;
  		while(node != null){
  			if(node.onChanged) {
  				node.onChanged(this, old);
  				break;
  			}
  			node = node.parent;
  		}
  	};

exports.module(
  DataItem, ArrayDataItem
);


}})
