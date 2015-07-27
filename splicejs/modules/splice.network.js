(function(){



	
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
						
						data:[{name:'rpc', value:_.ConstructCall(methodName,args)}],
						
						onok:function(result){
								oncomplete(eval(result.text));
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
	
	_.ConstructCall = function(methodName, args){
		
		jsonCall = '{"call":"'+methodName+'","parameters":'+ JSON.stringify(args) + '}';
		_.debug.log(jsonCall);
		
		return jsonCall;
	};

	
})();
