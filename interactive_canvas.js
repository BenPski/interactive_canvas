// largely yoinked from http://phrogz.net/tmp/canvas_zoom_to_cursor.html
export class InteractiveCanvas {
    constructor(canvas, draw) {
        this.canvas = canvas;
        let ctx = canvas.getContext('2d');
        this.draw = draw;
        this.ctx = this.trackTransforms(ctx);
        this.redraw();
        this.lastX=this.canvas.width/2;
        this.lastY=this.canvas.height/2;
        this.dragStart=false;
        this.dragged=false;
        this.scaleFactor = 1.1;
        this.animationId = null;
        // I don't understand why bind is necessary, but 'this' isn't properly
        // captured otherwise in the listener methods
        this.mouseDownListener = this.handleMouseDown.bind(this);
        this.mouseMoveListener = this.handleMouseMove.bind(this);
        this.mouseUpListener = this.handleMouseUp.bind(this);
        this.scrollListener = this.handleScroll.bind(this);
    }

    setup_listeners() {
        this.canvas.addEventListener('mousedown',this.mouseDownListener, false);
        this.canvas.addEventListener('mousemove',this.mouseMoveListener, false);
        this.canvas.addEventListener('mouseup',this.mouseUpListener,false);
        this.canvas.addEventListener('DOMMouseScroll',this.scrollListener,false);
        this.canvas.addEventListener('mousewheel',this.scrollListener,false);
    }

    remove_listeners() {
        this.canvas.removeEventListener('mousedown',this.mouseDownListener, false);
        this.canvas.removeEventListener('mousemove',this.mouseMoveListener, false);
        this.canvas.removeEventListener('mouseup',this.mouseUpListener,false);
        this.canvas.removeEventListener('DOMMouseScroll',this.scrollListener,false);
        this.canvas.removeEventListener('mousewheel',this.scrollListener,false);
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
        this.dragged = false;
    }

    handleMouseMove(evt) {
        this.lastX = evt.offsetX || (evt.pageX - this.canvas.offsetLeft);
        this.lastY = evt.offsetY || (evt.pageY - this.canvas.offsetTop);
        this.dragged = true;
        if (this.dragStart){
            let pt = this.ctx.transformedPoint(this.lastX,this.lastY);
            this.ctx.translate(pt.x-this.dragStart.x,pt.y-this.dragStart.y);
            this.redraw();
        }
    }

    handleMouseUp(evt) {
        this.dragStart = null;
        if (!this.dragged) this.zoom(evt.shiftKey ? -1 : 1 );
    }

    handleScroll(evt){
        let delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
        if (delta) this.zoom(delta);
        return evt.preventDefault() && false;
    };

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
