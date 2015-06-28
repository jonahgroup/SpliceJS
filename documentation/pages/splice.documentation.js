_.Module({
	

required:['toc.htmlt'],

definition:function(){
	
	var scope = this;

	var TableOfContent = _.Namespace('SpliceJS.Documentation').Class(function TableOfContent(){


	});


	TableOfContent.prototype.onLinkClick = function(args){
		if(!args) return;
		var page = args.linkname;

		loadContentPage(page);

	};

	var pageMap = {
		PracticalIntro:[scope.path + '/practicalintro.htmlt', 'SpliceJS.Documentation.PracticalIntro']
	};


	function loadContentPage(pageName){
		_.load([pageMap[pageName][0]],function(){
			var content = _.Namespace.lookup(pageMap[pageName][1]);
			_.Doc.display(new content());

		});
	}


}

});