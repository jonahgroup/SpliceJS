sjs.module({
prerequisite:[
  '/{sjshome}/modules/splice.module.extensions.js'
],
required:[
  { Inheritance : '/{sjshome}/modules/splice.inheritance.js'},
  { Events      : '/{sjshome}/modules/splice.event.js'},
  { Component		: '/{sjshome}/modules/splice.component.core.js'},
  {'SpliceJS.UI':'/{sjshome}/modules/splice.ui.js'},
  {'SpliceJS.Controls':'splice.controls.buttons.js'},
  {'SpliceJS.Controls':'splice.controls.listbox.js'},
  {'Doc':'/{sjshome}/modules/splice.document.js'},
  'splice.controls.datafilter.html'
]
,
definition:function(scope){
    "use strict";

    var
        sjs = scope.sjs
    ,   imports = scope.imports
    ;

    var Class = imports.Inheritance.Class
    ,   Controller = imports.Component.Controller
    ,   Event = imports.Events.event
    ,   dom = imports.Doc.dom
    ,   ListItemController = imports.SpliceJS.Controls.ListItemController
    ;

  	var FilterList = Class(function FilterListController(){
  		this.filterSet = [];
  	}).extend(Controller);


  	FilterList.prototype.dataIn = function(data){
  			this.onDataInput(data);
  	};

  	FilterList.prototype.filterItem = function(item){
      item.select();
      this.filterSet.push(item.dataItem);
  	};

    FilterList.prototype.ok = function(){
        this.onData(this.filterSet);
    };

  	FilterList.prototype.cancel = function(){
  		this.filterSet = [];
      this.onCancel();
  	};

    //called on Ok
  	FilterList.prototype.onData = Event;
    //called on Cancel
    FilterList.prototype.onCancel = Event;
    FilterList.prototype.onDataInput = Event;



    var FilterListItem = Class(function FilterListItemController(){
        this.base();
    }).extend(ListItemController);

    FilterListItem.prototype.dataIn = function(item){
        ListItemController.prototype.dataIn.call(this,item);

        if(item.isApplied === true) {
          this.select();
        }
    };


    FilterListItem.prototype.select = function(){
      dom(this.elements.root).cl.add('selected');
    };

}
});
