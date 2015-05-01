(function(){

	function HttpRequest(){
		var a = Array("Msxml2.XMLHTTP","Microsoft.XMLHTTP");
    	if (window.ActiveXObject)
        for (var i = 0; i < a.length; i++) {
           	try {this.transport = new ActiveXObject(a[i]);}
        	catch (ex) {console.log(ex);}
        }
        else if (window.XMLHttpRequest)   this.transport =  new XMLHttpRequest();
	};

	HttpRequest.prototype.get = function(config){
		
		this.transport.open('GET',config.url,true);
		this.transport.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded charset=utf-8');

	 	var params = '';
        var separator = '';
        if(config.data)
        for(var d=0; d < config.data.length; d++){
        	params += separator + config.data[d].name + '=' + encodeURIComponent(config.data[d].value);
           	separator = '&';
        }
        //in ie8 onreadystatechange is attached to a quasy window object
        var self = this;
        this.transport.onreadystatechange = function(){

        	if(self.transport.readyState == 4){
        	var response = {text:self.transport.responseText, xml:self.transport.responseXML};
        	switch(self.transport.status) {
				case 200:	
					if(config.onok)	config.onok(response);
				break;
       		}}
        };

		this.transport.send(params); 
		return this;
	};

	HttpRequest.prototype.post = function(config){
		return this;
	};



	//HttpRequest object proxy
	_.HttpRequest = {};
	_.HttpRequest.post = function(config){
		return new HttpRequest().post(config);
	};

	_.HttpRequest.get = function(config){
		return new HttpRequest().get(config);
	};
	
	
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
