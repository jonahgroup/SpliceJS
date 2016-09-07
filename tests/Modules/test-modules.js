global.sjs.module({
required:[
    {'UI':'importmodule.js'}      
],    
// required: [
//     {'UI':'importmodule.js'}
// ]
//,
definition:function(){
    var scope = this;

    scope.imports.UI.saySomething();
    scope.imports.$js.load(
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

