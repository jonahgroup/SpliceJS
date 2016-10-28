$js.module({
    definition:function(){
        var document = this.imports.$js.document;
        var div = document.createElement('div');

        div.innerHTML = 'Sample application';
        document.body.appendChild(div);
    }
});