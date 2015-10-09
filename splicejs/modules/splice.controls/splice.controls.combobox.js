sjs({
  required:[
    {'SpliceJS.Controls':'splice.controls.dropdownlist.js'},
    // 'splice.controls.combobox.html'
  ],
  definition:function(sjs){

    var scope = this.scope
    , Class = sjs.Class;

    var DropDownList = scope.SpliceJS.Controls.DropDownList;

    var ComboBox = Class(function ComboBox(args){

        var dropDownList = new DropDownList(args);
        //default selection
        if(this.default){
          dropDownList.setSelectedItem(this.default);
        }

        dropDownList.onDataItem.subscribe(function(item){
          this.setSelectedItem(item);
        },dropDownList);


        return dropDownList;
    });



    return {
      ComboBox : ComboBox
    };
  }

});
