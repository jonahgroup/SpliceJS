/* global sjs */
$js.module({
definition:function(){
  "use strict";


  /*
  ----------------------------------------------------------
  	HttpRequest
  */
	var HttpRequest = function HttpRequest(){
		var a = Array("Msxml2.XMLHTTP","Microsoft.XMLHTTP");
    	if (window.ActiveXObject)
        for (var i = 0; i < a.length; i++) {
           	this.transport = new ActiveXObject(a[i]);
        }
        else if (window.XMLHttpRequest)   this.transport =  new XMLHttpRequest();
	};

	HttpRequest.prototype.request = function(type,config){

	 	var params = ''
    ,   separator = ''
	 	,   requestURL = config.url
	 	,   self = this;

    if (config.formData)
    for(var d=0; d < config.formData.length; d++){
    	params += separator + config.formData[d].name + '=' + encodeURIComponent(config.formData[d].value);
       	separator = '&';
    }

    if(params.length > 0 && type === 'GET'){
    	requestURL = requestURL + "?" + params;
    }

		this.transport.open(type,requestURL,true);

	    //custom content type
		if (config.contentType) {
		    this.transport.setRequestHeader('Content-Type', config.contentType);
		}

	    //form url encoded data
		else if (config.formData) {
		    this.transport.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
		}

        //post plain text
		else if (config.data) {
		    this.transport.setRequestHeader('Content-Type', 'text/html; charset=utf-8');
		}



    /*
        in ie8 onreadystatechange is attached to a quasy window object
        [this] inside handler function will refer to window object and not transport object
    */
    function onLoadHandler(){
        var transport = self.transport;

        var response = {
            text: transport.responseText,
            xml:  transport.responseXML
        };

        switch (transport.status) {
            case 200:
                if(typeof config.onok == 'function') config.onok(response);
                break;
            case 400, 401, 402, 403, 404, 405, 406:
            case 500:
            default:
                if (typeof config.onfail == 'function') config.onfail(response);
                break;
        }
    }

    if(this.transport.onload !== undefined ) {
        this.transport.onload = onLoadHandler;
    }
    else {
        this.transport.onreadystatechange = function(e){
            if(self.transport.readyState == 4 ) onLoadHandler();
        }    
    }


    if (type == 'POST' && !params) params = config.data;
		this.transport.send(params);
		return this;
	};

	HttpRequest.post = function (config) {
		return new HttpRequest().request('POST',config);
	};

	HttpRequest.get = function(config){
		return new HttpRequest().request('GET',config);
	};


  /*
  ----------------------------------------------------------
  	Remote Calls interface
  */
  function Remote(url, adapter){
    this.endpoint = url;
    this.adapter = adapter;
  };

  Remote.prototype.calls = function calls(remoteCalls){
    registerCalls.call(this,remoteCalls, this.endpoint, this.adapter);
    return this;
  };



    //arguemnt array of remote calls - array of strings,
    //or an object to receive remote call declarations
  function registerCalls(calls, endpoint, adapter) {

      if (!(calls instanceof Array)) calls = [calls];
      var remote = this;

      for (var i = 0; i < calls.length; i++) {
          remote = this;

          var call = calls[i]
          , nparts = call.split('.')
          , fullCall = call;

          for (var n = 0; n < nparts.length - 1; n++) {
              if (!remote[nparts[n]]) remote[nparts[n]] = {};
              remote = remote[nparts[n]];
          }

          call = nparts[nparts.length - 1];

          if (remote[call] != null && remote[call] != undefined) continue;

          remote[call] = (function () {
              var methodName = this.methodName;
              var args = arguments;

              return function (oncomplete, onfailure) {
                  if (!oncomplete || typeof (oncomplete) !== 'function') return;

                  HttpRequest.post({
                      /* TODO: server end point URL, turn into a configurable property */
                      url: endpoint,

                      contentType: 'application/json;charset=UTF-8',

                      data: serialize(methodName, args, adapter),

                      onok: function (response) {
                          if (typeof (oncomplete) === 'function')
                          oncomplete(deserialize(response.text, adapter));
                      },

                      onfail: function (response) {
                          if (typeof (onfailure) === 'function')
                          onfailure(error(response.text));
                      }
                  });
              }
          }).bind({ methodName: fullCall });
      }
  };



	function error(response, adapter) {
	    if (adapter != null) {
	        if (typeof adapter.error !== 'function') {
	            throw 'Remote call adapter must implement "error" method';
	        }
	        return adapter.error(response);
	    }
	    return "remote call error";
	};


	function deserialize(response, adapter){

		if(adapter != null){
			return adapter.deserialize(response);
		}

		var result = JSON.parse(response.text);
		return result;
	};


	function serialize(methodName, args, adapter) {
		var json = null;


		if (!args) args = [];

		if (adapter != null)
		    json = adapter.serialize(methodName, args);
        else
		    json = '{"request":{"Call":"' + methodName + '","Parameters":' + JSON.stringify(args) + '}}';

		log.debug(json);

		return json;
	};

  function remote(url, adapter) {
    return new Remote(url, adapter);
  };


  // module exports
	this.exports(
    remote,
    {http : { get:  HttpRequest.get, post: HttpRequest.post }}
	);
}
});
