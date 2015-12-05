/*

  CheckListBox control is using templates copied from ListBox control
  While controller inherits from LibBoxController template declaration is
  a !!! copy/paste code !!!!
  Need a way to extend components including templates
*/

sjs({

  required:[
    {'Doc':'{sjshome}/modules/splice.document.js'},
    {'SpliceJS.Controls':'splice.controls.scrollpanel.js'},
    {'SpliceJS.Controls':'splice.controls.listbox.js'},
    'splice.controls.checklistbox.css',
    'splice.controls.checklistbox.html'
  ],
  definition:function(sjs){

    var scope = this.scope
    , Class = sjs.Class
    , event = sjs.event
    , proxy = sjs.proxy
    , exports = sjs.exports
    , dom = this.scope.Doc.dom
    , components = this.scope.components;


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
      this.views.root.replace(item.getValue());
      _check.call(this);
      this.onDataOut(item);
    };

    CheckListItemController.prototype.toggle = function(dataItem){
      this.dataItem.ischecked = !this.dataItem.ischecked;
      _check.call(this);
    };


    function CheckListBox(args){

      var listBox = null;

      if(!this.itemTemplate){
        args.itemTemplate = scope.components.CheckListBoxItem;
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
      if(this.dataItem.getValue().ischecked === true) {
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
