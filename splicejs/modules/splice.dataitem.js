$js.module({
imports:[
  {Inheritance:'/{$jshome}/modules/splice.inheritance.js'},
  {Events:'/{$jshome}/modules/splice.event.js'},
  {Util:'/{$jshome}/modules/splice.util.js'}
]
,
definition:function(){
  "use strict";
  
  var scope = this;
  var $js = scope.imports.$js;

  var
      log = $js.log
  ,   imports = scope.imports
  ;

  var
        Class = imports.Inheritance.Class
  ,     Interface = imports.Inheritance.Interface
  ,     Events = imports.Events
  ,     TextUtil = imports.Util.Text
  ;

    var EXCEPTIONS  = {
        invalidSourceProperty : 'Invalid source property',
        invalidPath           :	'Reference data-item path is not specified',
        invalidPathDepth      :	'Ivalid DataItem path',
        invalidDeleteOperation:	'Invalid delete operation, on an object',
        invalidDelegateSource : 'Unable to create data-item delegate, source is not an instance of DataItem'
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


      //core properties
      this.parent = null;
      this.pathmap = Object.create(null);
      this._change = 0;

      if(data!= null) this.setValue(data);

    };

    DataItem.prototype.getValue = function(){
      var s = _recGetSource(this);
      if(this._path == null) return s;
      return !s ? null : s[this._path];
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
        if(this.parent == null) {
          this.source = value;
          //_triggerOnChange.call(this);
          _notifyDown(this,this);
          return this;
        }//throw EXCEPTIONS.invalidSourceProperty + ' ' +this.source;

        //find data source
        var source = _recGetSource(this);

        //same as current value
        if(source[this._path] === value) return this;

        //old is only the original value
        if(!this._updated){
            this.old = source[this._path];
            //do not log repreated change
            _bubbleChange(this,0,1,0);
        }

        // set value
        source[this._path] = value;

        //pass the change down the tree
        _notifyDown(this,this);

        if(source[this._path] == this.old){
            _bubbleChange(this,0,-1,0);
        }

        /*
            indicates the version number
            helps observers stay on track
        */
        _bubbleChangeCount(this);
        //_triggerOnChange.call(this);
        return this;
    };

  	/**
  		returns child DataItem
      throws exception if path is invalid
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

    /*
      !!! There is not delegation ons subscribe
      Delegator item acts as an event aggregator
    */
  	DataItem.prototype.subscribe = function(handler, instance){
      var node = this;
      //create change event
      Events.attach(this,{
        onChange:Events.MulticastEvent
      }).onChange.subscribe(handler,instance);

      var item = this;
      while(item.parent != null){
        if(!item.parent.eventmap) item.parent.eventmap = Object.create(null);
        item.parent.eventmap[item._path] = item;
        item = item.parent;
      }
    };

    DataItem.prototype.unsubscribe = function(fn){
      if(this.onChange) this.onChange.unsubscribe(fn);
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

    */
    var DelegateDataItem = Class(function DelegateDataItem(delegate){
      //do not invoke super constructor on purpose
      if(!(delegate instanceof DataItem))
        throw EXCEPTIONS.invalidDelegateSource;

        this.base();
        //create change event
        Events.attach(this,{
          onChange:Events.MulticastEvent
        });

        this._delegate = delegate;
        this._delegate.subscribe(this.onChange, this);

    }).extend(DataItem);


    DelegateDataItem.prototype.getValue = function() {
      return this._delegate.getValue();
    };

    DelegateDataItem.prototype.setValue = function(value){
      return this._delegate.setValue(value);
    };

    DelegateDataItem.prototype.path = function(path){
      return _path(this._delegate,path);
    };

    //hidden methods
    function _recGetSource(dataItem, i){
      if(dataItem.parent == null){
        if(dataItem._path) return dataItem.source[dataItem._path];
        return dataItem.source;
      }
      var source = _recGetSource(dataItem.parent,1);
      if(i == null) return source;
      return source[dataItem._path];
    };

    //!!!!! must have circular reference detection implementation
    function _notifyDown(dataItem, source){
      if(dataItem.onChange) dataItem.onChange(dataItem);
      for(var key in dataItem.eventmap){
        _notifyDown(dataItem.eventmap[key],source);
      }
    };

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
      if(!path || path == null || path === '') return dataItem;

      var source = _recGetSource(dataItem,0);
      var parts = path.toString().split('.');

      var parent = dataItem;
      for(var i=0; i < parts.length; i++){

        if(source)
        source = parent._path != null ? source[parent._path] : source;

        /*
          if source is a dataitem handle differently,
          use path lookup
        */
        if(source && source instanceof DataItem) {
          var pt = TextUtil.join('.',parts,i);
          return _path(source, pt);
        }

        var child = parent.pathmap[parts[i]];

/*
        if(source[parts[i]] == undefined) {
          throw EXCEPTIONS.invalidPathDepth + ': ' + sjs.fname(source.constructor) + '.' + path;
        }
*/
        if(child == null /*|| source[parts[i]] == null*/) {
          if(source && source[parts[i]] instanceof Array)
            child = new ArrayDataItem(source);
          else
            child = new DataItem();

          child._path = parts[i];
          parent.pathmap[parts[i]] = child;
          child.parent = parent;

/*
          if(source[parts[i]] == undefined) {
            if(parts.length > 1) throw EXCEPTIONS.invalidPathDepth + ' ' + path;
            return child;
          }
*/
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

    scope.exports(
        {IDataContract : IDataContract},
        DataItem, DelegateDataItem, ArrayDataItem
    );

}})
