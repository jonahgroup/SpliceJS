/* global sjs */
sjs({
	
required:[
	
	{'SpliceJS.UI':'../splice.ui.js'},
	{'SpliceJS.Controls':'splice.controls.buttons.js'},
	{'SpliceJS.Controls':'splice.controls.scrollpanel.js'},
	{'SpliceJS.Controls':'splice.controls.selectors.js'},
	{'SpliceJS.Controls':'splice.controls.listbox.js'},
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
	
	// import dependencies
	var Class = this.framework.Class
	,	Event = this.framework.Event
	,	Component = this.framework.Component
	,	mixin = this.framework.mixin
	,	debug = this.framework.debug
	,	Doc = this.Doc 
	,	create = this.Doc.create
	,	dom = this.Doc.dom
	,	data = this.Data.data
	,	fdata = this.Data.data
	,	compare = this.Data.compare.default
	,	DataStep = this.Data.DataStep
	,	scope = this;
	
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

		this.sortTrigger = new scope.templates['SortTrigger']();

		/*	
			table type determines scrolling layout
			and header configuration
		*/	
		if(!this.tableType)	this.tableType = 'default';
		

		mixin(this, {
			dataRows : [],
			headCells:[], 	//holds sorting and filtering config
			headerRow : null,
			pageCurrent:0,
			pageSize: this.pageSize?this.pageSize:100,
			bodyRowTemplate: /*this.rowTemplate  ? this.rowTemplate:*/  DefaultRow,
			headRowTemplate: this.headTemplate ? this.headTemplate: DefaultRow,
			headCellTemplate: scope.templates['HeadCell']
		});

		var self = this;
		//data steps
		var dataSteps =  {
			source: new DataStep(function(d){return d;},true),
			
			filter: new DataStep((function(data){
				return applyFilter.call(this,data, this.dataFilter)
			}).bind(this)),
			
			page:	new DataStep(function(data){
				return applyPage.call(self,data)
			}),
			sort:	new DataStep(function(data){
				if(self.sortCell == undefined || self.sortCell == null )
					return data;
				return applySort(data,self.sortCell.index, self.sortCell.sortOrder);
			}),
			render:	new DataStep(function(data){
				return data;
			})
		};
		
		//build data pipeline
		dataSteps.source.add(dataSteps.filter).add(dataSteps.page).add(dataSteps.sort).add(dataSteps.render);
				
		this.dataSteps = dataSteps;
				
		initializeTable.call(this);

	}).extend(UIControl);
	
	
	DataTable.prototype.filterData = function(dataFilter){
		this.dataFilter = dataFilter;
		this.dataSteps.filter.run();
		renderTable.call(this,this.ready_data);
	};
	
	DataTable.prototype.clearFilter = function(){
		this.data_filter = null;
		renderTable.call(this);	
	};
	
	DataTable.prototype.pageNext = function(){
		this.pageCurrent++;
		this.dataSteps.page.run();
		renderTable.call(this);
	};

	DataTable.prototype.pagePrev = function(){
		this.pageCurrent--;
		if(this.pageCurrent < 1) this.pageCurrent = 0;
		this.dataSteps.page.run();
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
		this.dataSteps.source.setdata(dataInput);
		this.dataSteps.source.run();		
		renderTable.call(this);		
	};

	
	
	DataTable.prototype.filterDropDownOpen = function(args){
		
		var groups = data(this.dataSteps.filter.data.data).group(
				function(item){return item[args];}).to(
					function(k,v,i){
						return {key:k, size:v.length};
					}
				).result;
		
		this.onFilterList(groups);
		debug.log('data filter openeed');	
	};
	
	/*
		Datatable events
	*/

	DataTable.prototype.onScroll 		= Event;
	DataTable.prototype.onPage 	 		= Event;
	DataTable.prototype.onRowSelected 	= Event;
	DataTable.prototype.onFilterList 	= Event;
	DataTable.prototype.onCellStyle 	= Event;

	/**
	 *	'private' calls 
	 */
	function initializeTable(){
		
		//horizontal header scrolling		
        if(this.elements.defaultScroller){
            Event.attach(this.elements.defaultScroller,'onscroll').subscribe(function(eargs){
                this.elements.headPositioner.style.left = (0 - eargs.source.scrollLeft) + 'px'; 
                this.onScroll();
            },this);
        }
		
		Event.attach(window, 'onresize').subscribe(function(){this.reflow();},this);
		
		this.onHeadClick = Event.attach(this.headTable,'onmousedown');
		this.onBodyClick = Event.attach(this.bodyTable,'onmousedown');
		
		this.onHeadClick.subscribe(handlerHeadClick,this);
		this.onBodyClick.subscribe(handlerBodyClick,this);
	};


	function handlerHeadClick(args){
		//this is a sorting request
		var th = dom(args.source).parent('th')
		, 	colindex = th.prop('-sjs-col-index')
		,	headCell = this.headCells[colindex];
		
		this.sortCell = headCell;
		
		if( headCell.elements.filterTrigger   !== args.source && 
			headCell.elements.filterIndicator !== args.source ){
			sortTable.call(this,headCell);
		} else {
			pickFilter.call(this,headCell);
		}
	};


	function sortComparator(columnIndex, order){
		return function(a,b){
			return order * compare(a[columnIndex], b[columnIndex]);	
		}
	};

	function applyFilter(source, filter){

		if(!filter) { 
			return source;
		}
		
		var filtered_data = [];
		var source_data = source.data;
		var headers = source.headers; 
		
		for(var i=0; i < source_data.length; i++){
			for(var j=0; j< source_data[i].length; j++){
				var v = source_data[i][j]; 
				if(!v) continue;	
				if((v+'').indexOf(filter) > -1) { 
					filtered_data.push(source_data[i]);
					break;
				}
			}
		}
		return {data:filtered_data, headers:headers};
	};
	
	function applyPage(source){
		
		var headers = source.headers;
		var records = source.data;
		
		return {
			headers:headers, 
			data:data(records).page(this.pageSize).to(this.pageCurrent).current,
		};
	};
	
	//this is in place sorting
	function applySort(source,columnIndex,order){
		
		var headers = source.headers;
		var records = source.data;
		
		data(records).sort(sortComparator(columnIndex, order)).asc();				
		return {	headers: headers, 
					data:records, 
		};
	};
	
	function sortTable(headCell){
		//set initial sort order to ascending
		if(headCell.sortOrder == undefined){
			headCell.sortOrder = 1; //asc
		}
		
		
		headCell.sortOrder = -1 * headCell.sortOrder;
		var className = headCell.sortOrder == 1?'up':'down';
		
		dom(headCell.elements.root).append(dom(this.sortTrigger.concrete.dom));
		dom(this.sortTrigger.concrete.dom).class.remove('up down').add(className);

		this.dataSteps.sort.run();
		renderTable.call(this);
	};
	
	function applyDataPipeline(){
		applyFilter.call(this,this.dataSources.original);	
		applyPage.call(this,this.dataSources.filter);
		applySort.call(this,this.dataSources.page);
		this.dataSources.render = this.dataSources.sort;
	};


	function pickFilter(headCell){
		debug.log('picking filters');
	};

	function handlerBodyClick(args){
		
	};


	function renderTable(){
		
		
		var data 	= this.dataSteps.render.data.data
		, 	headers = this.dataSteps.render.data.headers;
		
		var columnCount = headers.length;
		
		/*check and create table body */
		if(!this.bodyTable.tBodies[0]) {
			this.bodyTable.createTBody();
		} 
		
		/* add columns based on the template */
		if(!this.headRow) {
			this.headRow = new this.headRowTemplate({parent:this,columnCount}); 
		}  
		//update create header row template nodes		
		this.headRow.dataIn(headers);
		
		/*  wrap nodes into header cells, 
		 *	to give us sorting controls and options triggers 
		 */ 
		var nodes = updateHeadCells.call(this, this.headRow.getNodes()); 
		 
		// add nodes to the table head
		addHeadRow(this.headTable, nodes);
		
		var data_row = '';
		//update existing rows
		for(var i=0; i < this.dataRows.length && i < data.length; i++) {
			data_row = this.dataRows[i];
			data_row.dataIn(data[i]);	
			addBodyRow(this.bodyTable, data_row.getNodes(), i);
		}

		
		/* create new rows*/
		/*
		for(var j=this.dataRows.length; j < data.length; j++ ){
			data_row = new this.bodyRowTemplate({parent:this, columnCount});
			this.dataRows.push(data_row);
			data_row.dataIn(data[j]);
			addBodyRow(this.bodyTable, data_row.getNodes(), j);
		}
		*/
		
		
		fdata( data.length - this.dataRows.length ).asyncloop((function(j){
			j = j + this.dataRows.length;
			data_row = new this.bodyRowTemplate({parent:this, columnCount});
			this.dataRows.push(data_row);
			data_row.dataIn(data[j]);
			addBodyRow(this.bodyTable, data_row.getNodes(), j);
		
		}).bind(this),70)();
		
		
		/* remove extra rows */
		truncateRows(this.bodyTable, data.length);	

		this.reflow();
	};

	//returns a get of nodes
	function updateHeadCells(nodes){
		
		for(var i = this.headCells.length; i < nodes.length; i++){
			//no parent dependency here
			var cell = new this.headCellTemplate({parent:this});	
				cell.index = i;
				cell.onData(cell.index);
			this.headCells.push(cell);
			dom(cell.elements.content).append(nodes[i]);
		} 	
		var nodes = [];
		for(var j=0; j<this.headCells.length; j++){
			nodes.push(dom(this.headCells[j].concrete.dom));			
		}
		return nodes;
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
		
		
		var	body = this.bodyTable.tBodies[0]
		,	head = this.headTable.tHead;
				      
		var wrapper = this.ref.body.elements.tableWrapper;

		if(!body) return; //empty table no records were added

		//!!!!!!!!!!!!!!!!!!!!!!!!!!!!! NEEDS TO WORK WITH CALCULATED STYLES 
		if(body.clientWidth < wrapper.clientWidth) {
			this.bodyTable.style.width = (wrapper.clientWidth - 1)  + 'px';
			//this.headTable.style.width = (wrapper.clientWidth - 1)  + 'px';
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


	var FilterList = Component('FilterList')(function FilterListController(){
		
	});
	
	
	FilterList.prototype.dataIn = function(data){
			this.onData(data);
	};
	
	FilterList.prototype.createFilter = function(){
		
	};

	FilterList.prototype.onData = Event;

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