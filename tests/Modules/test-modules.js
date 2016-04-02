global.sjs.module({
version:{
    'tablet:1.5.1':[
        {'UI':'importmodule.js'}      
    ]
},    
// required: [
//     {'UI':'importmodule.js'}
// ]
//,
definition:function(scope){
    scope.imports.UI.saySomething();
    scope.load(
        [{'Inheritance':'/{sjshome}/modules/splice.inheritance.js'}],
        function(scope){
            var Class = scope.imports.Inheritance.Class;
        }
    );


    function LocalClass(){}

    scope.add(
         LocalClass, 
         {test:10}
    );


    scope.LocalClass;

}});

