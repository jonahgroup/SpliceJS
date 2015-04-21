_.Module({
	
required:[
	'modules/splice.controls/splice.controls.css',
	'modules/splice.controls/splice.controls.scrollpanel.js',
	'modules/splice.controls/splice.controls.datatable.htmlt'],

definition:function(){
	
	
	/**
	 * DataTable
	 * */
	var DataTable = _.Namespace('SpliceJS.Controls').Class(function DataTable(args){
		/* call parent constructor */
		SpliceJS.Controls.UIControl.apply(this,arguments);
		
		var self = this;

		this.dom = this.ref.scrollPanel.ref.tableBody.elements.dataTable;
		this.elements.dataTable = this.ref.scrollPanel.ref.tableBody.elements.dataTable;
		this.elements.columnHeaderTable = this.ref.scrollPanel.ref.tableHeader.elements.columnHeaderTable;

		this.dataRows = [];
		this.haderRow = null;



		
	}).extend(SpliceJS.Controls.UIControl);
	
	

	/*
	 * Updating data model
	 * - keep count of existing rows
	 * - keep references to individual rows
	 * - iterate over existing rows to update row's calling dataIn on the row object
	 * - if new rows create new rows in the table 
	 * 
	 * */
	DataTable.prototype.dataIn = function(dataInput){
		
		var data 	= dataInput.data;
		var headers = dataInput.headers;
		
		/* add columns */
		if(headers instanceof Array) {
			
			if(this.headerRow) this.headerRow.dataIn(headers);
			else {
				/* custom header row content */
				if(this.headerTemplate){
					this.headerRow = new this.headerTemplate({parent:this});
					this.headerRow.dataIn(headers);
					
					this.addDomHeader(this.headerRow.concrete.dom);
				}
				/* standard table header row */
				else {
					this.addHeaderRow(headers);
				}
			}
		}
		
		
		/* data must be an array of objects */
		if(!(data instanceof Array)) return;
		
		
		/* udpate existing rows */
		for(var j=0; j < this.dataRows.length; j++){
			if(!data[j]){
				/* remove extra dataRows and table rows*/
				
				for(var k=this.dataRows.length-1; k>=j; k--){
					
					this.removeRowByIndex(k+1); //!!!!! this is because of the header row
					this.dataRows.splice(k,1);
				}
				
				break;
			}
			this.dataRows[j].dataIn(data[j]);
		}

				
		/* add new rows*/
		for(var i=j; i<data.length; i++){
			var r = data[i];
			
			/* insert templated row */
			if(this.itemTemplate) {
				var dataRow = new this.itemTemplate({parent:this});
				
				this.dataRows.push(dataRow);
				
				dataRow.dataIn(r);
				if(! (dataRow.concrete instanceof SpliceJS.Modular.Concrete)) throw 'DataTable: rowTemplate type is invalid must be concrete';
				this.addDomRow(dataRow.concrete.dom);
				continue;
			}
			this.addRow(r);
		}
		
		
		this.reflow();

	};
	
	
	DataTable.prototype.removeRowByIndex = function(rowIndex){
		this.dom.deleteRow(rowIndex);
	};
	
	DataTable.prototype.clear = function(){
		
	};
	

	
	DataTable.prototype.addRowTo = function(destination, row){
		
		var newrow =  destination.insertRow();
		
		for(var i=0; i < row.length; i++ ){
			
			var cell = newrow.insertCell();
			
			if(typeof(row[i]) == 'object')
				cell.appendChild(row[i]);
			else {
				cell.appendChild(document.createTextNode(row[i]));
			}
		}
	};

	DataTable.prototype.addHeaderRow = function(dom,headers){

		if(!headers) 	return;
		if(!dom)		return;
		if(dom.tHead) dom.deleteTHead();
		
		var tHead = dom.createTHead();
		
		this.addRowTo(tHead, headers);
	};


	
	
	
	
	DataTable.prototype.addBodyRow = function(row){
		
		if(!row) return;
		if(!(row instanceof Array)) throw 'Argument must be of type Array';
		
		var tBody = this.dom.tBodies[0]; 
		if(!tBody) tBody = this.dom.createTBody();
		
		this.addRowTo(tBody,row);
	};

	DataTable.prototype.addDomRow = function(dom){
		var row = [];	
		for(var i=0; i< dom.childNodes.length; i++){
			var node = dom.childNodes[i];
			/* element nodes only */
			if(node.nodeType === 1) row.push(node);
		}
		this.addBodyRow(row);
	};



	DataTable.prototype.addDomHeader = function(dom){
		var row = [];	
		for(var i=0; i< dom.childNodes.length; i++){
			var node = dom.childNodes[i];
			/* element nodes only */
			if(node.nodeType === 1) row.push(node);
		}

		if(!this.elements.columnHeaderTable) {
			this.addHeaderRow(this.elements.dataTable, row);
			return;
		}

		/*
			Data table gets cloned row
		*/
		var cloned = [];
		for(var i=0; i<row.length; i++){
			cloned[i] = row[i].cloneNode(true);
		}

		this.addHeaderRow(this.elements.columnHeaderTable, row);
		this.addHeaderRow(this.elements.dataTable, cloned);

	};



	DataTable.prototype.reflow = function(){
		/* user offsetWidth it included border sizes */
		/* 
			try controling table width using cell widths
			instead of setting total table width explicitly
		*/
		//this.elements.columnHeaderTable.style.width = this.elements.dataTable.offsetWidth  + 'px';
		/* measure column sizes */
		var body = this.elements.dataTable.tHead;
		var head = this.elements.columnHeaderTable.tHead;
		
		if(!body || !head) return;
		
		this.ref.scrollPanel.reflow();

		var cells = body.rows[0].cells;
		for(var i=0; i< cells.length; i++){
			
			var cellWidth = cells[i].clientWidth;
			var style = _.Doc.style(cells[i]);

			head.rows[0].cells[i].style.minWidth = (cellWidth 
				 - style.padding.left.value 
				 - style.padding.right.value) + 'px';
		}
		
	};




	
	var DataTableRow =  _.Namespace('SpliceJS.Controls').Class(function DataTableRow(args){
		
		/* 
		 * process content placeholders before they are 
		 * pulled by parent control
		 * */
		var textNodes = _.Doc.selectTextNodes(this.concrete.dom);
		this.contentMap = [];
		
		for(var i=0; i<textNodes.length; i++){
			var value = textNodes[i].nodeValue;
			if(!value) continue;
			if(!value.startsWith('@')) continue;
		
			var key = value.substring(1,value.length);
			
			var span = document.createElement('span');
			textNodes[i].parentNode.replaceChild(span,textNodes[i]);
			this.contentMap[key] = span;
		}
		
		
		
	});
	
	DataTableRow.prototype.selectRow = function(){
		_.debug.log('select row');
	};
	
	DataTableRow.prototype.onDeleteClick = function(){
		this.onDelete(this.data);
	};

	DataTableRow.prototype.onHighlightValue = function(){};
	
	DataTableRow.prototype.dataIn = function(data){
		
		var textNodes = _.Doc.selectTextNodes(this.concrete.dom);
		this.data = data;
		

		var highlightValue = null;
		if(this.onHighlightValue) {
			var highlightValue = this.onHighlightValue();
		}



		for(var key in this.contentMap){
			var node = this.contentMap[key];
			if(!this.contentMap.hasOwnProperty(key)) continue;
			
			var value = data[key];
			if(node){
				if(highlightValue) {
					node.innerHTML = splitHighlightValue(value,highlightValue);		
				} else {
					node.innerHTML = value;
				}
			}
		}
		
		this.dataOut(this.data);
	};
	
	DataTableRow.prototype.dataOut = new _.Multicaster();

	function splitHighlightValue(value,hv){
		
		return value.replace(hv,'<span class="-search-result-highlight">'+hv+'</span>');
	}

// end module definition
}});