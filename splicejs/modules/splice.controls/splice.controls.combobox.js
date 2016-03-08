sjs.module({
  required:[
    { Inheritance : '/{sjshome}/modules/splice.inheritance.js'},
    {'SpliceJS.Controls':'splice.controls.dropdownlist.js'}
    // 'splice.controls.combobox.html'
  ],
  definition:function component(sjs){

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
        if(args.selectorDataPath){
          this.dropDownList.selectorDataPath = args.selectorDataPath;
        }

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
