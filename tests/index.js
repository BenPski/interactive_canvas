class InteractiveCanvas {
    constructor(canvas, draw) {
        this.canvas = canvas;
        let ctx = canvas.getContext('2d');
        this.draw = draw;
        this.ctx = this.trackTransforms(ctx);
        this.redraw();
        this.lastX=this.canvas.width/2;
        this.lastY=this.canvas.height/2;
        this.dragStart=null;
        this.scaleStart=null;
        this.touches=[];
        this.scaleFactor = 1.1;
        this.animationId = null;
        // I don't understand why bind is necessary, but 'this' isn't properly
        // captured otherwise in the listener methods
        this.mouseDownListener = this.handleMouseDown.bind(this);
        this.mouseMoveListener = this.handleMouseMove.bind(this);
        this.mouseUpListener = this.handleMouseUp.bind(this);
        this.scrollListener = this.handleScroll.bind(this);
        this.touchStartListener = this.handleTouchStart.bind(this);
        this.touchMoveListener = this.handleTouchMove.bind(this);
        this.touchEndListener = this.handleTouchEnd.bind(this);

    }

    setup_listeners() {
        this.canvas.addEventListener('mousedown',this.mouseDownListener, false);
        this.canvas.addEventListener('mousemove',this.mouseMoveListener, false);
        this.canvas.addEventListener('mouseup',this.mouseUpListener,false);
        this.canvas.addEventListener('DOMMouseScroll',this.scrollListener,false);
        this.canvas.addEventListener('mousewheel',this.scrollListener,false);
        this.canvas.addEventListener('touchstart',this.touchStartListener,false);
        this.canvas.addEventListener('touchmove',this.touchMoveListener,false);
        this.canvas.addEventListener('touchend',this.touchEndListener,false);
        this.canvas.addEventListener('touchcancel',this.touchEndListener,false);
    }

    remove_listeners() {
        this.canvas.removeEventListener('mousedown',this.mouseDownListener, false);
        this.canvas.removeEventListener('mousemove',this.mouseMoveListener, false);
        this.canvas.removeEventListener('mouseup',this.mouseUpListener,false);
        this.canvas.removeEventListener('DOMMouseScroll',this.scrollListener,false);
        this.canvas.removeEventListener('mousewheel',this.scrollListener,false);
        this.canvas.addEventListener('touchstart',this.touchStartListener,false);
        this.canvas.addEventListener('touchmove',this.touchMoveListener,false);
        this.canvas.addEventListener('touchend',this.touchEndListener,false);
        this.canvas.addEventListener('touchcancel',this.touchEndListener,false);
    }

    clear() {
        // Clear the entire canvas
        let p1 = this.ctx.transformedPoint(0,0);
        let p2 = this.ctx.transformedPoint(this.canvas.width,this.canvas.height);
        this.ctx.clearRect(p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);
    }

    redraw() {
        this.clear();
        this.draw(this.ctx);
    }

    zoom(clicks){
        let pt = this.ctx.transformedPoint(this.lastX,this.lastY);
        this.ctx.translate(pt.x,pt.y);
        let factor = Math.pow(this.scaleFactor,clicks);
        this.ctx.scale(factor,factor);
        this.ctx.translate(-pt.x,-pt.y);
        this.redraw();
    }

    handleMouseDown(evt) {
        this.lastX = evt.offsetX || (evt.pageX - this.canvas.offsetLeft);
        this.lastY = evt.offsetY || (evt.pageY - this.canvas.offsetTop);
        this.dragStart = this.ctx.transformedPoint(this.lastX,this.lastY);
    }

    handleMouseMove(evt) {
        this.lastX = evt.offsetX || (evt.pageX - this.canvas.offsetLeft);
        this.lastY = evt.offsetY || (evt.pageY - this.canvas.offsetTop);
        if (this.dragStart){
            let pt = this.ctx.transformedPoint(this.lastX,this.lastY);
            this.ctx.translate(pt.x-this.dragStart.x,pt.y-this.dragStart.y);
            this.redraw();
        }
    }

    handleMouseUp(evt) {
        this.dragStart = null;
    }

    handleScroll(evt) {
        let delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
        if (delta) this.zoom(delta);
        return evt.preventDefault() && false;
    };

    handleTouchStart(evt) {
        console.log("touch start");
        evt.preventDefault();
        const touches = evt.changedTouches;
        for (let i=0; i<touches.length; i++) {
            this.touches.push(touches[i]);
        }
        let points = [];
        for (let i=0; i<this.touches.length; i++) {
            points.push(this.ctx.transformedPoint(this.touches[i].pageX, this.touches[i].pageY));
        }
        let center = centroid(points);
        this.lastX = center.x;
        this.lastY = center.y;
        this.dragStart = {x:this.lastX, y:this.lastY};
        this.scaleStart = averageDistance(points, center);
    }

    handleTouchMove(evt) {
        console.log("touch move");
        evt.preventDefault();
        const touches = evt.touches;
        console.log(this.touches, touches);
        let points = [];
        for (let i=0; i<touches.length; i++) {
            let idx = this.getTouchIndex(touches[i]);
            if (idx >= 0) {
                let touch_curr = touches[i];
                points.push(this.ctx.transformedPoint(touch_curr.pageX, touch_curr.pageY));
            } else {
                console.log("A touch seems to have appeared without a start event", touches[i]); 
            }
        }
        let center = centroid(points);
        this.lastX = center.x;
        this.lastY = center.y;
        if (this.dragStart) {
            let pt = {x: this.lastX, y: this.lastY};
            this.ctx.translate(pt.x-this.dragStart.x,pt.y-this.dragStart.y);
        }

        if (points.length > 1) {
            let scale_new = averageDistance(points, center);
            let scale = scale_new/this.scaleStart;
            let pt = this.ctx.transformedPoint(this.lastX,this.lastY);
            this.ctx.translate(pt.x,pt.y);
            this.ctx.scale(scale,scale);
            this.ctx.translate(-pt.x,-pt.y);
        }
    }

    handleTouchEnd(evt) {
        console.log("touch end");
        evt.preventDefault();
        const touches = evt.changedTouches;
        for (let i=0; i<touches.length; i++) {
            let idx = this.getTouchIndex(touches[i]);
            if (idx >= 0) {
                this.touches.splice(idx, 1);
            } else {
                console.log("A touch seems to have appeared without a start event", touches[i]); 
            }
        }
        if (this.touches.length == 0) {
            this.dragStart = null;
            this.scaleStart = null;
        } else {
            let points = [];
            for (let i=0; i<this.touches.length; i++) {
                points.push(this.ctx.transformedPoint(this.touches[i].pageX, this.touches[i].pageY));
            }
            let center = centroid(points);
            this.lastX = center.x;
            this.lastY = center.y;
            this.dragStart = {x:this.lastX, y:this.lastY};
            this.scaleStart = averageDistance(points, center);
        }
    }

    getTouchIndex(touch) {
        for (let j=0; j<this.touches.length; j++) {
            if (this.touches[j].identifier == touch.identifier) {
                return j;
            }
        }
        return -1;
    }

    // Adds ctx.getTransform() - returns a DOMMatrix
    // Adds ctx.transformedPoint(x,y) - returns an DOMPoint
    trackTransforms(ctx){
        let xform = new DOMMatrix();
        ctx.getTransform = function(){ return xform; };
        
        let savedTransforms = [];
        let save = ctx.save;
        ctx.save = function(){
            savedTransforms.push(xform.translate(0,0));
            return save.call(ctx);
        };
        let restore = ctx.restore;
        ctx.restore = function(){
            xform = savedTransforms.pop();
            return restore.call(ctx);
        };

        let scale = ctx.scale;
        ctx.scale = function(sx,sy){
            xform = xform.scale(sx,sy);
            return scale.call(ctx,sx,sy);
        };
        let rotate = ctx.rotate;
        ctx.rotate = function(radians){
            xform = xform.rotate(radians*180/Math.PI);
            return rotate.call(ctx,radians);
        };
        let translate = ctx.translate;
        ctx.translate = function(dx,dy){
            xform = xform.translate(dx,dy);
            return translate.call(ctx,dx,dy);
        };
        let transform = ctx.transform;
        ctx.transform = function(a,b,c,d,e,f){
            let m2 = new DOMMatrix(); //svg.createSVGMatrix();
            m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
            xform = xform.multiply(m2);
            return transform.call(ctx,a,b,c,d,e,f);
        };
        let setTransform = ctx.setTransform;
        ctx.setTransform = function(a,b,c,d,e,f){
            xform.a = a;
            xform.b = b;
            xform.c = c;
            xform.d = d;
            xform.e = e;
            xform.f = f;
            return setTransform.call(ctx,a,b,c,d,e,f);
        };
        let pt  = new DOMPoint();
        ctx.transformedPoint = function(x,y){
            pt.x=x; pt.y=y;
            return pt.matrixTransform(xform.inverse());
        }
        return ctx;
    }

    renderLoop() {
        this.redraw();
        this.animationId = requestAnimationFrame((x) => this.renderLoop(x));
    }

    start() {
        if (this.animationId === null) {
            this.setup_listeners();
            this.renderLoop();
        }
    }

    stop() {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.remove_listeners();
            this.animationId = null;
        }
    }
}

function centroid(points) {
    let x = 0;
    let y = 0;
    for (let i=0; i<points.length; i++) {
        x += points[i].x;
        y += points[i].y;
    }
    return {x: x/points.length, y: y/points.length};
}

function averageDistance(points, center) {
    let dist = 0;
    for (let i=0; i<points.length; i++) {
        dist += Math.sqrt((points[i].x-center.x)**2 + (points[i].y-center.y)**2);
    }
    return dist/points.length;
}

const canvas = document.getElementById('canvas');

canvas.width = 500;
canvas.height = 500;

function draw(ctx) {
    // testing control points
    var pt = ctx.transformedPoint(200, 200);
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 10, 0, 2*Math.PI);
    ctx.fill();
    
    var pt = ctx.transformedPoint(180, 200);
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 10, 0, 2*Math.PI);
    ctx.fill();
    
    var pt = ctx.transformedPoint(300, 300);
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 10, 0, 2*Math.PI);
    ctx.fill();

    var pt = ctx.transformedPoint(320, 300);
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 10, 0, 2*Math.PI);
    ctx.fill();




    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(250, 250,20,0,2*Math.PI);
    ctx.fill();
}

var ic = new InteractiveCanvas(canvas, draw);

ic.start();


// mocking touch events

function simTouch(id, x, y, element, type) {
    const touch = new Touch({
                identifier: id,
                target: element,
                pageX: y,
                pageY: y,
                clientX: x,
                clientY: y,
            });
    
    const event = new TouchEvent(type, {
        touches: [ touch ],
        changedTouches: [ touch ],
    });
    element.dispatchEvent(event);
};

//setTimeout(() => simTouch(0, 50, 50, canvas, "touchstart"), 100);
//setTimeout(() => simTouch(1, 50, 50, canvas, "touchstart"), 100);
//setTimeout(() => simTouch(0, 50, 200, canvas, "touchmove"), 200);
//setTimeout(() => simTouch(1, 100, 0, canvas, "touchmove"), 200);
//setTimeout(() => simTouch(0, 60, 60, canvas, "touchend"), 300);
//setTimeout(() => simTouch(1, 200, 60, canvas, "touchend"), 300);

function canvasTouch(id, x, y) {
    var t = new Touch({
        identifier: id,
        target: canvas,
        pageX: x,
        pageY: y,
        clientY: y,
        clientX: x,
    });
    return t;
}

function simTouchZoom() {
    var firstTouches = [canvasTouch(0, 200, 200), canvasTouch(1, 300, 300)];
    const event1 = new TouchEvent("touchstart", {
        touches: firstTouches,
        changedTouches: firstTouches,
    });
    canvas.dispatchEvent(event1);

    var secondTouches = [canvasTouch(0, 180, 200), canvasTouch(1, 320, 300)];
    const event2 = new TouchEvent("touchmove", {
        touches: secondTouches,
        changedTouches: secondTouches,
    });
    canvas.dispatchEvent(event2);

    var thirdTouches = [canvasTouch(0, 180, 200), canvasTouch(1, 320, 300)];
    const event3 = new TouchEvent("touchend", {
        touches: thirdTouches,
        changedTouches: thirdTouches,
    });
    canvas.dispatchEvent(event3);
}

function simTouchDrag() {
    var firstTouches = [canvasTouch(0, 30, 30)];
    const event1 = new TouchEvent("touchstart", {
        touches: firstTouches,
        changedTouches: firstTouches,
    });
    canvas.dispatchEvent(event1);

    var secondTouches = [canvasTouch(0, 10, 30)];
    const event2 = new TouchEvent("touchmove", {
        touches: secondTouches,
        changedTouches: secondTouches,
    });
    canvas.dispatchEvent(event2);

    var thirdTouches = [canvasTouch(0, 10, 30)];
    const event3 = new TouchEvent("touchend", {
        touches: thirdTouches,
        changedTouches: thirdTouches,
    });
    canvas.dispatchEvent(event3);
}
simTouchDrag();
simTouchZoom();
