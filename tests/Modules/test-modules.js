$js.module({
imports:[
    {'UI':'importmodule.js'}      
],    
definition:function(){
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
        console.info('Pass...');

    scope.imports.UI.saySomething();
    scope.imports.$js.load(
        [{'Inheritance':'/{$jshome}/modules/splice.inheritance.js'}],
        function(){
            
            var Class = this.imports.Inheritance.Class;

            console.debug('Pseudo import callback');
        }
    );


    scope.LocalClass;

}});

