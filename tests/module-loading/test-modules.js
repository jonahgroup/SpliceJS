$js.module({
imports:[
    {'Test':'../test-fixture/test-fixture.js'},
    {'UI':'import-module.js'},
    'extension-module.js'      
],    
definition:function(scope){
    "use strict"
    
    var $js = scope.imports.$js
    ,   test = scope.imports.Test;

    test.log('test-modules.js - loaded');

    function LocalClass(){
        this.n = 10;
    }
    
    class LocalClassES6 {
       constructor() {
            this.n = 10;
        }
    };

    //add items to the scope
    scope.add(LocalClassES6);
    scope.add(LocalClass);

    scope.add( 
         {test:10}
    );

    //read items from the scope
    if(new scope.LocalClass().n + new scope.LocalClassES6().n == 20)
        test.log('Pass...');
    


    //test on demand loading

    var inlineImports = scope.imports.add({inlineImports:{
        count:3,
        test:function(){
            this.count--;
            if(this.count == 0){
                test.log('On-demand loading passed.');
            }
        }
    }});
    

    scope.imports.$js.load([
        'import-module.js'
    ],function(){
        this.imports.inlineImports.test();
        test.log('test-modules.js 1. - inline loaded importmodule.js 1');
    })


    scope.imports.$js.load([
        'import-module.js'
    ],function(){
        this.imports.inlineImports.test();
        test.log('test-modules.js 2. - inline loaded importmodule.js 2');
    })

    scope.imports.UI.sayHi();
    scope.imports.$js.load(
        [{'AdhocModule':'ondemand-module-a.js'},
          'ondemand-module-b.js',
        ],
        function(){
            this.imports.AdhocModule.foo();
            this.imports.inlineImports.test();
            test.log('test-modules.js 3. - inline loaded adhocmodule.js, adhocmodule2');
        }
    );

    scope.imports.$js.load(
        ['ondemand-module-a.js'], function(){
            this.imports.inlineImports.test();
            test.log('test-modules.js 4. - inline loaded adhocmodule.js');
        }
    );

    scope.LocalClass;

}});

