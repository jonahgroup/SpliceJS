_.Module({

    required: [
        'splice.controls.slider.css',
        'splice.controls.slider.html'
    ]
    ,
    definition:function(){

        var Slider = _.Namespace('SpliceJS.Controls').Class(function Slider() {
            SpliceJS.Controls.UIControl.call(this);

            var self = this;

            this.onAttach.subscribe(this.attach, this);
            this.onDisplay.subscribe(this.display, this);

            _.Event.attach(this.elements.leftThumb, 'onmousedown').subscribe(
                function (e) {
                    startMoveThumb.call(this, e, this.elements.leftThumb);
                }, this);


            _.Event.attach(this.elements.rightThumb, 'onmousedown').subscribe(function (e) {
                startMoveThumb.call(this, e, this.elements.rightThumb);
            }, this);
        }).extend(SpliceJS.Controls.UIControl);

        //override reflow
        Slider.prototype.reflow = function () {
        }

        Slider.prototype.attach = function () {
        }

        Slider.prototype.display = function () {

        };

        Slider.prototype.updateRangePosition = function () {

            var width = this.elements.rangeLimiter.offsetWidth;
            var left = this.elements.leftThumb.offsetLeft;
            var right = width - this.elements.rightThumb.offsetLeft - this.elements.rightThumb.offsetWidth;

            var s = this.elements.range.style;

            s.left = left + 'px';
            s.right = right + 'px';

        };

        function startMoveThumb(e, thumb) {
            SpliceJS.Ui.DragAndDrop.startDrag();

            var origin = thumb.offsetLeft;

            var self = this;
            SpliceJS.Ui.DragAndDrop.ondrag = function (p, offset) {
                moveThumb.call(self,{ mouse: p, origin:origin, offset:offset, src:thumb});
            }
        }

        function moveThumb(args) {
            args.src.style.left = (args.origin + args.mouse.x - args.offset.x) + 'px';
            this.updateRangePosition();
        }

    }

});