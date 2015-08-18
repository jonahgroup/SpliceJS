_.Module({

required:[
	{'SpliceJS.UI':_.home('modules/splice.ui.js')},
	'splice.controls.gridlayout.css',
	'splice.controls.gridlayout.html'

],

definition:function(){
	var scope = this
	,	Component = this.framework.Component;

	var UIControl = this.SpliceJS.UI.UIControl
	,	DragAndDrop = this.SpliceJS.UI.DragAndDrop;


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
	var CellContainer = Component('CellContainer')(function CellContainer(){
		UIControl.call(this);

		//attach events to drive resizing of the cell container
		var self = this;

		_.Event.attach(this.elements.leftEdge,'onmousedown').subscribe(
			function(e){self.onStartResize(e,left);}
		);

		_.Event.attach(this.elements.topEdge,'onmousedown').subscribe(
			function(e){self.onStartResize(e,top);}
		);
			

		_.Event.attach(this.elements.rightEdge,'onmousedown').subscribe(
			function(e){self.onStartResize(e,right);}
		);


		_.Event.attach(this.elements.bottomEdge,'onmousedown').subscribe(
			function(e){self.onStartResize(e,bottom);}
		);

		this.onStartResize.subscribe(this.startResize, this);
		this.onResize.subscribe(this.resize, this);
		this.onEndResize.subscribe(this.endResize, this);
		this.onStartMove.subscribe(this.startMove,this);

	}).extend(UIControl);


	CellContainer.prototype.onStartMove   =	_.Event;
	CellContainer.prototype.onMove 	  	  = _.Event;
	CellContainer.prototype.onEndMove 	  = _.Event;


	CellContainer.prototype.onStartResize = _.Event;
	CellContainer.prototype.onResize 	  =	_.Event;
	CellContainer.prototype.onEndResize   =	_.Event;


	CellContainer.prototype.startResize = function(e,direction){
		_.debug.log('Resizing in ' + direction + ' direction');
		DragAndDrop.startDrag();

		var self = this;
		DragAndDrop.ondrag =  function(p,offset){
			self.onResize({mouse:p,direction:direction, src:self});
		}
	};


	CellContainer.prototype.startMove = function(){
		DragAndDrop.startDrag();

		var self = this;
		DragAndDrop.ondrag =  function(p,offset){
			self.onResize({mouse:p,direction:move, src:self});
		}	
	};


	CellContainer.prototype.reflowChildren = function(position, size, bubbleup){
		UIControl.prototype.reflowChildren.call(this,{left:0, top:0}, size, bubbleup);
	};



	/* 
	*	
	*	Grid Layout implementation
	*
	*/
	var GridLayout = Component('GridLayout')(function GridLayout(){

		UIControl.call(this);

		/* default gap values */
		if(!this.margin) 		this.margin = 10;
		if(!this.outerMargin) 	this.outerMargin = 10;

		/* default grid configuration */
		if(!this.grid)			this.grid = {columns:2, rows:2};
		this.grid = new Grid(this.grid.rows, this.grid.columns);

		_.Event.attach(window,'onresize').subscribe(function(){
			this.reflow();}
		,this);

		var self = this;

		this.layoutCells = [];

		this.onDisplay.subscribe(function(){
			self.display();
		});
	}).extend(UIControl);


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
	function addCell(content, row, col, rowSpan, colSpan){

		var _CellContainer = _.Obj.call(scope,
		{	type:'CellContainer',
			row:row, 
			col:col, 
			colspan:colSpan, 
			rowspan:rowSpan,
			content:{body: content}
		});

		var cellIndex = this.layoutCells.length;

		var cell =  new _CellContainer({parent:this, index:cellIndex}); 
		
		cell.onResize.subscribe(function(args){
				this.resizeCell(args);
			}
		,this);

		this.layoutCells.push(cell);
		this.elements.controlContainer.appendChild(cell.concrete.dom);
		cell.onAttach();
		cell.onDisplay();
	};


	GridLayout.prototype.addCell = function(){
		addCell.apply(this,arguments);
		this.reflow();
	};


	GridLayout.prototype.addCellAuto = function(component){

	};


	GridLayout.prototype.getEmptyCell = function(){
		
		var to = this.grid.rows * this.grid.columns
		,	cells = this.layoutCells;

		for(var i=0; i < to; i++){
			var row = Math.floor(i / this.grid.columns)
			, 	col = i % this.grid.columns
			,	test = true;		

			for(var j=0; j< cells.length; j++){
				var cell = cells[j]
				
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

		_.debug.log('row:' + args.row + ' col:' + args.col)
	};

	GridLayout.prototype.reflow = function(cellIndex){

		var margin 		 = this.margin;
		var outer_margin = this.outerMargin;

		var DOM = this.elements.controlContainer;
		

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
		

		var from = 0;
		var to = cards.length - 1;

		if(cellIndex != undefined) {
			from = cellIndex;
			to = cellIndex;
		}

		for(var i=from; i <= to; i++){
			
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
		
		var DOM = this.elements.controlContainer;		
		
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


	return  {
		
		GridLayout: GridLayout
		
	}


}

});