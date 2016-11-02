define([
    {'Test':'../test-fixture/test-fixture.js'}
],
function(scope){
    "use strict";
    
    var scope = this;
    var $js = scope.imports.$js;
    var ImportSpec = $js.ImportSpec;
    var test = scope.imports.Test;
   
    test.log('Loading extension-module.js',true);

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
                            return true;
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
});