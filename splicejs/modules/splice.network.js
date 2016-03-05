/* global sjs */
sjs.module({

definition:function(sjs){
    "use strict";

	//configuration constants
	var	SPLICE_REMOTE_ENDPOINT = sjs.config.SPLICE_REMOTE_ENDPOINT
	,	SPLICE_REMOTE_CALL_ADAPTER = sjs.config.SPLICE_REMOTE_CALL_ADAPTER;

	var HttpRequest = sjs.HttpRequest
  , exports = sjs.exports
  ,	debug = sjs.debug;


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

		debug.log(json);

		return json;
	};

  function Remote(url, adapter){
    this.endpoint = url;
    this.adapter = adapter;
  };

  Remote.prototype.calls = function calls(remoteCalls){
    registerCalls.call(this,remoteCalls, this.endpoint, this.adapter);
    return this;
  };


  function remote(url, adapter) {
    return new Remote(url, adapter);
  };


  // module exports
	exports.module(
    remote
	);

}
});
