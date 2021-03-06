define([
    'require',
    '../test-fixture/test-fixture',
    'import-module',
    'extension-module'      
],    
function(require,test,ui,ext){
    "use strict"

    test.log('Loading test-modules.js', true);


    //test on demand loading
    test.inlineImports = {
        count:4,
        test:function(){
            this.count--;
            if(this.count == 0)
                test.log('On-demand loading', this.count == 0);
        }
    };
    
    
    //inline-loading
    require([
        'import-module'
    ],function(m){
        test.inlineImports.test();
        test.log('Inline loaded importmodule.js 1',true);
    })

    //inline-loading
    //repeat loading
    require([
        'import-module'
    ],function(){
        test.inlineImports.test();
        test.log('Repeat Inline loading importmodule.js',true);
    })
    //call and import function
    ui.sayHi();
    
    //torture load
    var tortureLoad = {count:200};
    for(var i=0; i<100; i++){
      require(['ondemand-module-a'], 
        function(){
            test.inlineImports.test();
            test.log('Inline loading ondemand-module-a.js from test-modules.js',true);
            tortureLoad.count--;
                require([{'AdhocModule':'ondemand-module-a'},
                           'ondemand-module-b',
                           'import-module'
                    ],
                    function(imports,b,c){
                        imports.AdhocModule.foo();
                        test.inlineImports.test();
                        test.log('nested require - Inline loading ondemand-module-a.js',true);
                        test.log('nested require - Inline loading ondemand-module-b.js',true);
                        tortureLoad.count--;
                    }
                );
        }
        );  
    }

    //inline-load
    require(
        [{'AdhocModule':'ondemand-module-a'},
                        'ondemand-module-b',
        ],
        function(imports){
            imports.AdhocModule.foo();
            test.inlineImports.test();
            test.log('Inline loading ondemand-module-a.js',true);
            test.log('Inline loading ondemand-module-b.js',true);
        }
    );

    //inline load
    require(['ondemand-module-a.js'], 
    function(){
            test.inlineImports.test();
            test.log('Inline loading ondemand-module-a.js from test-modules.js',true);
        }
    );




});

