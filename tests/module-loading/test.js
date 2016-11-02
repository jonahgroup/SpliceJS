define([
    {'Test':'../test-fixture/test-fixture.js'},
    {'UI':'import-module.js'},
    'extension-module.js'      
],    
function(scope){
    "use strict"
    
    var $js = scope.imports.$js
    ,   test = scope.imports.Test;

    test.log('Loading test-modules.js', true);

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
    test.log('Scope read',new scope.LocalClass().n + new scope.LocalClassES6().n == 20);

    //test on demand loading
    var inlineImports = scope.imports.add({inlineImports:{
        count:4,
        test:function(){
            this.count--;
            if(this.count == 0)
                test.log('On-demand loading', this.count == 0);
        }
    }});
    
    //inline-loading
    scope.imports.$js.load([
        'import-module.js'
    ],function(scope){
        this.imports.inlineImports.test();
        test.log('Inline loaded importmodule.js 1',true);
    })

    //inline-loading
    //repeat loading
    scope.imports.$js.load([
        'import-module.js'
    ],function(scope){
        this.imports.inlineImports.test();
        test.log('Repeat Inline loading importmodule.js',true);
    })
    //call and import function
    scope.imports.UI.sayHi();
    
    //inline-load
    scope.imports.$js.load(
        [{'AdhocModule':'ondemand-module-a.js'},
                        'ondemand-module-b.js',
        ],
        function(){
            this.imports.AdhocModule.foo();
            this.imports.inlineImports.test();
            test.log('Inline loading ondemand-module-a.js',true);
            test.log('Inline loading ondemand-module-b.js',true);
        }
    );

    //inline load
    scope.imports.$js.load(
        ['ondemand-module-a.js'], function(){
            this.imports.inlineImports.test();
            test.log('Inline loading ondemand-module-a.js from test-modules.js',true);
        }
    );

    scope.LocalClass;

});

