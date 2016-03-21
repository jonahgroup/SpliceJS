sjs.module({
  type:'component',
  required:[
    { Inheritance : '/{sjshome}/modules/splice.inheritance.js'},
    {'SpliceJS.Controls':'splice.controls.dropdownlist.js'}
    // 'splice.controls.combobox.html'
  ],
  definition:function(sjs){

    var
      scope = this.scope
    , exports = sjs.exports

    var
      Class = scope.Inheritance.Class
    , DropDownList = scope.SpliceJS.Controls.DropDownList;

    var ComboBox = Class(function ComboBox(args){

        this.dropDownList = new DropDownList(args);

        //passthrough dataItemPath
        if(args.dataItemPath){
          this.dropDownList.dataItemPath = args.dataItemPath;
        }
        //passthrough selector data path
        if(args.selectedItemPath){
          this.dropDownList.selectedItemPath = args.selectedItemPath;
        }

        //default selection
        if(this.selectedItem){
          if(this.dataPath) {
            var a = {};
            a[this.dataPath] = this.selectedItem;
            this.dropDownList.setSelectedItem(a);
          } else {
            this.dropDownList.setSelectedItem(this.selectedItem);
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
