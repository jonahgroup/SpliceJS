$js.module({
imports:[
  { Networking  : '/{$jshome}/modules/splice.network.js'}
],
definition:function(){
  var scope = this;
  
  var 
      imports = scope.imports 
  ,   sjs = scope.imports.$js;

  var 
      http = imports.Networking.http
  ,   ImportSpec = imports.$js.ImportSpec
  ,   log = scope.imports.$js.log;
  

  /*
  ----------------------------------------------------------
    HTML File Handler
  */
  function HtmlSpec(){}
  HtmlSpec.prototype = new ImportSpec();
  HtmlSpec.execute = function(){
    this.isProcessed = true;
  }

  var htmlHandler = {
      importSpec:function(filename,stackId){
        return new HtmlSpec();
      },
      load:function(filename, loader, spec){
        http.get({
            url: filename,
            onok:function(response){
              spec.dom = document.createElement('span');

              var cStart = /<sjs-component(?:.*?)>/gi
              ,   cEnd = /<\/sjs-component>/gi

              //var //componentRegex = /(?:<sjs-component>)(.|[\n\r\t\s\f])*(?:<\/sjs-component>)/gi
              //    /<sjs-component(?:.*?)>(.*|[\n\r\t\s\f]*)<\/sjs-component>/
              //    /<sjs-component(?:.*?)>((?:.|[\n\r\t\s\f])*)<\/sjs-component>/
              
              ,   match = null;  
              while((match = cStart.exec(response.text))){
                var end = cEnd.exec(response.text);
               // log.info(match);
              }

              spec.dom.innerHTML = response.text;
              loader.onitemloaded(filename);
            }
        });
      }
  };

  /*
  ----------------------------------------------------------
    CSS File Handler
  */
  function CssSpec(){}
  CssSpec.prototype = new ImportSpec();
  CssSpec.prototype.execute = function(){
    this.isProcessed = true;
  };

  var cssHandler = {
    importSpec:function(){
      return new CssSpec();
    },
    load:function(filename,loader){
      var linkref = document.createElement('link');

      linkref.setAttribute("rel", "stylesheet");
      linkref.setAttribute("type", "text/css");
      linkref.setAttribute("href", filename);

      //linkref.onreadystatechange
      /*
      * Link ref supports onload in IE8 WTF????
      * as well as onreadystatechange
      * having an assigment to both will trigger the handler twice
      *
      * */
      var head = document.head || document.getElementsByTagName('head')[0];
      
      /*
      linkref.onload = function(){
        if(!linkref.readyState || linkref.readyState == 'complete') {
        //	URL_CACHE[filename] = true;
          loader.onitemloaded(filename);
        }
      };
      */
      //lets not wait for CSS to load since CSS are processed by the browser
      setTimeout(function(){
        loader.onitemloaded(filename);
      },1);
      head.appendChild(linkref);
     
      
    }
  };

  /** 
   * 
   * Image file handler
   */
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

  try {
    if(!JSON) throw 'No JSON'; 
  }
  catch(ex){
    JSON = {parse:function(){}};
  }

  /** 
   * Meta Handler
   */
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

  sjs.extension.loader({
    '.css' : cssHandler,
    '.html': htmlHandler,
    '.meta': metaHandler,
    '.png' : imageHandler,
    '.gif' : imageHandler
  });

}
})
