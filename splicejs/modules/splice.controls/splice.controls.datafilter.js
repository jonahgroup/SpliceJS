sjs.module({
required:[
  {'SpliceJS.UI':'{sjshome}/modules/splice.ui.js'},
  {'SpliceJS.Controls':'splice.controls.buttons.js'},
  {'SpliceJS.Controls':'splice.controls.listbox.js'},
  {'Doc':'{sjshome}/modules/splice.document.js'},
  'splice.controls.datafilter.html'
],
definition:function component(sjs){
    "use strict";

    var scope = this.scope;

    var Class = sjs.Class
    ,   Controller = sjs.Controller
    ,   Event = sjs.Event;

    var dom = scope.Doc.dom;

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
        this.super();
    }).extend(this.scope.SpliceJS.Controls.ListItemController);

    FilterListItem.prototype.dataIn = function(item){
        this.super.dataIn.call(this,item);

        if(item.isApplied === true) {
          this.select();
        }
    };


    FilterListItem.prototype.select = function(){
      dom(this.elements.root).class.add('selected');
    };



  }
});
