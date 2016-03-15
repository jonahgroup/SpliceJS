sjs.module({
type:'component',
required:[
	{ Inheritance : '/{sjshome}/modules/splice.inheritance.js'},
	{ Component		: '/{sjshome}/modules/splice.component.core.js'},
	{ Events			: '/{sjshome}/modules/splice.event.js'},
	{'SpliceJS.UI':'/{sjshome}/modules/splice.ui.js'},
	'splice.controls.gridlayout.css',
	'splice.controls.gridlayout.html'
]
,
definition:function(sjs){
	var scope = this.scope
	,	exports = sjs.exports
	,	debug = sjs.log.debug
	;

	var
		Class 		= scope.Inheritance.Class
	,	UIControl = scope.SpliceJS.UI.UIControl
	,	DragAndDrop = scope.SpliceJS.UI.DragAndDrop
	,	event 			= scope.Events.event
	,	proxy 			= scope.Component.proxy
	;


	var Grid = function Grid(rows,columns){
		this.rows 		= rows;
		this.columns 	= columns;

		//fill matrix, keeps track of the grid fill positions
		this.positions = Array(this.rows*this.columns);
	};

	Grid.prototype.fillGrid = function(row, col, rowspan, colspan, card){
		for(var i=row; i < row+rowspan; i++){
			for(var j=col; j < col + colspan; j++) {
				this.positions[i*this.columns+j] = card;
			}
		}
	};

	Grid.prototype.clear = function(){
		for(var i=0; i<this.positions.length; i++){
			this.positions[i] = 0;
		}
	};

	Grid.prototype.setSize = function(rows, columns){
		this.rows = rows;
		this.columns = columns;
	};

	/*
	 * Returns content of the grid cell if any
	 * */
	Grid.prototype.getCellContent = function(row,column){
		return this.positions[row*this.columns+column];
	};


	Grid.prototype.emptyCell = function(){
		for(var i=0; i<this.positions.length; i++){
			if(!this.positions[i]){
				return {row:Math.floor(i/this.columns),
						col:i % this.columns};
			}
		}
	};

	var left 	= 1
	,	top 	= 2
	,	right 	= 3
	,	bottom 	= 4
	,	move 	= 5;
	/*
	*
	*	Cell container class
	*
	*/
	var CellContainer = Class(function CellContainerController(args){
		this.super();

		event(this).attach({
			onAdd 				: event.multicast,
			onStartMove 	:	event.multicast,
			onMove 	  		: event.multicast,
			onEndMove 		: event.multicast,
			onStartResize : event.multicast,
			onResize 	    : event.multicast,
			onEndResize   : event.multicast,
			onCellSize 	  : event.multicast,
			onRemove 			: event.multicast,
			onMaximize 		: event.multicast
		})

		this.onStartResize.subscribe(this.startResize, this);
		this.onResize.subscribe(this.resize, this);
		this.onEndResize.subscribe(this.endResize, this);
		this.onStartMove.subscribe(this.startMove,this);

	}).extend(UIControl);

	CellContainer.prototype.initialize = function(){
		//initialize user interraction events
		event(this.views.leftEdge).attach({
			onmousedown : event.unicast
		}).onmousedown.subscribe(
			function(e){this.onStartResize(e,left);}, this
		);

		event(this.views.topEdge).attach({
			onmousedown : event.unicast
		}).onmousedown.subscribe(
			function(e){this.onStartResize(e,top);}, this
		);

		event(this.views.rightEdge).attach({
			onmousedown : event.unicast
		}).onmousedown.subscribe(
			function(e){this.onStartResize(e,right);}, this
		);

		event(this.views.bottomEdge).attach({
			onmousedown	:	event.unicast
		}).onmousedown.subscribe(
			function(e){this.onStartResize(e,bottom);}, this
		);
	};

	CellContainer.prototype.startResize = function(e,direction){
		debug.log('Resizing in ' + direction + ' direction');
		DragAndDrop.startDrag(e.source, e.domEvent);

		var self = this;
		DragAndDrop.ondrag =  function(p,offset){
			self.onResize({mouse:p,direction:direction, src:self});
			self.onCellSize(self);
		}
	};


	CellContainer.prototype.startMove = function(){
		DragAndDrop.startDrag();

		var self = this;
		DragAndDrop.ondrag =  function(p,offset){
			self.onResize({mouse:p,direction:move, src:self});
			self.onCellSize(self);
		}
	};


	CellContainer.prototype.reflowChildren = function(position, size, bubbleup){
		UIControl.prototype.reflowChildren.call(this,{left:0, top:0}, size, bubbleup);
	};

	CellContainer.prototype.remove = function(){
		this.onRemove(this);
	};

	CellContainer.prototype.maximize = function(){
		this.onMaximize(this);
	};

	var DEFAULT_OUTTER_MARGIN = 10;
	var DEFAULT_MARGIN = 10;


	/**
	*
	*	Grid Layout implementation
	* @constructor
	*/
	var GridLayout = Class(function GridLayoutController(){
		this.super();

		event(this).attach({
			onRemoveCell : event.multicast
		});


		/* default gap values */
		if(!this.margin) 		this.margin = 10;
		if(!this.outerMargin) 	this.outerMargin = 10;

		/* default grid configuration */
		if(!this.grid)			this.grid = {columns:2, rows:2};
		this.grid = new Grid(this.grid.rows, this.grid.columns);



		// a collection of cells, contained in a null object
		this.layoutCells = Object.create(null);
		// cell sequence counter
		this.cellSequence = 1;

		this.onDisplay.subscribe(this.display, this);

	}).extend(UIControl);


	GridLayout.prototype.initialize = function(){
		/*
			hook into window resize event only if grid layout
			is configured as a toplevel component
		*/
		if(this.attachToWindow === true ) {
			event(window).attach({
				onresize : event.multicast}
			).onresize.subscribe(this.reflow	,this);
	 }
	};



	GridLayout.prototype.display = function(){

		/* processes layout cells */
		if(this.cells && this.cells.length > 0){

			for(var i=0; i< this.cells.length; i++) {
				addCell.call(this,	this.cells[i].content,
					[this.cells[i].row, this.cells[i].col,
					this.cells[i].rowspan, this.cells[i].colspan]);
			}
			this.reflow();
		}
	};


	/* private */
/*
	function restoreCell(cell){
	//	cell.onResize.subscribe(this.resizeCell, this);
	//	cell.onRemove.subscribe(this.removeCell, this);
		this.layoutCells[cell.index] = cell;
		this.views.root.appendChild(cell.concrete.dom);
		cell.onAttach();
		cell.onDisplay();
	}
*/
	function addCell(content, position){
		if(content instanceof CellContainer){
			this.layoutCells[content.index] = content;

			if(content.isSoftRemoved) {
				content.concrete.dom.style.display = 'block';
				content.isShown = true;
				content.onDisplay();
				return;
			}

			//add cell
			this.content(content).add();

			content.isAttached = true;
			content.isShown = true;

			content.onAttach();
			content.onDisplay();
			content.onAdd(content);
			return;
		}

		var row = position[0]
		,	col = position[1]
		,	rowSpan = position[2]
		,	colSpan = position[3];

		var _CellContainer = proxy(
		{	type:'CellContainer',
			row:row,
			col:col,
			colspan:colSpan,
			rowspan:rowSpan,
			content:{body: content}
		});

		var cellIndex = this.cellSequence++;

		var cell =  new _CellContainer({parent:this, index:cellIndex});

		cell.onResize.subscribe(this.resizeCell, this);
		cell.onRemove.subscribe(this.removeCell, this);
		cell.onMaximize.subscribe(this.maximizeCell,this);

		this.layoutCells[cell.index] = cell;
		this.content(cell).add();
		cell.onAttach();
		cell.onDisplay();
		cell.onAdd(cell);

		return cell;
	};


	GridLayout.prototype.getCell = function(position){
			if(!position) position = [];

			var row = position[0]
			,	col = position[1]
			,	rowSpan = position[2]
			,	colSpan = position[3];

			//next empty cell is a default position of the cell
			if(row == null || col == null) {
				var position = this.getEmptyCell();
				row  = position.row;
				col = position.col;
				rowSpan = 1;
				colSpan = 1;
			}

			var _CellContainer = proxy(
			{	type:'CellContainer',
				row:row,
				col:col,
				colspan:colSpan,
				rowspan:rowSpan
			});

			var cellIndex = this.cellSequence++;

			var cell =  new _CellContainer({parent:this, index:cellIndex});

			cell.onResize.subscribe(this.resizeCell, this);
			cell.onRemove.subscribe(this.removeCell, this);
			cell.onMaximize.subscribe(this.maximizeCell,this);

			return cell;

	};

	GridLayout.prototype.addCell = function(){
		var cell = addCell.apply(this,arguments);
		this.reflow();
		return cell;
	};


	/**
		Atempts to restore layout cell
	*/
	GridLayout.prototype.restoreCell = function(){
		restoreCell.apply(this,arguments);
		this.reflow();
	};

	/**
		Returns a collection of the layout cells
		@return {object} - indexed hash map, where index is an integer
											 indexes are not always sequential
	*/
	GridLayout.prototype.getCells = function(){
		return this.layoutCells;
	};

	/**
		Removes all cells from the layout
	*/
	GridLayout.prototype.clear = function(){
			var keys = Object.keys(this.layoutCells);

			for(var key in keys){
					var cell = this.layoutCells[keys[key]];
					cell.isAttached = false;
					cell.isShown = false;
					this.views.root.removeChild(cell.concrete.dom);
			}
			this.layoutCells = Object.create(null);
	};

	GridLayout.prototype.maximizeCell = function(cell){
		console.log('Maximizing cell');
	};

	/**
		Removes single cell
		@param {CellContainerController} cell - cell to be deleted
	*/
	GridLayout.prototype.removeCell = function(cell,isSoft){

		if(isSoft){
			cell.concrete.dom.style.display = 'none';
			cell.isSoftRemoved = true;

		}
		else {
			this.views.root.removeChild(cell.concrete.dom);
			cell.isAttached = false;
		}

		cell.isShown = false;

		delete this.layoutCells[cell.index];
		this.onRemoveCell(cell,isSoft);

	};


	GridLayout.prototype.getEmptyCell = function(){

		var to = this.grid.rows * this.grid.columns
		,	cells = this.layoutCells;

		var keys = Object.keys(this.layoutCells);

		for(var i=0; i < to; i++){
			var row = Math.floor(i / this.grid.columns)
			, 	col = i % this.grid.columns
			,	test = true;

			for(var j=0; j< keys.length; j++){
				var cell = cells[keys[j]];

				if(row >= cell.row && row <= (cell.row + cell.rowspan-1))
				if(col >= cell.col && col <= (cell.col + cell.colspan-1))
					test = false;

				if(col >= cell.col && col <= (cell.col + cell.colspan-1))
				if(row >= cell.row && row <= (cell.row + cell.rowspan-1))
					test = false;
			}

			if(test == true) return {row:row, col:col};
		}

		return null;
	};


	GridLayout.prototype.resizeCell = function(args){

		var cell = args.src;

		var cellPosition = this.getCellForPoint(args.mouse);
		var direction = args.direction;

		if(direction == bottom) {
			cell.rowspan = cellPosition.row - cell.row + 1; //at least a single row
		}

		if(direction == right) {
			cell.colspan = cellPosition.col - cell.col + 1; //at least a single row
		}


		if(direction == left) {
			cell.col = cellPosition.col; //at least a single row
		}

		if(direction == top) {

			var newSpan = cell.row + cell.rowspan - cellPosition.row;

			cell.row = cellPosition.row; //at least a single row

			if(newSpan >= 1) cell.rowspan = newSpan;
		}

		if(direction == move) {
			cell.col = cellPosition.col; //at least a single row
			cell.row = cellPosition.row; //at least a single row
		}

		this.reflow(cell.index);

	};

	GridLayout.prototype.maximizeCell = function(cell){
		cell.col = cell.row = 0;
		cell.rowspan = this.grid.rows;
		cell.colspan = this.grid.columns;

		this.reflow(cell.index);
	};

	GridLayout.prototype.setOutterMargin = function(margin){
		if(margin == null) {
			this.outerMargin = DEFAULT_OUTTER_MARGIN;
			return;
		}
		this.outerMargin = margin;
	};

	GridLayout.prototype.setMargin = function(margin){
		if(margin == null){
			this.margin = DEFAULT_MARGIN;
			return;
		}
		this.margin = margin;
	};

	GridLayout.prototype.reflow = function(cellIndex){

		var margin 		 = this.margin;
		var outer_margin = this.outerMargin;

		var DOM = this.views.root.htmlElement;


		var grid = this.grid;

		/*tiled reflow*/
		var workarea = { clientWidth:  DOM.clientWidth  - 2 * outer_margin,
					 	 clientHeight: DOM.clientHeight - 2 * outer_margin};

		var cards = this.layoutCells;

		/* calculate unit size
	 	* based on client and grid size
	 	* */
		var unitWidth = (workarea.clientWidth - (grid.columns - 1) * margin) / grid.columns;
		var unitHeight = (workarea.clientHeight - (grid.rows - 1) * margin) / grid.rows;

	//	grid.clear();

		var keys = null;

		//get cell keys
		if(cellIndex != undefined) {
			keys = [cellIndex];
		} else {
			keys = Object.keys(cards);
		}

		for(var k = 0; k < keys.length; k++){
			var i = keys[k];
			//var style = cards[i].dom.style;

			/* panel position*/
			var l = outer_margin + (cards[i].col*unitWidth  + cards[i].col * margin);
			var t = outer_margin + (cards[i].row*unitHeight + cards[i].row * margin);

			/*panel size*/
			var w 	= cards[i].colspan * unitWidth + (margin * (cards[i].colspan -  1));
			var h 	= cards[i].rowspan * unitHeight + (margin * (cards[i].rowspan - 1));

			/* update grid */
		//	grid.fillGrid(cards[i].row, cards[i].col, cards[i].rowspan, cards[i].colspan, cards[i]);

			cards[i].reflow({left:l,top:t},{width:w, height:h});
		}
	};

	/**
		@param {int} rows - number of rows in the grid, min 1
		@param {int} cols - number of cols in the grid, min 1
	*/
	GridLayout.prototype.setGridSize = function(rows, cols){

	};

	GridLayout.prototype.setGrid = function(grid){
		this.grid.setSize(grid);
		this.reflow();
	};


	GridLayout.prototype.getCellForPoint = function(p){

		var margin 		 = this.margin;
		var outer_margin = this.outerMargin;

		var DOM = this.views.root.htmlElement;

		var offset = scope.SpliceJS.UI.Positioning.abs(DOM);

		var grid = this.grid;

		var workarea = {dom: DOM,
						clientWidth:  DOM.clientWidth  - 2 * outer_margin,
						clientHeight: DOM.clientHeight - 2 * outer_margin};

		var unitWidth = (workarea.clientWidth - (grid.columns - 1) * margin) / grid.columns;
		unitWidth -= 2; /*border adjustment */

		var unitHeight = (workarea.clientHeight- (grid.rows - 1) * margin) / grid.rows;
		unitHeight -= 2;

		var p = {
			x:p.x-offset.x,
			y:p.y-offset.y
		};

		/* panel position*/
		var col = Math.floor((p.x - outer_margin) / (unitWidth  + margin));
		var row = Math.floor((p.y - outer_margin) / (unitHeight + margin));

		return {row:row, col:col};
	};

	/* module exports */
	exports.scope(
		Grid, CellContainer, GridLayout
	);

	exports.module(
		Grid, CellContainer, GridLayout
	);

}

});
