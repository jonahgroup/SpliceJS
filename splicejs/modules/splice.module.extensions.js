$js.module({
imports:[
  { Networking  : '/{$jshome}/modules/splice.network.js'}
],
definition:function(){
    var scope = this
    ,   imports = this.imports
    ,   $js = this.imports.$js;     

    var ImportSpec = $js.ImportSpec
    ,   http = imports.Networking.http;

    //Meta handler 
    var metaHandler = {
        importSpec:function(filename,stackId){
        return new ImportSpec();
        },
        load:function(filename, loader, spec){
        http.get({
            url: filename,
            onok:function(response){
                
                var metaJson = JSON.parse(response.text);
                var head = document.head || document.getElementsByTagName('head')[0];
                
                for(var i=0; i<metaJson.length; i++){
                var meta = document.createElement('meta');
                var keys = Object.keys(metaJson[i]);
                for(var key in keys){
                    meta.setAttribute(keys[key],metaJson[i][keys[key]]);
                }  
                head.appendChild(meta);
                }
                loader.onitemloaded(filename);
            }
        });
        }
    };

    // image file handler
    var imageHandler = {
        importSpec : function(filename, stackId){
        return new ImportSpec();
        },
        load:function(filename,loader,spec){
        var img = new Image();
        img.onload = function(){
            loader.onitemloaded(filename);
        }
        img.src = filename;
        }
    };  


    $js.extension.loader({
    '.meta': metaHandler,
    '.png' : imageHandler,
    '.gif' : imageHandler
  });

}
});