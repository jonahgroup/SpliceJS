sjs({

  definition:function(sjs){

    var event = sjs.event
    , view = sjs.view;

    event(view('div')
      .style('display:inline-block; width:100px; height:100px;background-color:#fefefe; color:#222222')
      .content('test')
      .display().add())
    .attach({
      onclick:sjs().event.multicast,
      onmouseover:sjs().event.multicast,
      onmouseout:sjs().event.multicast
    })
    .onclick
    .subscribe(function(args){
      console.log(args);
    })
    .onclick
    .subscribe(function(args){
      console.log(this);
    })
    .onmouseover
    .subscribe(function(args){
      args.view.style('display:inline-block; width:100px; height:100px;background-color:#D7B036')
    })
    .onmouseout
    .subscribe(function(args){
      args.view.style('display:inline-block; width:100px; height:100px;background-color:#fefefe')
    });

  }
});
