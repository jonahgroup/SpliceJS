sjs({

  required:[
    {'Doc':'{sjshome}/modules/splice.document.js'},
    {'SpliceJS.Controls':'splice.controls.listbox.js'},
    'splice.controls.checklistbox.css',
    'splice.controls.checklistbox.html'
  ],
  definition:function(sjs){

    var scope = this.scope
    , Class = sjs.Class
    , Ecent = sjs.Event
    , dom = this.scope.Doc.dom;

    var ListBox = scope.SpliceJS.Controls.ListBox
    , ListItem = scope.components.CheckListBoxItem;


    var CheckListBox = Class(function CheckListBox(args){

      args.itemTemplate = ListItem;

      var listBox = new ListBox(args);

      listBox.onListItem.subscribe(function(item){
        item.toggle();
      },listBox);

      return listBox;
    });



    var CheckListItemController = Class(function CheckListItemController(){
    });

    CheckListItemController.prototype.dataIn = function(dataItem){
      this.concrete.dom.innerHTML = dataItem.toString();
      this.dataItem = dataItem;
      this.isSelected = false;

      if(dataItem.selected === true){
        this.isSelected = true;
      }

      if(this.isSelected === true) {
        dom(this.concrete.dom).class.add('selected');
      }

    };

    CheckListItemController.prototype.toggle = function(dataItem){
      this.isSelected = !this.isSelected;

      if(this.isSelected === true) {
        dom(this.concrete.dom).class.add('checked');
      }
      else {
        dom(this.concrete.dom).class.remove('checked');
      }

    };


    return {
      CheckListBox: CheckListBox
    }

  }
});
