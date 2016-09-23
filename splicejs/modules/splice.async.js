$js.module({
definition:function(){
var scope = this;

//todo: add loop JOIN method to put them on the same timer
    var asyncLoop = function asyncLoop(from, to, pageSize, oncallback, oncomplete, onpage){
		var page_size = 20
		,	length = 0;

        var length = to - from + 1;

		if(pageSize) page_size = pageSize;

		var	pages = Math.floor(length / page_size) + ( (length % page_size) / (length % page_size ))
		,	count = {p:0};

		var fn = function(){
			if(count.p >=  pages) {
				if(typeof oncomplete === 'function' ) oncomplete();
				return;
			}
			var start = from + page_size * count.p
			,	end  = start + page_size;
			for(var i = start;
					i < end && i < length;
					i++ ) {
				if(!oncallback(i)) return;
			}
			count.p++;
			if(typeof onpage === 'function') onpage();
			setTimeout(fn,1);
		}

		fn();
	};


    scope.exports(
        asyncLoop
    );

}}
);
