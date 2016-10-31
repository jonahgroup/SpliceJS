$js.module({
definition:function(scope){

    var divHtml = '<div id="logWindow"></div>';
    var document = scope.imports.$js.document; 
    
    var div = document.createElement('div');
    div.innerHTML = divHtml;
    document.body.appendChild(div);

    var logWindow = document.getElementById('logWindow');
    
    function log(text){
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(text));
        logWindow.appendChild(d);
    }

    scope.exports(log);

}});