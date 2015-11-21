sjs({
  alias:'SpliceJS.Components.ComboBox',
  required:[
    {'SpliceJS.Controls':'splice.controls.dropdownlist.js'},
    // 'splice.controls.combobox.html'
  ],
  definition:function(sjs){

    var scope = this.scope
    , exports = sjs.exports
    , Class = sjs.Class;

    var DropDownList = scope.SpliceJS.Controls.DropDownList;

    var ComboBox = Class(function ComboBox(args){

        this.dropDownList = new DropDownList(args);
        //default selection
        if(this.default){
          if(this.dataPath) {
            var a = {};
            a[this.dataPath] = this.default;
            this.dropDownList.setSelectedItem(a);
          } else {
            this.dropDownList.setSelectedItem(this.default);
          }
        }

        //override default implementation of the setSelectedItem
        var save_setSelectedItem = this.dropDownList.setSelectedItem;

        this.dropDownList.onDataItem.subscribe(function(item){
          this.setSelectedItem(item);
        },this.dropDownList);

        return this.dropDownList;
    });



    exports.module(
      ComboBox
    );
  }

});
