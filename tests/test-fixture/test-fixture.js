$js.module({
definition:function(scope){

    var divHtml = '<div id="logWindow"></div>';
    var document = scope.imports.$js.document; 
    
    var div = document.createElement('div');
    div.innerHTML = divHtml;
    document.body.appendChild(div);

    var logWindow = document.getElementById('logWindow');
    
    function log(text){
        logWindow.appendChild(document.createTextNode(text));
    }

    scope.exports(log);

}});