_.Module({
	
required:['modules/splice.controls/splice.controls.css',
          'modules/splice.controls/splice.controls.htmlt'],	
	
definition:function(){
	
	
	var Button = _.Namespace('SpliceJS.Controls').Class(function Button(args){
		_.info.log('Creating Button');
		
		if(args.content && args.content['label']){
			this.elements.buttonContainer.value = args.content['label']; 
		}
		
		var self = this;
		this.elements.buttonContainer.onclick = function(){
			self.onClick();
		};
	});

	
	Button.prototype.onClick = function(){
		_.debug.log('Event is not assigned');
	};
	
	
	
	var DataTable = _.Namespace('SpliceJS.Controls').Class(function DataTable(){
	
		_.info.log('Constructing date table');
		this.dom = this.elements.dataTableContainer;
		
	});
	
	DataTable.prototype.onData = function(data){
		
		/*process array of things */
		_.info.log('onData Called ');
	
		if(!(data instanceof Array)) return;
		for(var i=0; i<data.length; i++){
			var r = data[i];
			this.addRow(r);
		}
		
	};
	
	DataTable.prototype.addHeader = function(headers){
		
		if(!headers) return;
		if(this.dom.tHead) this.dom.deleteTHead();
		
		var headRow = this.dom.createTHead().insertRow();
		for(var i=0; i<headers.length; i++){
			headRow.insertCell().innerHTML = headers[i];
		}
	};
	
	DataTable.prototype.addRow = function(row){
		
		
		if(!row) return;
		if(!(row instanceof Array)) throw 'Argument must be of type Array';
		
		var tBody = this.dom.tBodies[0]; 
		if(!tBody) tBody = this.dom.createTBody();
		
		var newrow =  tBody.insertRow();
		
		for(var i=0; i < row.length; i++ ){
			
			var cell = newrow.insertCell();
			
			if(typeof(row[i]) == 'object')
				cell.appendChild(row[i]);
			else {
				cell.appendChild(document.createTextNode(row[i]));
			}
		}
	};

	
	
	
}	
});