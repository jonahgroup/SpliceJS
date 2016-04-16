global.sjs.module({
required:[
  {Inheritance:'/{sjshome}/modules/splice.inheritance.js'},
  {Events:'/{sjshome}/modules/splice.event.js'}
]
,
definition:function(scope){
    "use strict";
    var
        log = scope.sjs.log
    ,   imports = scope.imports
    ;

  var
        Class = imports.Inheritance.Class
  ,     Interface = imports.Inheritance.Interface
  ,     Events = imports.Events
  ;

    var EXCEPTIONS  = {
        invalidSourceProperty : 'Invalid source property',
        invalidPath           :	'Reference data-item path is not specified',
        invalidPathDepth      :	'Ivalid DataItem path',
        invalidDeleteOperation:	'Invalid delete operation, on an object'
    }

    /*
        ------------------------------------------------------------------------------
        IDataContract interface
    */

        var IDataContract = new Interface({
           IDataContract:{
               onDataItemChanged:function(){},
               onDataIn:function(){}
           }
        });




    /*
        ------------------------------------------------------------------------------
        DataItem class
    */
    var DataItem = function DataItem(data){
        this.source = data;
        this.parent = null;
        this.pathmap = Object.create(null);
        this._change = 0;

        Events.attach(this,{
          onChange:Events.MulticastEvent
        });

        //linked data items
        if(data instanceof DataItem){
          this.subscribe(data.onChange,data);
        }
    };

    DataItem.prototype.getValue = function(){
        if(this._state == 'd' || this.source == null ) return null;
        if(this._path == null) return this.source;
        return this.source[this._path];
    };

    /*
        setValue must not access arbitrary object keys
        rework add ArrayDataItem
    */
    /*
        todo: ???  create separate events for new, unpdated, deleted
        this enable observers to track specific changes separately
    */
    DataItem.prototype.setValue = function(value){
        /*
          set initial value, nothing to bubble
          this is a new value
        */
        if(this.source == null) {
          this.source = value;
          _triggerOnChange.call(this);
          return;
        }//throw EXCEPTIONS.invalidSourceProperty + ' ' +this.source;

        if(typeof this.source != 'object') {
            this.old = source;
            this.source = value;
            this._path = null;
            return this;
        }

        if(this._path == null) throw EXCEPTIONS.invalidPath + ' ' + this._path;

        //same current value
        if(this.source[this._path] === value) return this;

        //old is only the original value
        if(!this._updated){
            this.old = this.source[this._path];
            //do not log repreated change
            _bubbleChange(this,0,1,0);
        }

        // set value
        this.source[this._path] = value;

        if(this.source[this._path] == this.old){
            _bubbleChange(this,0,-1,0);
        }

        /*
            indicates the version number
            helps observers stay on track
        */
        _bubbleChangeCount(this);


        _triggerOnChange.call(this);
        return this;
    };

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
  	DataItem.prototype.changes = function(version,onNew, onUpdated, onDeleted){
  		var keys = Object.keys(this.pathmap);
  		for(var key in keys){
            var item = this.pathmap[keys[key]];
  			if(item._updated){
                onUpdated(item);
                continue;
            }
            if(item._new){
                onNew(item);
                continue;
            }
            if(item._c_deleted){
  				onDeleted(item);
                continue;
            }
  		}
  	};

    //traverse path map and output changes
    DataItem.prototype.changePath = function(onItem){
        var list = [];
        _pathWalker(this,list,'');
       for(var i in list){
           onItem(list[i]);
       }
    };


  	DataItem.prototype.subscribe = function(handler, instance){
      var node = this;
      if(node.onChange) {
        node.onChange.subscribe(handler,instance);
      }

    	// var node = this;
  		// while(node != null){
  		// 	if(node.onChanged) {
  		// 		node.onChanged.subscribe(handler,instance);
  		// 		break;
  		// 	}
  		// 	node = node.parent;
  		// }

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

    //hidden methods
    function _pathWalker(root,list,start){
        if(!root) {
           if(start) list.push(start);
           return;
        }

        if(Object.keys(root.pathmap).length == 0) list.push(start);
        var sep = start?'.':'';

        for(var key in root.pathmap){
            var item = root.pathmap[key];
            if( !item._c_updated && !item._c_new && !item._c_deleted &&
                !item._updated && !item._deleted && !item._new ) continue;
            start = start+sep+ key;
            _pathWalker(root.pathmap[key],list,start);
            start = '';
        }
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


    /**
     * _n - new
     * _u - update
     * _d - delete
    */
  	function _setChangeState(dataItem, _n, _u, _d){
  		if(!dataItem) return dataItem;
        if(!dataItem._updated) dataItem._updated = 0;
  		dataItem._updated+=_u;
  		return dataItem;
  	};

    function _setChildChangeState(dataItem, _n, _u, _d){
  		if(!dataItem) return dataItem;
        if(!dataItem._c_updated) dataItem._c_updated = 0;
  		dataItem._c_updated+=_u;
  		return dataItem;
  	};

  	function _bubbleChange(dataItem,_n,_u,_d){
  		var p = _setChangeState(dataItem,_n,_u,_d);
  		while(p = _setChildChangeState(p.parent,_n,_u,_d));
  	};

    function _bubbleChangeCount(dataItem){
      var p = dataItem;
      p._change++;
      while(p = p.parent){
        p._change++;
      }
    };

  	function _triggerOnChange(){
  		var node = this;
  		while(node != null){
  			if(node.onChange) {
  				node.onChange(this);
  				//break;
  			}
  			node = node.parent;
  		}
  	};





/*
    -----------------------------------------------------------------------------
    Fully synchronized data-item map
*/


    function DataItem2(data,path){
        if(data instanceof DataItem2) {
            this.parent = data;
            this.root = data.root;
        }
        else {
            this.source = data;
            this.root = this;
        }
        if(path) this._path = path;
    }

    DataItem2.prototype.path = function(path){
         return _path2(this,path);
    }

    DataItem2.prototype.getValue = function(){
        var p = this;
        var path = [];
        while(p.parent){
            path.push(p._path);
            p = p.parent;
        }
        _getValue(p,path);
    }

    function _grabPath(child){

    }

    function _getValue(p,path){
        var i = path.length-1;
        var source = p.source;
        while(i-- >= 0) {
            source = source[path[i]];
        }
        return source;
    }


    function _path2(dataItem, path){
      if(path == null || path === '') return dataItem;

      var root = dataItem.root;


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





    scope.exports(
        {IDataContract : IDataContract},
        DataItem, ArrayDataItem, DataItem2
    );

}})
