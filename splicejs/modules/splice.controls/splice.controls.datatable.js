/* global sjs */
$js.module({
type:'component'
,
imports:[
	{ Inheritance : '/{$jshome}/modules/splice.inheritance.js'},
	{ Component		: '/{$jshome}/modules/splice.component.core.js'},
	{ Events			: '/{$jshome}/modules/splice.event.js'},
	{'SpliceJS.UI':'../splice.ui.js'},
	{'SpliceJS.Controls':'splice.controls.buttons.js'},
	{'SpliceJS.Controls':'splice.controls.scrollpanel.js'},
	{'SpliceJS.Controls':'splice.controls.selectors.js'},
	{'SpliceJS.Controls':'splice.controls.datafilter.js'},
	{'Doc':  '/{$jshome}/modules/splice.document.js'},
	{'Data': '/{$jshome}/modules/splice.data.js'},
	{ Utils	: '/{$jshome}/modules/splice.util.js'},
	'splice.controls.css',
	'splice.controls.datatable.css',
	'splice.controls.datatable.html'
]
,
definition:function(){
	"use strict";

	var scope = this
	,	sjs = scope.imports.$js;

	function _if(obj){
		if(!obj) return {};
		return obj;
	}

	// import dependencies
	var imports = scope.imports
    ,   mixin = sjs.mixin
	;

	var	Class 	    = imports.Inheritance.Class
	,	Doc 		= imports.Doc
	,	create 		= imports.Doc.create
	,	dom 		= imports.Doc.dom
	,	cssvalue 	= imports.Doc.cssvalue
	,	data 		= imports.Data.data
	,	fdata 		= imports.Data.data
	,	compare 	= imports.Data.defaultComparator
	,	DataStep 	= imports.Data.DataStep
	,   UIControl   = imports.SpliceJS.UI.UIControl
	,	Event 		= imports.Events.event
	,	Controller  = imports.Component.Controller
	,	log 			= imports.Utils.log
	,	debug 			= imports.Utils.log.debug
	;

	/**
	 * DataTable
	 * */
	var DataTable = Class(function DataTableController(args){
		/* call parent constructor */
		this.base(args);

		//get body and header tables, they may be one and same table
		this.bodyTable = this.ref.body.elements.table;
		this.headTable = this.ref.head.elements.table;

		//scroll panel reference, to configure scrolling parameters
		this.scrollPanel = this.ref.scrollPanel;

		//sort trigger singleton
		this.sortTrigger = new scope.components.SortTrigger();

		//gouping filter cache
		this.filterCache = {
			calculated:[], applied:[], column:-1
		};


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
			bodyRowTemplate: this.rowTemplate  ? this.rowTemplate: DefaultRow,
			headRowTemplate: this.headTemplate ? this.headTemplate: DefaultRow,
			headCellTemplate: scope.components.HeadCell
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

			frame:	new DataStep(function(data){
				return applyFrame.call(self,data);
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
		dataSteps.source.add(dataSteps.filter)
		.add(dataSteps.page)
		.add(dataSteps.frame)
		.add(dataSteps.sort)
		.add(dataSteps.render);

		this.dataSteps = dataSteps;

		this.scrollMetrics = {bufferScale:0, bufferSize:100};

		initializeTable.call(this);

	}).extend(UIControl);


	DataTable.prototype.filterData = function(dataFilter){

		for(var i=0; i<dataFilter.length; i++){
			dataFilter[i].isApplied = true;
		}

		this.filterCache.applied[this.filterCache.column] = dataFilter;

/*
		this.dataFilter = dataFilter;
		this.dataSteps.filter.run();
		renderTable.call(this,this.ready_data);
*/
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

		//column index
		var idx = args;

		this.filterCache.column = idx;

		//get filter cache
		var groups = this.filterCache.calculated[idx];

		if(!groups) {
			groups = data(this.dataSteps.filter.data.data).group(
				function(item){return item[args];}).to(
					function(v,k,i){
						return {key:k, size:v.length};
					}
				).array();
				this.filterCache.calculated[idx] = groups;
		}

		this.onFilterList(groups);
		debug.log('data filter openeed');
	};

	/*
		Datatable events
	*/

	DataTable.prototype.onScroll 		= Event;
	DataTable.prototype.onPage 	 		= Event;
	DataTable.prototype.onRowSelected 	= Event;
	DataTable.prototype.onFilterList 		= Event;
	DataTable.prototype.onCellStyle 		= Event;


	DataTable.prototype.dispose = function(){
			console.log('releasing table');
			this.onWindowResize.unsubscribe(reflowTable);
			Controller.prototype.dispose.call(this);
	};

	/* callback for window's on resize event*/
	function reflowTable(){
		this.reflow();
	}

	/**
	 *	'private' calls
	 */
	var direction = 0;
	function initializeTable(){

		//horizontal header scrolling
  	if(this.elements.defaultScroller){
        Event.attach(this.elements.defaultScroller,'onscroll').subscribe(function(eargs){
            this.elements.headPositioner.style.left = (0 - eargs.source.scrollLeft) + 'px';
						this.onScroll(eargs.source.scrollTop);
        },this);
    }

		//on mouse down handler for rearanging columns by dragging
		Event.attach(this.headTable,'onmousedown').subscribe(function(){
			console.log('test');
		});

		//!!!!! TODO: review reflow model
		this.onWindowResize = Event.attach(window, 'onresize').subscribe(reflowTable, this);

		this.onHeadClick = Event.attach(this.headTable,'onmousedown');
		this.onBodyClick = Event.attach(this.bodyTable,'onmousedown');

		this.onHeadClick.subscribe(handlerHeadClick,this);
		this.onBodyClick.subscribe(handlerBodyClick,this);

	//	this.scrollPanel.isScrollClient = false;
		this.scrollPanel.onScroll.subscribe(function(args){
			if(args.vector > 0) direction = 1;
			else direction = -1;

			var sm = this.scrollMetrics;
			sm.bufferScale = (sm.dataSize - sm.bufferSize)  * args.position / args.height ;
			renderTable.call(this);
		},this);

	};


	function handlerHeadClick(args){
		//this is a sorting request
		var th = dom(args.source).parent('th')
		, 	colindex = th.prop('-sjs-col-index')
		,	headCell = this.headCells[colindex];

		this.sortCell = headCell;

		if( headCell.ref.filterTrigger.elements.filterTrigger   !== args.source &&
			  headCell.ref.filterTrigger.elements.filterIndicator !== args.source ){
				sortTable.call(this,headCell);
		} else {
			pickFilter.call(this,headCell);
		}
	};


	function handlerBodyClick(args){
		console.log(args.source);
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
			data:records//.page(this.pageSize).to(this.pageCurrent)
		};
	};


	function applyFrame(source){


		return source;
	};


	//this is in place sorting
	function applySort(source,columnIndex,order){

		var headers = source.headers;
		var records = source.data;

		data(records).sort(sortComparator(columnIndex, order)).asc();
		return {	headers: headers,
					data:records
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
		dom(this.sortTrigger.concrete.dom).cl.remove('up down').add(className);

		this.dataSteps.sort.run();
		renderTable.call(this);
	};

	function applyDataPipeline(){
		applyFilter.call(this,this.dataSources.original);
		applyPage.call(this,this.dataSources.filter);
		applySort.call(this,this.dataSources.page);
		this.dataSources.render = this.dataSources.sort;
	};



	function measureClient(recordCount){

		//1. measure client area
		var box = dom(this.scrollPanel.elements.scrollClient).box();
		var client_height = cssvalue(box.height);
	};


	function measureRecordSet(){

	};

	/**

	*/
	function renderTable(){

		var fn_start = window.performance.now();


		var data 	= this.dataSteps.render.data.data
		, 	headers = this.dataSteps.render.data.headers;

		this.scrollMetrics.dataSize = data.length;


		var start = Math.round(this.scrollMetrics.bufferScale);
		var end  = start + this.scrollMetrics.bufferSize;

		var columnCount = headers.length;

		/*check and create table body */
		if(!this.bodyTable.tBodies[0]) {
			this.bodyTable.createTBody();
		}

		/* add columns based on the template */
		if(!this.headRow) {
			this.headRow = new this.headRowTemplate({parent:this,columnCount:columnCount});
		}
		//update create header row template nodes
		this.headRow.dataIn({data:headers});

		/*  wrap nodes into header cells,
		 *	to give us sorting controls and options triggers
		 */
		var nodes = updateHeadCells.call(this, this.headRow.getNodes());

		// add nodes to the table head
		addHeadRow(this.headTable, nodes);


		var data_row = '';

		//update existing rows
		for(var i=0; i < this.scrollMetrics.bufferSize && i  < this.dataRows.length;  i++) {
			data_row = this.dataRows[i];
			data_row.dataIn({
					level: this.isTreeTable?data[i+start][1]:0,
					children:true,
					expanded:false,
					data:data[i+start]
			});
			addBodyRow(this.bodyTable, data_row.getNodes(), i);
		}


		/* create new rows*/
		for(var j = this.dataRows.length; j < this.scrollMetrics.bufferSize; j++ ){

			//data_row = new this.bodyRowTemplate({parent:this, columnCount});
			if(this.isTreeTable)
				data_row = new TreeRow(new this.bodyRowTemplate({parent:this, columnCount:columnCount}));
			else
				data_row = new this.bodyRowTemplate({parent:this, columnCount:columnCount});

			this.dataRows.push(data_row);
			data_row.dataIn({
				level: this.isTreeTable?data[j+start][1]:0,
				children:true,
				expanded:false,
				data:data[j+start]
			});
			addBodyRow(this.bodyTable, data_row.getNodes(), j);
		}

		//var drl = this.dataRows.length;
		/*
		fdata( data.length - this.dataRows.length ).asyncloop((function(j){
			j = j + drl;
			data_row = new this.bodyRowTemplate({parent:this, columnCount});
			this.dataRows.push(data_row);
			data_row.dataIn(data[j]);
			addBodyRow(this.bodyTable, data_row.getNodes(), j);

		}).bind(this),70)();
*/

		/* remove extra rows */
	//	truncateRows(this.bodyTable, data.length);

		this.reflow();

		var fn_end = window.performance.now();
		console.log('DataTable frame rate ' + 1000/(fn_end-fn_start));
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
		return row;
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



	/**
	 *	Used when row template is not specified
	 */
	var DefaultRow = function DefaultRow(){
		this.nodes = [];
	};


	DefaultRow.prototype.dataIn = function(item){
		if(!item) return;

		var data = item.data;

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
	 *	This is a wrapper row to srap
	 */
	var TreeRow = function TreeRow(rowTemplate){
				this.row = rowTemplate;
				this.nodes = [];

				this.trigger = new scope.components.HierarchyTrigger();

				this.arrow = dom(this.trigger.elements.trigger);
				this.padding = dom(this.trigger.elements.padding);

				this.s = this.trigger.concrete.dom.style;
	};

	TreeRow.prototype.dataIn = function(item){
				if(!item) return;
				this.row.dataIn(item);

				// initial node creation
				if(this.nodes.length == 0) {
						var innerNodes = this.row.getNodes();
						dom(this.trigger.elements.value).append(innerNodes[0]);
						this.nodes.push(dom(this.trigger.concrete.dom));
						for(var i=1; i < innerNodes.length; i++){
								this.nodes.push(innerNodes[i]);
						}
				}

				//update level offset
				this.s.paddingLeft = (item.level * 20) +'px';

				if(item.children === true) {
					this.arrow.cl.add('arrow');
				}

				if(item.expanded === true){
					this.arrow.cl.add('down');
				}
	};

	TreeRow.prototype.getNodes = function(){
			return this.nodes;
	};






	/**
	* Controller class to represent data row
	*/
	var DataTableRow =  Class(function DataTableRow(args){

		if(args.columnCount) this.columnCount = args.columnCount;

		//reference to raw children nodes
		this.childrenNodes = this.concrete.dom.children;
		//get children nodes
		this.nodes = [];
	});


	DataTableRow.prototype.dataIn = function(item){

		var data = item.data;

		//update nodes
		for(var i = 0; i < this.nodes.length; i++){
			this.nodes[i].value(data,i,'te');
		}

		//add new nodes
		for(var i = this.nodes.length; i < item.data.length; i++ ){
			var d = dom(this.childrenNodes[i]);
			this.nodes.push(d);
			d.value(data,i);
		}

		this.dataOut(item);

	}

	DataTableRow.prototype.onDeleteClick = function(){
		this.onDelete(this.data);
	};

	DataTableRow.prototype.onHighlightValue = function(){};


	DataTableRow.prototype.getNodes = function(){
		return this.nodes;
	};

	DataTableRow.prototype.dataOut = Event;

	function splitHighlightValue(value,hv){

		if(value == null || value == undefined) return value;
		value = value.toString();
		if(value == null || value == undefined) return value;

		return value.replace(new RegExp(hv,'gi'),'<span class="-search-result-highlight">'+hv+'</span>');
	}


	/**
	 *		DataTable variat factory
	 */
	var DataTable = Class(function DataTable(args){

		var components = scope.components;

		var result = null;

		if(args.scroll === 'no') 			result =  new components.NoScrollDataTable(args);
		if(args.scroll === 'custom') 	result =  new components.CustomScrollDataTable(args);
		result =  new components.DefaultScrollDataTable(args);

		result.__sjs_type__ = 'DataTable';

		return result;

	});


	//module exports
	scope.exports(
		DataTable,
		DataTableRow
    );

// end module definition
}
});
