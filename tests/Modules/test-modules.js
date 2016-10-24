$js.module({
imports:[
    {'UI':'importmodule.js'},
    'extension.js'      
],    
definition:function(){
    "use strict"
     console.log('test-modules.js - loaded');

    var scope = this
    ,   $js = this.imports.$js;


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
        console.log('Pass...');

    scope.imports.$js.load([
        'importmodule.js'
    ],function(){
        console.log('test-modules.js 1. - inline loaded importmodule.js 1');
    })


    scope.imports.$js.load([
        'importmodule.js'
    ],function(){
        console.log('test-modules.js 2. - inline loaded importmodule.js 2');
    })

    scope.imports.UI.sayHi();
    scope.imports.$js.load(
        [{'AdhocModule':'adhocmodule.js'},
          'adhocmodule2.js',
        ],
        function(){
            this.imports.AdhocModule.foo();
            console.log('test-modules.js 3. - inline loaded adhocmodule.js, adhocmodule2');
        }
    );

    scope.imports.$js.load(
        ['adhocmodule.js'], function(){
            console.log('test-modules.js 4. - inline loaded adhocmodule.js');
        }
    );

    scope.LocalClass;

}});

