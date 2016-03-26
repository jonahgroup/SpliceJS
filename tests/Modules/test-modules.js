global.sjs.module(
[
  {'UI':'/{sjshome}/modules/splice.dataitem.js'}  
]
)(function(scope){
    

    
    scope.module([{'Applets':'/{jagui_applets}/dashboard.js'}])(
        function(scope){
            var dashboard = scope.imports.Applets.Dashboard;        
        }
    )
    
    scope.load();
    scope.core
    scope.imports.Dashboard
    scope.exports            
});

scope.load = 


function loadcomponent(m){
    return function(fn){
        scope.module(m)(function(scope){
            compileTemplates();
            fn();
        });    
    }
}






