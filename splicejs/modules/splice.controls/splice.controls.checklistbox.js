/*
  CheckListBox control is using templates copied from ListBox control
  While controller inherits from LibBoxController template declaration is
  a !!! copy/paste code !!!!
  Need a way to extend components including templates
*/
sjs.module({
required:[
  { Inheritance : '/{sjshome}/modules/splice.inheritance.js'},
  { Component		: '/{sjshome}/modules/splice.component.core.js'},
  { Events			: '/{sjshome}/modules/splice.event.js'},
  {'SpliceJS.UI':'/{sjshome}/modules/splice.ui.js'},
  {'Doc':'/{sjshome}/modules/splice.document.js'},
  {'SpliceJS.Controls':'splice.controls.scrollpanel.js'},
  {'SpliceJS.Controls':'splice.controls.listbox.js'},
  'splice.controls.checklistbox.css',
  'splice.controls.checklistbox.html'
],
  definition:function component(sjs){

    var scope = this.scope
    , exports = sjs.exports
    ;

    var
      Class = scope.Inheritance.Class
    , event = scope.Events.event
    , proxy = scope.Component.proxy
    , DataItem = scope.SpliceJS.UI.DataItem
    , dom = scope.Doc.dom
    , components = scope.components;
    ;

    var CheckListBoxController = Class(function CheckListBoxController(args){
      this.super(args);
      event(this).attach({
        onSelection : event.multicast
      });
    }).extend(scope.SpliceJS.Controls.ListBoxController);

    /*
      Check list element item
    */
    var CheckListItemController = Class(function CheckListItemController(){
      this.super();
    }).extend(scope.SpliceJS.Controls.ListItemController);

    CheckListItemController.prototype.onDataIn = function(item){
      if(!item) return;
      if(this.itemCheckPath != null){
          this.dataItemCheck = item.path(this.itemCheckPath);
      }
      this.dataContentItem = item;
      if(this.itemContentPath != null) {
        this.dataContentItem = item.path(this.itemContentPath);
      }
      this.views.root.replace(this.dataContentItem.getValue());
      _check.call(this);
      this.onDataOut(item);
    };

    CheckListItemController.prototype.toggle = function(dataItem){
      if(!this.dataItemCheck) return;
      var value = this.dataItemCheck.getValue();
      this.dataItemCheck.setValue(!value);
      _check.call(this);
    };


    function CheckListBox(args){

      var listBox = null;

      if(!this.itemTemplate){
        args.itemTemplate = sjs.proxy({
          type:'components.CheckListBoxItem',
          itemCheckPath: args.itemCheckPath,
          itemContentPath: args.itemContentPath
        });
      } else {
        args.itemTemplate = this.itemTemplate;
      }

      if(args.isScrollable)
  			listBox = new components.ScrollableListBox(args);
  		else
  			listBox = new components.StretchListBox(args);

      listBox.onListItem.subscribe(function(item){
          item.toggle();
          this.onSelection(getSelection.call(this));
      },listBox);

	    return listBox;
    }



    /*
      Private functions
    */
    // get selected items
    function getSelection(){
      var selection = [];
      for(var i=0; i < this.listItems.length; i++){
          if(this.listItems[i].dataItem.ischecked){
            selection.push(this.listItems[i].dataItem);
          }
      }
      return selection;
    }

    // apply check mark class
    function _check(){
      var value = this.dataItemCheck.getValue();
      if(value === true) {
        this.views.root.class('checked').add();
      } else {
        this.views.root.class('checked').remove();
      }
    }

    exports.scope (
      CheckListBox , CheckListBoxController, CheckListItemController
    );

    // module exports
    exports.module (
      CheckListBox , CheckListBoxController, CheckListItemController
    );

  }
});
