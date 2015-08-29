/* global _ */
sjs({
	
required:[
	
	{'SpliceJS.UI':'../splice.ui.js'},
	{'SpliceJS.Controls':'splice.controls.scrollpanel.js'},
	{'Doc':  '{sjshome}/modules/splice.document.js'},
	{'Data': '{sjshome}/modules/splice.data.js'},
	'splice.controls.css',
	'splice.controls.datatable.css',
	'splice.controls.datatable.html'
],

definition:function(){
	"use strict";
	
	function _if(obj){
		if(!obj) return {};
		return obj;
	}
	
	// import dependenciess
	var Class = this.framework.Class
	,	Event = this.framework.Event
	,	Component = this.framework.Component
	,	mixin = this.framework.mixin
	,	Doc = this.Doc 
	,	create = this.Doc.create
	,	dom = this.Doc.dom
	,	data = this.Data.data;

	
	var UIControl = this.SpliceJS.UI.UIControl; 
	
	/**
	 * DataTable
	 * */
	var DataTable = Class(function DataTable(args){
		/* call parent constructor */
		UIControl.apply(this,arguments);

		//get body and header tables, they may be one and same table
		this.bodyTable = this.ref.body.elements.table;
		this.headTable = this.ref.head.elements.table;

		/*	
			table type determines scrolling layout
			and header configuration
		*/	
		if(!this.tableType)	this.tableType = 'default';
		

		mixin(this, {
			
			source_data:null,
			dataRows : [],
			headerRow : null,
			pageCurrent:0,
			pageSize: this.pageSize?this.pageSize:100,
			bodyRowTemplate: /*this.rowTemplate  ? this.rowTemplate:*/  DefaultRow,
			headRowTemplate: this.headTemplate ? this.headTemplate: DefaultRow
			
		});
				
		initializeTable.call(this);

	}).extend(UIControl);
	
	
	DataTable.prototype.filterData = function(data_filter){
		this.data_filter = data_filter;
		applyFilter.call(this);
		renderTable.call(this,this.ready_data);
	};
	
	DataTable.prototype.clearFilter = function(){
		this.data_filter = null;
		renderTable.call(this);	
	};
	
	DataTable.prototype.pageNext = function(){
		this.pageCurrent++;	
		renderTable.call(this);
	};

	DataTable.prototype.pagePrev = function(){
		this.pageCurrent--;
		if(this.pageCurrent < 1) this.pageCurrent = 0;
		renderTable.call(this);	
	};

	DataTable.prototype.pageTo = function(page){
		this.pageCurrent = page;	
	};

	/*
	 * Updating data model
	 * - keep count of existing rows
	 * - keep references to individual rows
	 * - iterate over existing rows to update row's calling dataIn on the row object
	 * - if new rows create new rows in the table 
	 * 
	 * */
	DataTable.prototype.dataIn = function(dataInput){
		
		this.source_data = dataInput; 
		
		this.ready_data = { headers: dataInput.headers };
		this.ready_data.data = data(dataInput.data).page(this.pageSize);

		renderTable.call(this,this.ready_data);		
		
	};

	/*
		Datatable events
	*/

	DataTable.prototype.onScroll = Event;
	DataTable.prototype.onPage 	 = Event;



	/**
	 *	'private' calls 
	 */
	function initializeTable(){
		
		Event.attach(window, 'onresize').subscribe(function(){this.reflow();},this);
		
		if(this.elements.defaultScroller){
			Event.attach(this.elements.defaultScroller,'onscroll').subscribe(function(eargs){
				this.elements.headPositioner.style.left = (0 - eargs.source.scrollLeft) + 'px'; 
				this.onScroll();
			},this);
		}
	
		this.onHeadClick = Event.attach(this.headTable,'onmousedown');
		this.onBodyClick = Event.attach(this.bodyTable,'onmousedown');
		
		
		this.onHeadClick.subscribe(function(args){
			
			var colindex = dom(args.source).prop('-sjs-col-index');
			
		},this);
	
	};



	function applyFilter(){
		/*
			Apply search filters
		*/
		if(!this.data_filter) return;
			
		
		var filtered_data = [];
		var source_data = this.source_data.data;
		
		for(var i=0; i < source_data.length; i++){
			for(var j=0; j< source_data[i].length; j++){
				var v = source_data[i][j]; 
				if(!v) continue;	
				if((v+'').indexOf(this.data_filter) > -1) { 
					filtered_data.push(source_data[i]);
					break;
				}
			}
		}

		this.currentPage = 0;
		this.ready_data.data = data(filtered_data).page(this.pageSize);
			
	};


	function renderTable(){
		
		var data 	= this.ready_data.data.to(this.pageCurrent).current
		, 	headers = this.ready_data.headers
		,	columnCount = this.ready_data.headers.length;
		
		/*check and create table body */
		if(!this.bodyTable.tBodies[0]) {
			this.bodyTable.createTBody();
		} 
		
		
		
		/* add columns */
		if(!this.headRow) {
			this.headRow = new this.headRowTemplate({parent:this,columnCount}); 
		}  
		
		this.headRow.dataIn(headers);
		addHeadRow(this.headTable, this.headRow.getNodes());
		
		var data_row = '';
		//update existing rows
		for(var i=0; i < this.dataRows.length && i < data.length; i++) {
			data_row = this.dataRows[i];
			data_row.dataIn(data[i]);	
			addBodyRow(this.bodyTable, data_row.getNodes(), i);
		}
		
		/* create new rows*/
		for(var j=this.dataRows.length; j < data.length; j++ ){
			data_row = new this.bodyRowTemplate({parent:this, columnCount});
			this.dataRows.push(data_row);
			data_row.dataIn(data[j]);
			addBodyRow(this.bodyTable, data_row.getNodes(), j);
		}
		
		truncateRows(this.bodyTable, data.length);	

		this.reflow();
	};

	

	function truncateRows(target,length){
		var tbody = target.tBodies[0];
		
		var d = tbody.rows.length - length;
		
		while(d > 0){
			target.deleteRow(length);
			d--;
		}	
	};





	function addHeadRow(target,nodes) {
				
		/* get or create tHead of a target table */
		var thead = target.tHead;
		if(!thead) { 
			thead = target.createTHead();
			thead.insertRow();
		}		
		
		var row = dom(thead.rows[0]);
	
		/*add new th cells*/
		for(var i= row.size(); i<nodes.length; i++){
			row.append(create('th').prop('-sjs-col-index',i).append(nodes[i]));
		}
	};
	
	function addBodyRow(target,nodes,index){
		var tbody = target.tBodies[0]	
		, 	row = dom(tbody.rows[index]);

		if(!row) row = dom(tbody.insertRow());
		
		/*add new td cells*/
		for(var i= row.size(); i < nodes.length; i++){
			row.append(create('td').append(nodes[i]));
		}
	};
	


	DataTable.prototype.reflow = function(){
		/* user offsetWidth it included border sizes */
		/* 
			try controling table width using cell widths
			instead of setting total table width explicitly
		*/
		//this.elements.columnHeaderTable.style.width = this.elements.dataTable.offsetWidth  + 'px';
		/* measure column sizes */
		
		var	body = this.bodyTable.tBodies[0];
		var head = this.headTable.tHead;
				      
		var wrapper = this.ref.body.elements.tableWrapper;

		if(!body) return; //empty table no records were added

		//!!!!!!!!!!!!!!!!!!!!!!!!!!!!! NEEDS TO WORK WITH CALCULATED STYLES 
		if(body.clientWidth < wrapper.clientWidth) {
			this.bodyTable.style.width = (wrapper.clientWidth - 1)  + 'px';
		}
		
		// we are using scroll panel, reflow
		if(this.ref.scrollPanel) this.ref.scrollPanel.reflow();
		
		if(!body || !head) return;

		
		if(this.elements.defaultScroller){
			var borderCorrection = 1;
			this.elements.defaultScroller.style.top = (head.clientHeight + borderCorrection) + 'px';
		}

		var cells = body.rows[0].cells;
		var heads = head.rows[0].cells;
		for(var i=0; i< cells.length; i++){
			var cell_width = cells[i].clientWidth;
			var cell_width_head = heads[i].clientWidth;
			
			var hstyle = Doc.style(head.rows[0].cells[i]);
			var style = Doc.style(cells[i]);
			
			
			// data cells are smaller than header cells
			if(cell_width < cell_width_head){
				cells[i].style.minWidth = (cell_width_head 
					- style.padding.left.value 
				 	- style.padding.right.value) + 'px';
				
				continue;
			}

			head.rows[0].cells[i].style.minWidth = (cell_width 
				 - hstyle.padding.left.value 
				 - hstyle.padding.right.value) + 'px';
		}
	};



	/**
	 *	Used when row template is not specified 
	 */
	var DefaultRow = function DefaultRow(){
		this.nodes = [];	
	};
	

	DefaultRow.prototype.dataIn = function(data){
		if(!data) return;
		
		//update existing values
		for(var j = 0; j < this.nodes.length; j++ ){
			this.nodes[j].value(data[j]);
		}
		
		//add new nodes
		for(var i = this.nodes.length; i < data.length; i++){
			this.nodes.push(dom.text(data[i]));
		}
	};
	
	DefaultRow.prototype.getNodes = function(){
		return this.nodes;
	};


	/** 
	* Controller class to represent data row 
	*/	
	var DataTableRow =  Class(function DataTableRow(args){
		
		if(args.columnCount) this.columnCount = args.columnCount;
		
		/* 
		 * process content placeholders before they are 
		 * pulled by parent control
		 * */
		var textNodes = Doc.select.textNodes(this.concrete.dom);
		this.contentMap = [];
		
		for(var i=0; i<textNodes.length; i++){
			var value = textNodes[i].nodeValue;
			if(!value) continue;
			if(value.indexOf('@') !== 0) continue;
		
			var key = value.substring(1,value.length);
			
			var span = document.createElement('span');
			textNodes[i].parentNode.replaceChild(span,textNodes[i]);
			this.contentMap[key] = span;
		}
	});
	
	DataTableRow.prototype.onDeleteClick = function(){
		this.onDelete(this.data);
	};

	DataTableRow.prototype.onHighlightValue = function(){};
	
	DataTableRow.prototype.dataIn = function(data, filter_value){
		
		this.data = data;

		for(var key in this.contentMap){
			var node = this.contentMap[key];
			if(!this.contentMap.hasOwnProperty(key)) continue;
			
			var value = data[key];
			if(node){
				if(filter_value) {
					node.innerHTML = splitHighlightValue(value,filter_value);		
				} else {
					node.innerHTML = value;
				}
			}
		}
		
		this.dataOut(this.data);
	};
	
	DataTableRow.prototype.getNodes = function(){
		
	};
	
	DataTableRow.prototype.dataOut = Event;

	function splitHighlightValue(value,hv){
		
		if(value == null || value == undefined) return value;
		value = value.toString();		
		if(value == null || value == undefined) return value;
		
		return value.replace(new RegExp(hv,'gi'),'<span class="-search-result-highlight">'+hv+'</span>');
	}



	
	
	/* data table variat decoder */
	var _DataTable = function _DataTable(args){
	
		if(args.scroll === 'no') 	 return new (Component('NoScrollDataTable')(DataTable))(args);
		if(args.scroll === 'custom') return new (Component('CustomScrollDataTable')(DataTable))(args); 
									 return new (Component('DefaultScrollDataTable')(DataTable))(args);
	};



	//module exports
	return {
		DataTable: _DataTable,
		DataTableRow: DataTableRow
	}

// end module definition
}});