global.sjs.module({
version:[
    {'mobile: 1.0.0 - *]':[
        {'Mobile':'importmodule.js'}      
    ]}
],    
required: [
    {'UI':'importmodule.js'}
]
,
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

