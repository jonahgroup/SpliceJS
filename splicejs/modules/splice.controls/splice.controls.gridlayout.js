sjs({

required:[
	{'SpliceJS.UI':'{sjshome}/modules/splice.ui.js'},
	'splice.controls.gridlayout.css',
	'splice.controls.gridlayout.html'
],

definition:function(){
	var scope = this.scope
	,	Class = this.sjs.Class
	,	Event = this.sjs.Event
	,	debug = this.sjs.debug
	,	proxy = this.sjs.proxy;

	var UIControl = scope.SpliceJS.UI.UIControl
	,	DragAndDrop = scope.SpliceJS.UI.DragAndDrop;

	var Grid = function(rows,columns){
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
	var CellContainer = Class.extend(UIControl)(function CellContainerController(){
		this.super();

		//attach events to drive resizing of the cell container
		var self = this;

		Event.attach(this.elements.leftEdge,'onmousedown').subscribe(
			function(e){self.onStartResize(e,left);}
		);

		Event.attach(this.elements.topEdge,'onmousedown').subscribe(
			function(e){self.onStartResize(e,top);}
		);


		Event.attach(this.elements.rightEdge,'onmousedown').subscribe(
			function(e){self.onStartResize(e,right);}
		);


		Event.attach(this.elements.bottomEdge,'onmousedown').subscribe(
			function(e){self.onStartResize(e,bottom);}
		);

		this.onStartResize.subscribe(this.startResize, this);
		this.onResize.subscribe(this.resize, this);
		this.onEndResize.subscribe(this.endResize, this);
		this.onStartMove.subscribe(this.startMove,this);

	});


	CellContainer.prototype.onStartMove   =	Event;
	CellContainer.prototype.onMove 	  	  = Event;
	CellContainer.prototype.onEndMove 	  = Event;

	CellContainer.prototype.onStartResize = Event;
	CellContainer.prototype.onResize 	    =	Event;
	CellContainer.prototype.onEndResize   =	Event;
	CellContainer.prototype.onCellSize 	  = Event;

	CellContainer.prototype.onRemove = Event;
	CellContainer.prototype.onMaximize = Event;


	CellContainer.prototype.startResize = function(e,direction){
		debug.log('Resizing in ' + direction + ' direction');
		DragAndDrop.startDrag();

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

	/**
	*
	*	Grid Layout implementation
	* @constructor
	*/
	var GridLayout = Class.extend(UIControl)(function GridLayoutController(){

		UIControl.call(this);

		/* default gap values */
		if(!this.margin) 		this.margin = 10;
		if(!this.outerMargin) 	this.outerMargin = 10;

		/* default grid configuration */
		if(!this.grid)			this.grid = {columns:2, rows:2};
		this.grid = new Grid(this.grid.rows, this.grid.columns);

		/*
			hook into window resize event only if grid layout
			is configured as a toplevel component
		*/
		if(this.attachToWindow === true ) {
		Event.attach(window,'onresize').subscribe(function(){
			this.reflow();}
		,this);
	 }

		// a collection of cells, contained in a null object
		this.layoutCells = Object.create(null);
		// cell sequence counter
		this.cellSequence = 1;

		this.onDisplay.subscribe(this.display, this);

	});

	GridLayout.prototype.onRemoveCell = Event;

	GridLayout.prototype.display = function(){

		/* processes layout cells */
		if(this.cells && this.cells.length > 0){

			for(var i=0; i< this.cells.length; i++) {
				addCell.call(this,	this.cells[i].content,
					this.cells[i].row, this.cells[i].col,
					this.cells[i].rowspan, this.cells[i].colspan);
			}
			this.reflow();
		}
	};


	/* private */
	function restoreCell(cell){
	//	cell.onResize.subscribe(this.resizeCell, this);
	//	cell.onRemove.subscribe(this.removeCell, this);

		this.layoutCells[cell.index] = cell;
		this.elements.root.appendChild(cell.concrete.dom);
		cell.onAttach();
		cell.onDisplay();
	}

	function addCell(content, row, col, rowSpan, colSpan){

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
		this.elements.root.appendChild(cell.concrete.dom);
		cell.onAttach();
		cell.onDisplay();
	};


	GridLayout.prototype.addCell = function(){
		addCell.apply(this,arguments);
		this.reflow();
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
					this.elements.root.removeChild(this.layoutCells[keys[key]].concrete.dom);
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
	GridLayout.prototype.removeCell = function(cell){
		this.elements.root.removeChild(cell.concrete.dom);
		delete this.layoutCells[cell.index];
		this.onRemoveCell(cell);
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

	GridLayout.prototype.reflow = function(cellIndex){

		var margin 		 = this.margin;
		var outer_margin = this.outerMargin;

		var DOM = this.elements.root;


		var grid = this.grid;

		/*tiled reflow*/
		var workarea = { clientWidth:  DOM.clientWidth  - 2 * outer_margin,
					 	 clientHeight: DOM.clientHeight - 2 * outer_margin};

		var cards = this.layoutCells;

		/* calculate unit size
	 	* based on client and grid size
	 	* */
		var unitWidth = (workarea.clientWidth - (grid.columns - 1) * margin) / grid.columns;
			unitWidth -= 2; /*border adjustment */

		var unitHeight = (workarea.clientHeight- (grid.rows - 1) * margin) / grid.rows;
			unitHeight -= 2;

		grid.clear();

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
			grid.fillGrid(cards[i].row, cards[i].col, cards[i].rowspan, cards[i].colspan, cards[i]);

			cards[i].reflow({left:l,top:t},{width:w, height:h});
		}
	};

	GridLayout.prototype.setGrid = function(grid){
		this.grid.setSize(grid);
		this.reflow();
	};


	GridLayout.prototype.getCellForPoint = function(p){

		var margin 		 = this.margin;
		var outer_margin = this.outerMargin;

		var DOM = this.elements.root;

		var offset = scope.SpliceJS.UI.Positioning.absPosition(DOM);

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


	return  {}


}

});
