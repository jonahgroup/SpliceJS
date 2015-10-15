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
    , Event = sjs.Event
    , proxy = sjs.proxy
    , dom = this.scope.Doc.dom
    , components = this.scope.components;

    var ListBoxController = scope.SpliceJS.Controls.ListBoxController
    , ListItem = scope.components.CheckListBoxItem;


    var CheckListBoxController = Class.extend(ListBoxController)(function CheckListBoxController(args){
      this.super(args);
    });

    CheckListBoxController.prototype.onSelection = Event;

    /*
      Check list element item
    */
    var CheckListItemController = Class(function CheckListItemController(){
    });

    CheckListItemController.prototype.dataIn = function(dataItem){


      //same item, dont do anything
      if(this.dataItem === dataItem) return;

      this.dataItem = dataItem;

      dom(this.concrete.dom).value({dataItem:this.dataItem});

      check.call(this);
    };

    CheckListItemController.prototype.toggle = function(dataItem){
      this.dataItem.ischecked = !this.dataItem.ischecked;
      check.call(this);
    };


    function CheckListBox(args){

      var listBox = null;

      if(!this.itemTemplate){
        args.itemTemplate = ListItem;
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
    function check(){
      if(this.dataItem.ischecked === true) {
        dom(this.concrete.dom).class.add('checked');
      } else {
        dom(this.concrete.dom).class.remove('checked');
      }
    }

    // module exports
    return {
      CheckListBox: CheckListBox,
      CheckListItemController : CheckListItemController
    }

  }
});
