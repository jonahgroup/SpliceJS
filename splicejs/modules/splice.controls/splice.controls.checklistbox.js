/*
  CheckListBox control is using templates copied from ListBox control
  While controller inherits from LibBoxController template declaration is
  a !!! copy/paste code !!!!
  Need a way to extend components including templates
*/
$js.module({
prerequisite:[
  '/{$jshome}/modules/splice.module.extensions.js'
],
imports:[
  { Inheritance : '/{$jshome}/modules/splice.inheritance.js'},
  { Component		: '/{$jshome}/modules/splice.component.core.js'},
  { Events			: '/{$jshome}/modules/splice.event.js'},
  {'SpliceJS.UI':'/{$jshome}/modules/splice.ui.js'},
  {'Doc':'/{$jshome}/modules/splice.document.js'},
  {'SpliceJS.Controls':'splice.controls.scrollpanel.js'},
  {'SpliceJS.Controls':'splice.controls.listbox.js'},
  'splice.controls.checklistbox.css',
  'splice.controls.checklistbox.html'
],
  definition:function(){

    var scope = this
    ,   sjs = this.imports.$js;

    var 
        imports = scope.imports
    ;

    var
      Class      = imports.Inheritance.Class
    , event      = imports.Events.event
    , proxy      = imports.Component.Proxy
    , DataItem   = imports.SpliceJS.UI.DataItem
    , dom        = imports.Doc.dom
    , ListBoxController = imports.SpliceJS.Controls.ListBoxController
    , ListItemController = imports.SpliceJS.Controls.ListItemController
    , components = scope.components;
    ;

    var CheckListBoxController = Class(function CheckListBoxController(args){
      this.base(args);
      event(this).attach({
        onSelection : event.multicast
      });
    }).extend(ListBoxController);

    /*
      Check list element item
    */
    var CheckListItemController = Class(function CheckListItemController(){
      this.base();
    }).extend(ListItemController);

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
        args.itemTemplate = proxy.call(scope,{
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
        this.views.root.cl('checked').add();
      } else {
        this.views.root.cl('checked').remove();
      }
    }

    scope.add (
      CheckListBox , CheckListBoxController, CheckListItemController
    );

    // module exports
    scope.exports (
      CheckListBox , CheckListBoxController, CheckListItemController
    );

  }
});
