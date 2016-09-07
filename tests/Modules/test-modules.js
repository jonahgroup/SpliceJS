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
        function(){
            var log = this.imports.$js.log;
            var Class = this.imports.Inheritance.Class;

            log.debug('Pseudo import callback');
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

