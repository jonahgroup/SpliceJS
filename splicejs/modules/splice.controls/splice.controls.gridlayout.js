_.Module({

required:[
	
	'splice.controls.gridlayout.css',
	'splice.controls.gridlayout.htmlt'

],

definition:function(){

	var scope = this;


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



	



	var CellContainer = scope.CellContainer = _.Class(function CellContainer(){
		SpliceJS.Controls.UIControl.call(this);
	}).extend(SpliceJS.Controls.UIControl);


	CellContainer.prototype.reflowChildren = function(position, size, bubbleup){
		SpliceJS.Controls.UIControl.prototype.reflowChildren.call(this,{left:0, top:0}, size, bubbleup);
	};











	var GridLayout = _.Namespace('SpliceJS.Controls').Class(function GridLayout(){

		SpliceJS.Controls.UIControl.call(this);

		/* default gap values */
		if(!this.margin) 		this.margin = 10;
		if(!this.outerMargin) 	this.outerMargin = 20;

		/* default grid configuration */
		if(!this.grid)			this.grid = {columns:2, rows:2};
		this.grid = new Grid(this.grid.rows, this.grid.columns);

		_.Event.create(window,'onresize').subscribe(this.reflow,this);

	}).extend(SpliceJS.Controls.UIControl);


	GridLayout.prototype.onAttach = function(){

		/* processes layout cells */
		if(this.cells && this.cells.length > 0){

			for(var i=0; i< this.cells.length; i++) {

				var cellContainer = _.Obj.call(scope,
						{	type:'CellContainer',
							content:{body: this.cells[i].content}
						});

				this.cells[i].content = new cellContainer({parent:this}); //new this.cells[i].content({parent:this});
				this.elements.controlContainer.appendChild(this.cells[i].content.concrete.dom);
			}
			
			this.reflow();
		}


		SpliceJS.Controls.UIControl.prototype.onAttach.call(this);
	};


	GridLayout.prototype.reflow = function(){

		var margin 		 = this.margin;
		var outer_margin = this.outerMargin;

		var DOM = this.elements.controlContainer;
		

		var grid = this.grid; 
	
		/*tiled reflow*/
		var workarea = { clientWidth:  DOM.clientWidth  - 2 * outer_margin,
					 	 clientHeight: DOM.clientHeight - 2 * outer_margin};
	
		var cards = this.cells;
	
		/* calculate unit size 
	 	* based on client and grid size
	 	* */
		var unitWidth = (workarea.clientWidth - (grid.columns - 1) * margin) / grid.columns;
			unitWidth -= 2; /*border adjustment */
		
		var unitHeight = (workarea.clientHeight- (grid.rows - 1) * margin) / grid.rows;	
			unitHeight -= 2;

		grid.clear();	
		
		for(var i=0; i< cards.length; i++){
			
			//var style = cards[i].dom.style; 
			
			/* panel position*/
			var l = outer_margin + (cards[i].col*unitWidth  + cards[i].col * margin);
			var t = outer_margin + (cards[i].row*unitHeight + cards[i].row * margin);
			
			/*panel size*/
			var w 	= cards[i].colspan * unitWidth + (margin * (cards[i].colspan -  1));
			var h 	= cards[i].rowspan * unitHeight + (margin * (cards[i].rowspan - 1));
			
			/* update grid */
			grid.fillGrid(cards[i].row, cards[i].col, cards[i].rowspan, cards[i].colspan, cards[i]);
		
			cards[i].content.reflow({left:l,top:t},{width:w, height:h});
		}


	}


}

});