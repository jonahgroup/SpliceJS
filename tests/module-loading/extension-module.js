define([
    'require','loader','exports',
    '../test-fixture/test-fixture'
],
function(require,loader,exports, test){
    "use strict";
    
    var ImportSpec = loader.ImportSpec;
   
    test.log('Loading extension-module.js',true);

    function VirtualSpec(fileName){
        ImportSpec.call(this,fileName);
    }

    VirtualSpec.prototype = new ImportSpec();
    VirtualSpec.prototype.constructor = VirtualSpec;

    loader.addHandler(
        '.virt',{
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
    );
});