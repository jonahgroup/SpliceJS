(function(){
    "use strict";

	
	_.Remote = Object.create(null);
	
	_.RemoteCalls = function(calls){
		
		if(!(calls instanceof Array)) calls = [calls];
			
		for(var i=0; i<calls.length; i++) {

		    var call = calls[i]
		    ,   nparts = call.split('.')
            ,   remote = _.Remote
            ,   fullCall = call;


		    for (var n = 0; n < nparts.length-1; n++) {
		        if (!remote[nparts[n]]) remote[nparts[n]] = {};
		        remote = remote[nparts[n]];
		    }

		    call = nparts[nparts.length - 1];

			if(remote[call] != null && remote[call] != undefined ) continue;

			remote[call] = (function () {
				var methodName = this.methodName;
				var args = arguments;

				return function(oncomplete, onfailure){
					if(!oncomplete || typeof(oncomplete) !== 'function') return;

					if (!SPLICE_REMOTE_ENDPOINT) //perform a stronger check for a valid URL syntax
					    throw 'Remote end-point is not configured';

					_.HttpRequest.post({
						/* TODO: server end point URL, turn into a configurable property */
					    url: SPLICE_REMOTE_ENDPOINT,
											   
					    contentType: 'application/json;charset=UTF-8',

						data:constructCall(methodName,args),
						
						onok: function (response) {
						    var result = null;
						    eval("result=" + response.text);
						    oncomplete(result);
						},
							
						onfail:function(result){
							if(typeof(onfailure) === 'function')	
							onfailure(result);
						}
					});
				}
			}).bind({methodName:fullCall});
		}
	};
	
	function constructCall(methodName, args) {
		var json = null
	    ,   adapter = _.Namespace.lookup(SPLICE_REMOTE_CALL_ADAPTER);
        
		if (!args) args = [];

		if (adapter != null)
		    json = adapter.serialize(methodName, args);
        else 
		    json = '{"request":{"Call":"' + methodName + '","Parameters":' + JSON.stringify(args) + '}}';

		_.debug.log(json);
		
		return json;
	};

	
})();
