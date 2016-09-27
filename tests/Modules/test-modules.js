$js.module({
imports:[
    {'UI':'importmodule.js'}      
],    
definition:function(){
    var scope = this;

    function LocalClass(){}
    
    class LocalClassES6 {

    };

    //add items to the scope
    scope.add(LocalClassES6);
    scope.add(LocalClass);

    scope.add( 
         {test:10}
    );

    scope.imports.UI.saySomething();
    scope.imports.$js.load(
        [{'Inheritance':'/{$jshome}/modules/splice.inheritance.js'}],
        function(){
            var log = this.imports.$js.log;
            var Class = this.imports.Inheritance.Class;

            log.debug('Pseudo import callback');
        }
    );



    

    


    scope.LocalClass;

}});

