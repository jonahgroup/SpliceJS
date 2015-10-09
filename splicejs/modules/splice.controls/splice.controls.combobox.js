sjs({
  required:[
    {'SpliceJS.Controls':'splice.controls.dropdownlist.js'},
    'splice.controls.combobox.html'
  ],
  definition:function(sjs){

    var scope = this.scope
    , Class = sjs.Class;

    var DropDownListController = SpliceJS.Controls.DropDownListController;

    var CBController = Class.extend(DropDownListController)(function ComboBoxController(){

    });


    return {
      ComboBoxController : CBController
    };
  }

});
