// DO NOT EDIT! This test has been generated by tools/gentest.py.
// OffscreenCanvas test in a worker:2d.path.arc.selfintersect.2
// Description:arc() with lineWidth > 2*radius is drawn sensibly
// Note:

importScripts("/resources/testharness.js");
importScripts("/2dcontext/resources/canvas-tests.js");

var t = async_test("arc() with lineWidth > 2*radius is drawn sensibly");
t.step(function() {

var offscreenCanvas = new OffscreenCanvas(100, 50);
var ctx = offscreenCanvas.getContext('2d');

ctx.fillStyle = '#f00';
ctx.fillRect(0, 0, 100, 50);
ctx.lineWidth = 180;
ctx.strokeStyle = '#0f0';
ctx.beginPath();
ctx.arc(-50, 50, 25, 0, -Math.PI/2, true);
ctx.stroke();
ctx.beginPath();
ctx.arc(100, 0, 25, 0, -Math.PI/2, true);
ctx.stroke();
_assertPixel(offscreenCanvas, 50,25, 0,255,0,255, "50,25", "0,255,0,255");
_assertPixel(offscreenCanvas, 90,10, 0,255,0,255, "90,10", "0,255,0,255");
_assertPixel(offscreenCanvas, 97,1, 0,255,0,255, "97,1", "0,255,0,255");
_assertPixel(offscreenCanvas, 97,2, 0,255,0,255, "97,2", "0,255,0,255");
_assertPixel(offscreenCanvas, 97,3, 0,255,0,255, "97,3", "0,255,0,255");
_assertPixel(offscreenCanvas, 2,48, 0,255,0,255, "2,48", "0,255,0,255");

t.done();

});
done();
