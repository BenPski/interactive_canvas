# Interactive Canvas

A simple manager for a canvas so that you can zoom with the scroll wheel and pan
the canvas by dragging with the mouse.

Requires a callback for how to draw something to the canvas.


## Usage

Get a reference to a canvas element, create an `InteractiveCanvas` object, and 
`start` the event listening and render loop. If at some later time you want the 
events and rendering to be stopped call the `stop` method.

Simple example of drawing a circle that can be moved around.
```javascript
const canvas = document.getElementById("myCanvas");

function draw(ctx) {
    ctx.beginPath();
    ctx.fillStyle = "red";
    ctx.arc(100, 100, 0, 2*Math.PI);
    ctx.fill();
}

var ic = new InteractiveCanvas(canvas, draw);
ic.start();
```

More complex example of grid lines, so you need to know the original coordinate
system since things need to line up with the origin of the canvas.

```javascript
const CELL_SIZE = 25;
const canvas = document.getElementById("myCanvas");

function draw(ctx) {
    // not uncommon to want to be able to get the original coordinates
    // this will return the point in the transformed coordinate system
    var top_left = ctx.transformedPoint(0, 0);
    var bottom_right = ctx.transformedPoint(canvas.width, canvas.height);

i   var start_row = Math.ceil(top_left.x/CELL_SIZE) - 1;
    var end_row = Math.ceil(bottom_right.x/CELL_SIZE) + 1;
    var start_col = Math.ceil(top_left.y/CELL_SIZE) - 1;
    var end_col = Math.ceil(bottom_right.y/CELL_SIZE) + 1;

    var low_x = start_row*CELL_SIZE;
    var low_y = start_col*CELL_SIZE;
    var high_x = end_row*CELL_SIZE;
    var high_y = end_col*CELL_SIZE;

    for (var x=low_x; x<=high_x; x += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, low_y);
        ctx.lineTo(x, high_y);
        ctx.stroke();
    }

    for (var y=low_y; y<=high_y; y += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(low_x, y);
        ctx.lineTo(high_x, y);
        ctx.stroke();
    }
}

var ic = new InteractiveCanvas(canvas, draw);
ic.start();
```

