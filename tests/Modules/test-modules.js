global.sjs.module({
required: [
  {'UI':'importmodule.js'}
]}
,
function(scope){
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

});

