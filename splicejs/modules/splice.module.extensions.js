sjs.module({
required:[
    { Networking  : '/{sjshome}/modules/splice.network.js'}
],
definition:function(scope){
    var http = imports.Networking.http;

    /*
    ----------------------------------------------------------
      HTML File Handler
    */
    var htmlHandler = function(filename, loader){

      http.get({
          url: filename,
          onok:function(response){
            extractTemplates.call(loader.scope,response.text);
            loader.progress();
            loader.loadNext();
          }
      });
    };

    /*
    ----------------------------------------------------------
      CSS File Handler
    */
    var cssHandler = function(filename,loader){
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
      linkref.onload = function(){
        if(!linkref.readyState || linkref.readyState == 'complete') {
        //	URL_CACHE[filename] = true;
          loader.onitemloaded();
          loader.progress();
          loader.loadNext({});
        }
      };
      head.appendChild(linkref);
    };

    sjs.extension.loader({
      '.css' : cssHandler,
      '.html': htmlHandler
    });

}
})
