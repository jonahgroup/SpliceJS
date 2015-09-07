/* global sjs */
sjs({

definition:function(sjs){
    "use strict";

	//configuration constants
	var	SPLICE_REMOTE_ENDPOINT = sjs.config.SPLICE_REMOTE_ENDPOINT
	,	SPLICE_REMOTE_CALL_ADAPTER = sjs.config.SPLICE_REMOTE_CALL_ADAPTER;
	
	var HttpRequest = this.HttpRequest
	,	debug = this.debug;
	
    var Remote = Object.create(null);
	

    //arguemnt array of remote calls - array of strings, 
    //or an object to receive remote call declarations
	var RemoteCalls = function (obj) {

	    var fn = function (calls) {

	        if (!(calls instanceof Array)) calls = [calls];

	        var remote = this.Remote;
	        if (!remote) remote = this.Remote = Object.create(null);

	        for (var i = 0; i < calls.length; i++) {

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

	                    if (!SPLICE_REMOTE_ENDPOINT) //perform a stronger check for a valid URL syntax
	                        throw 'Remote end-point is not configured';

	                    HttpRequest.post({
	                        /* TODO: server end point URL, turn into a configurable property */
	                        url: SPLICE_REMOTE_ENDPOINT,

	                        contentType: 'application/json;charset=UTF-8',

	                        data: serialize(methodName, args),

	                        onok: function (response) {
	                            if (typeof (oncomplete) === 'function')
	                            oncomplete(deserialize(response.text));
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
        
	    if (obj instanceof Array) return fn.call(this, obj);
        
	    return function (a) { fn.call(obj, a);}
	};
	


	function error(response) {
	    var adapter = _.Namespace.lookup(SPLICE_REMOTE_CALL_ADAPTER);

	    if (adapter != null) {
	        if (typeof adapter.error !== 'function') {
	            throw 'Remote call adapter: ' + SPLICE_REMOTE_CALL_ADAPTER + ' must implement "error" method';
	        }
	        return adapter.error(response);
	    }
	    
	    return "remote call error";
	}
    
	function deserialize(response){
		var adapter = _.Namespace.lookup(SPLICE_REMOTE_CALL_ADAPTER);
	
		if(adapter != null){
			return adapter.deserialize(response);	
		}

		var result = JSON.parse(response.text);
		return result;
	};


	function serialize(methodName, args) {
		var json = null
	    ,   adapter = _.Namespace.lookup(SPLICE_REMOTE_CALL_ADAPTER);
        
		if (!args) args = [];

		if (adapter != null)
		    json = adapter.serialize(methodName, args);
        else 
		    json = '{"request":{"Call":"' + methodName + '","Parameters":' + JSON.stringify(args) + '}}';

		debug.log(json);
		
		return json;
	};

	return {
		RemoteCalls: RemoteCalls
	}	

}
});
