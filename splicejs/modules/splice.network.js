(function(){



	
	_.Remote = {};
	
	_.RemoteCalls = function(calls){
		
		if(!(calls instanceof Array)) calls = [calls];
			
		for(var i=0; i<calls.length; i++) {
			var call = calls[i];
			_.Remote[call] = (function(){
				var methodName = this.methodName;
				var args = arguments;
				return function(oncomplete, onfailure){
					if(!oncomplete || typeof(oncomplete) !== 'function') return;
					_.HttpRequest.post({
						/* TODO: server end point URL, turn into a configurable property */
						url:'remote',
						
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
			}).bind({methodName:call});
		}
	};
	
	_.ConstructCall = function(methodName, args){
		
		jsonCall = '{"'+methodName+'":'+ JSON.stringify(args) + '}';
		_.debug.log(jsonCall);
		
		return jsonCall;
	};

	
})();
