sjs.module({
required:[
  {'UI':'/{sjshome}/modules/splice.dataitem.js'}
]
,
definition: function(sjs,scope){
    "use strict";
    var log = sjs.log;

    var
      DataItem = scope.UI.DataItem
    ;

    var orders = [
      {id:1, desc:'Sample order', items:[{id:24, name:'note book', qty:1}]},
      {id:2, desc:'Sample order', items:[{id:7, name:'pencil', qty:3}]}
    ];



    Test_PathTree();
    Test_ValueSetter();
    Test_ValueSetterRefSource();
    Test_ValueSetterPrimSource();
    Test_AppendValue();
    Test_RemoveValue();
    Test_GetChanges();
    Test_Delete();
    Test_LargeData();

    function Test_PathTree(){
      var d = new DataItem(orders);
      var item = d.path('1').path('items.0');
      if (d.path(item.fullPath()) == item ){
        log.info('Test_PathTree: Pass');
        return true;
      } else {
        log.info('Test_PathTree: Fail');
        return false;
      }
    }


    function Test_ValueSetter(){
      var d = new DataItem(orders);
      var item = d.path('1').path('items.0');
      //set item id
      item.path('id').setValue(10);
      if( orders[1].items[0].id === item.path('id').source.id) {
        log.info('Test_ValueSetter: Pass');
        return true;
      } else {
        log.info('Test_ValueSetter: Fail');
        return false;
      }
    }


    function Test_ValueSetterRefSource(){
      var d = new DataItem(orders);
      try {
        d.setValue('test');
        log.info("Test_ValueSetterRefSource: Fail");
        return false;
      } catch(ex){
        log.info("Test_ValueSetterRefSource: Pass");
        return true;
      }
    }

    function Test_ValueSetterPrimSource(){
      var d = new DataItem(456);
      try {
        d.setValue('test');
        if(d.getValue() === 'test'){
          log.info("Test_ValueSetterPrimSource: Pass");
          return true;
        }
      } catch(ex){
        log.info("Test_ValueSetterPrimSource: Fail");
        return false;
      }
      return false;
    }

    function Test_AppendValue(){
      var d = new DataItem(['one','two','three']);
      var f = d.path('4').setValue('four');
      if(d.source[4] === 'four'){
        log.info("Test_AppendValue: Pass");
        return true;
      }
      log.info("Test_AppendValue: Fail");
      return false;
    }


    function Test_RemoveValue(){
      var d = new DataItem(['one','two','three']);
      var f = d.path('3').remove();
      if(f.getValue() == null){
        log.info("Test_RemoveValue: Pass");
        return true;
      }
      log.info("Test_RemoveValue: Fail");
      return false;
    }

    //count number of changes
    function Test_GetChanges(){
      var d = new DataItem(orders);

      var i = d.path('1.items.0.name').setValue('black pencil');
      //d.path('0.items.0.name').setValue('black pencil');

      log.info(i.getValue());
      d.changes(function(item){
            log.info(item);
      });
    }

    function Test_Delete(){
      var d = new DataItem(['one','two','three']);
      var item = d.path('1').remove();

      d.changes(function(item){
            log.info(item);
      });

      item.setValue('x');

      d.changes(function(item){
            log.info(item);
      });

    }


    function Test_LargeData(){
      var bigData = new DataItem([]);

      for(var i=0; i<10000; i++){
        bigData.path(i).setValue({id:i, name:'sample'+i});
      }

      log.info(bigData);

    }



}})
