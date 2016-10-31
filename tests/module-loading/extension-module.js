$js.module({
imports:[{'Test':'../test-fixture/test-fixture.js'}],
definition:function(){
    
    var scope = this;
    var $js = scope.imports.$js;
    var ImportSpec = $js.ImportSpec;
    var test = scope.imports.Test;
   
    test.log('.virtual extension.js - loaded');

   


    function VirtualSpec(fileName){
        ImportSpec.call(this,fileName);
    }

    VirtualSpec.prototype = new ImportSpec();
    VirtualSpec.prototype.constructor = VirtualSpec;

    $js.extension.loader({
        '.virt':{
            importSpec:function(fileName){
                var spec = new VirtualSpec(fileName); 
                spec.scope = {
                    __sjs_module_exports__ : {
                        virtualCall:function(){
                            test.log('this is a virtual call');
                        }
                    }
                }
                return spec;
            },
            load:function(loader,spec){
                loader.onitemloaded(spec.fileName);
            }
        }
    })

}});