_.Module({

required:[ 
	
	'webdashboard.css',
	'webdashboard.htmlt',
],

definition:function(){

	var scope = this;

	var WebDashboard = _.Namespace('UserApplications').Class( function WebDashboard(){

		SpliceJS.Controls.UIControl.call(this);

		this.data = {};

		var self = this;

		_.HttpRequest.get({
			url:SPLICE_PUBLIC_ROOT + '/../examples/WebDashboard/data/daily-unique-visitors.json',
			onok:function(data){
				var sampleData = JSON.parse(data.text);
			
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

	}).extend(SpliceJS.Controls.UIControl);


	WebDashboard.prototype.uniqueVisitors = _.Event;
	WebDashboard.prototype.uniqueVisitorsChart	= _.Event;



	var Report = scope.Report = _.Class(function Report(){

		SpliceJS.Controls.UIControl.call(this);

	}).extend(SpliceJS.Controls.UIControl);


	Report.prototype.reflowChildren = function(position, size, bubbleup){
		
		var size = {
			width: 	this.elements.reportBody.clientWidth,
			height: this.elements.reportBody.clientHeight
		};

		SpliceJS.Controls.UIControl.prototype.reflowChildren.call(
				this, {left:0, top:0}, size, bubbleup );		
	};	



}
});