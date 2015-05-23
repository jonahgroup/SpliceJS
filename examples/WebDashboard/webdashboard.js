_.Module({

required:[ 
	
	'webdashboard.css',
	'webdashboard.htmlt',
],

definition:function(){


	var WebDashboard = _.Namespace('UserApplications').Class( function WebDashboard(){

		this.data = {};

		var self = this;

		_.HttpRequest.get({
			url:SPLICE_PUBLIC_ROOT + '/../examples/WebDashboard/data/daily-unique-visitors.json',
			onok:function(data){
				eval('var sampleData = ' + data.text);
			
				self.data.UNIQUE_VISITORS = sampleData;
			
			self.uniqueVisitors(
			{
				headers: self.data.UNIQUE_VISITORS.cols,
				data: 	self.data.UNIQUE_VISITORS.data
			});

			//self.uniqueVisitorsChart(sampleChartData);

			
			self.uniqueVisitorsChart({
				labels:_.data(self.data.UNIQUE_VISITORS.data).toArray(function(item){
							return item.value[0]
				}).paginator(15).next(),
				
				datasets:[
					{
					label: "My Second dataset",
            		fillColor: "rgba(151,187,205,0.2)",
            		strokeColor: "rgba(151,187,205,1)",
           			pointColor: "rgba(151,187,205,1)",
            		pointStrokeColor: "#fff",
            		pointHighlightFill: "#fff",
            		pointHighlightStroke: "rgba(151,187,205,1)",
					data:_.data(self.data.UNIQUE_VISITORS.data).toArray(function(item){
							return item.value[1]*1
						}).paginator(15).next()
					}
				]}
			);	

			}
		});

	});

	WebDashboard.prototype.uniqueVisitors = new _.Multicaster();
	WebDashboard.prototype.uniqueVisitorsChart	= new _.Multicaster();

	WebDashboard.prototype.onDisplay = function(){
		
	};



}
});