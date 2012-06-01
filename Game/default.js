/// <reference path="myapp.js" />
(function (global) {
    "use strict";

    global.addEventListener("DOMContentLoaded", function () {
        PaddleBall.init();
    }, false);
   
})(this);

// Browser shims..
(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());

var WinJS = WinJS || {};
WinJS.Utilities = WinJS.Utilities || {};
WinJS.Utilities.Key = WinJS.Utilities.Key || {
    upArrow: 38,
    downArrow: 40,
    leftArrow: 37,
    rightArrow: 39,
    esc: 27,
    shift: 16
};