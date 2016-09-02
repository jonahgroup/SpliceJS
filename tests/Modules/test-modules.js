global.sjs.module({
version:{
    'tablet:1.5.0':[
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


    // scope.load({
    //     required:[''],
    //     definition:function(scope){

    // }})

    function LocalClass(){}

    scope.add(
         LocalClass, 
         {test:10}
    );


    scope.LocalClass;

}});

