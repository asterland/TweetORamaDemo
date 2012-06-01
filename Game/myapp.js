var PaddleBall = PaddleBall || {};

// All our app
(function (global) {
    "use strict";

    // Handle resizing during the game
    window.addEventListener("resize", function() {
        setUpScale();
        initView();
        play();
    }, false);

    //////////////////////// Position computation
    var ball_x = 0, ball_y = 0, ball_dx = 2.8, ball_dy = 4.6, ball_r = 0;
    var baseDx = 2;
    var paddle_h, paddle_w, paddle_x, paddle_y, paddle_moveX = 0;
    var paddleOldX, paddleOldY, paddleHitCount = 0;
    var paddleHit = false;;
    var elBallSpeed;
    function isBallInPlayArea(x, y) {
        if (x === undefined && y === undefined) return false;
        if (x === undefined && y >= elHeight) return false;
        if (y === undefined && x >= elWidth || x <= 0) return false;
        return ((x >= elWidth || x <= 0 || y >= elHeight || y <= 0)) ? false : true;
    }
    function computeBallPos(bh) {

        var newXMin = ball_x - ball_r;
        var newYMin = ball_y - ball_r;
        var newXMax = ball_x + ball_r;
        var newYMax = ball_y + ball_r;

        // Out of range
        if (!isBallInPlayArea(newXMax, undefined) || !isBallInPlayArea(newXMin, undefined))
            ball_dx = -ball_dx;
        if (!isBallInPlayArea(undefined, newYMax))
            ball_dy = - ball_dy;
        
        // In range
        if (newYMin <= 0)
            ball_dy = -ball_dy;
        else {
            // Hit the brick
            if (bh === true)
                ball_dy = -ball_dy;

            // Hit the paddle.
            paddleHit = false;
            if (paddleHitCount > 3 && (paddleHit = computePaddleHit(newXMax, newXMin, newYMax, newYMin))) {
                // Count for 3 to prevent more hits
                paddleHitCount = 0;
                ball_dy = -ball_dy;
            }
            paddleHitCount++;
        }

        // Compute new ball position - note that the value of the increment will be adjusted for speed and direction of hit
        ball_x += ball_dx;
        ball_y += ball_dy;
    }
    function computePaddleHit(x1, x2, y1, y2) {
        // debugging data
        elBallSpeed.innerText = paddle_w + " : " + paddle_x + "," + paddle_y + " : " + x1 + "," + x2 + " : " + ball_x + "," + ball_r;

        if (x1 >= paddle_x && x2 <= paddle_x + paddle_w) {
            if (y2 <= paddle_y + paddle_h && y1 >= paddle_y) {
                return true;
            }
        }

        return false;
    }
    function computeBrickHit(x, y) {
        // Ball is in play area, or in the edge areas, no need to compute a hit
        if (y >= viewModel.brickPlayOffset - viewModel.brickPadding || y < viewModel.brickPadding + viewModel.brickTopOffset ||
            x <= viewModel.brickLeftOffset || x >= (viewModel.brickLeftOffset + viewModel.bricksPerRow * (viewModel.brickSize_w)))
            return;

        // Which brick are we possibly colliding with?
        for (var i = 0; i < viewModel.numberOfBricks; i++) {
            if (x >= viewModel.bricks[i].xpos && x <= viewModel.bricks[i].xpos + viewModel.brickSize_w &&
                y >= viewModel.bricks[i].ypos && y <= viewModel.bricks[i].ypos + viewModel.brickSize_h &&
                !viewModel.bricks[i].hit) {
                viewModel.bricks[i].hit = true;

                computeBallPos(true);
                break;
            }
        }
    }
    function computePaddleSpeedAndDir(x) {
        var speed, xDiff = Math.abs(x - paddleOldX);
        var paddleXDir = ((x - paddleOldX) !== 0) ? parseInt(xDiff / (x - paddleOldX)) : 1;

        if (xDiff === 0)
            speed = 0;
        else if (xDiff <= 2)
            speed = 4 + xDiff / 4;
        else if (xDiff <= 6)
            speed = 8 + xDiff / 8;
        else if (xDiff > 6)
            speed = 16 + xDiff / 16;

        // Only if the paddle has been hit should we change the speed and direction increment
        if (paddleHit) {
            ball_dx = (paddleXDir > 0) ? speed : -speed;
        }
    }
    function computePaddlePos(x, y) {
        // Where was the paddle last time through?
        paddleOldX = paddle_x;
        paddleOldY = paddle_y;

        if (x !== undefined && x > elCanvas.offsetLeft && x < elCanvas.offsetLeft + elCanvas.offsetWidth)
            paddle_x = x;
        if (y != undefined && y < elCanvas.offsetTop + elCanvas.offsetHeight && y > elCanvas.offsetTop)
            paddle_y = y;
    }

    /////////////////////// Drawing //////////////////////////////////////////////
    function drawPaddleAndBall() {
        PaddleBall.Lib.circle(ball_x, ball_y, ball_r);
        PaddleBall.Lib.rect(paddle_x, paddle_y, paddle_w, paddle_h, "rgba(255, 255, 0, .75)");
    }
    function draw() {
        // Set the ball position
        if (state === gameState.running) {
            computeBallPos(false);
        
        // Move the paddle, compute the speed and direction of that move, which affects the ball on a hit
            computePaddlePos(mouseX, mouseY);
            computePaddleSpeedAndDir(paddle_x);

        // Given the adjusted 'position' of the ball, is this a hit?

            computeBrickHit(ball_x, ball_y + ball_r);
            computeBrickHit(ball_x, ball_y - ball_r);
        }

        paint();

        if (viewModel.bricksRemaining <= 0)
            changeState(gameState.over);
    }
    function drawBricksAndHits() {
        var x, y = viewModel.brickTopOffset;
        var i = 0;

        viewModel.bricksToHit = 0;
        viewModel.bricksRemaining = 0;

        while (y < viewModel.brickPlayOffset) {
            x = viewModel.brickLeftOffset;
            while (x < viewModel.bricksPerRow * viewModel.brickSize_w + viewModel.brickLeftOffset) {
                if (i < viewModel.numberOfBricks) {
                    // If it's not been hit, draw it
                    if (!viewModel.bricks[i].hit) {
                        PaddleBall.Lib.rect(x, y, viewModel.brickWidth, viewModel.brickHeight, "rgba(0, 0, 255, 1)", "rgba(0,0,0,1)");
                        viewModel.bricksRemaining++;
                    }  else {
                        // Assume it's been hit, so if it's counter is not reached draw the hit star
                        if (viewModel.bricks[i].hitCounter < 25) {
                            PaddleBall.Lib.star(x + viewModel.brickWidth / 2, y + viewModel.brickHeight / 2, viewModel.brickHeight / 2, "rgba(255, 0, 0, 1)", "rgba(0, 0, 0, .75)");
                            viewModel.bricks[i].hitCounter++;
                        }
                    }

                    // Set the position of the brick
                    viewModel.bricks[i].xpos = x;
                    viewModel.bricks[i].ypos = y;
                    i++;
                }
                x += viewModel.brickSize_w;
            }
            y += viewModel.brickSize_h;
        }

        viewModel.bricksToHit = i;
        updateDisplay();
    }
    function paint() {
        PaddleBall.Lib.clear(elWidth, elHeight);
        drawPaddleAndBall();
        drawBricksAndHits();
    }
    function updateDisplay() {
        var h = document.querySelector("#hits");
        var r = document.querySelector("#total");
        var t = document.querySelector("#timer");
        h.innerText = viewModel.bricksRemaining;
        r.dataset.value = viewModel.bricksToHit;
        t.innerText = playCount;
    }

    ////////////////////// Handle the state of the game ////////////////////////////////////
    var gameState = { paused: 1, running: 2, stopped: 3, over: 4 };
    var state = 0;
    var animationHandle = null;
    function changeState(s) {
        // There is a specific state we want
        if (s !== undefined) {
            state = s;
            return;
        }

        // Move the state to something else in the chain
        switch (state) {
            case gameState.stopped:
                state = gameState.running; play();
                break;
            case gameState.over:
                state = gameState.stopped;
                initViewModelBricks();
                initView();
                play();
                break;
            case gameState.running:
                state = gameState.paused;
                break;
            case gameState.paused:
                state = gameState.running;
                play();
                break;
        }
    }

    var t = null;
    var gameTime = 0;
    function setGameTime(value) {
        if (!t)
            t = Date.now();
    }

    //////////////////////// play ///////////////////////////////////////////////////////
    function play() {
        // Need to adjust this code as we are causing a loop to occur and burn cycles even when
        // the app is apparently paused.
        //if (state === gameState.running) {
        if (state !== gameState.over) {
                draw();
            playCount++;
            animationHandle = window.requestAnimationFrame(play);
        }
        if (state === gameState.over) {

            PaddleBall.Lib.rectAndText(elWidth / 4, elHeight / 4, elWidth / 2, elHeight / 2, "GAME OVER", "rgba(0, 0, 0, .75)", "rgba(0,0,0,1)",
            "#fff");

            if (animationHandle)
                window.cancelAnimationFrame(animationHandle);

            // Store value in local storage, if higher thatn existing
            var highScore = window.localStorage.getItem('highScore');
            highScore = (highScore !== undefined || highScore < playCount-1) ? playCount : highScore;
            window.localStorage.setItem('highScore', playCount - 1);
            var d = Date.now();
            window.localStorage.setItem(d.toString(), playCount - 1);
        }
    }

    ////////////////////// Init logic /////////////////////////////////////////////////
    var elWidth = 300, elHeight = 300;
    var elCanvas, playCount = 0;
    var mouseX = 0, mouseY = 0;
    var viewModel = {
        ballSpeed: 1, ballSize: 1, paddleXMovement: 5, paddleSize: 1,
        brickHeight: 50, brickWidth: 100, brickPadding: 10, numberOfBricks: 20,
        brickTopOffset: 20, brickLeftOffset: 0, brickPlayOffset: 400,
        bricks: null, bricksPerRow: 0,
        bricksRemaining: 0, bricksToHit: 0, visible: true,
        brickSize_w: 0, brickSize_h: 0
    };

    function initViewModelBricks() {
        if (viewModel.bricks)
            delete viewModel.bricks;

        viewModel.bricks = new Array(viewModel.numberOfBricks);
        for (var i = 0; i < viewModel.numberOfBricks; i++)
            viewModel.bricks[i] = { hit: false, hitCounter: 0, xpos: -1, ypos: -1 };

        viewModel.bricksToHit = viewModel.bricksRemaining = viewModel.numberOfBricks;
        viewModel.brickSize_h = viewModel.brickHeight + viewModel.brickPadding;
        viewModel.brickSize_w = viewModel.brickWidth + viewModel.brickPadding;
    }
    function initView() {
        var x, y, x_counter = 0;

        var c = document.querySelector("#bricksCount");

        viewModel.brickPlayOffset = elHeight - 2* viewModel.brickSize_h;
        viewModel.bricksPerRow = parseInt(elWidth / viewModel.brickSize_w);
        viewModel.brickLeftOffset = parseInt((elCanvas.width + viewModel.brickPadding - viewModel.bricksPerRow * viewModel.brickSize_w) / 2);
        viewModel.numberOfBricks = c.value;

        // Paddle size
        paddle_w = elWidth / 20 * viewModel.paddleSize;

        paddle_h = elHeight / 20;
        paddle_x = (elWidth - paddle_w) / 2;
        paddle_y = elHeight - paddle_h - 5;
        paddleOldX = 0; paddleOldY = 0;

        // Ball position
        ball_x = elWidth / 2;
        ball_y = paddle_y - paddle_h - 10;
        ball_r = 10 * viewModel.ballSize;

        // Ball increments
        ball_dx = baseDx * viewModel.ballSpeed;
        ball_dy = baseDx * 2 * viewModel.ballSpeed;

        // Paddle position and increments
        moveDx = viewModel.paddleXMovement * viewModel.ballSpeed;
        mouseX = paddle_x;
        mouseY = paddle_y;

        if (animationHandle)
            window.cancelAnimationFrame(animationHandle);
    }
    function init() {
        elCanvas = document.querySelector("#gameCanvas");
        elBallSpeed = document.querySelector("#ballspeed");
        PaddleBall.Lib.init(elCanvas);
        
        setUpScale();
        setUpOptions();
        setUpKeyOperations();
        setUpMouseOperations();
        initViewModelBricks();

        state = gameState.stopped;
        initView();
        play();
    }
    function setUpScale() {
        // Issue is that the size computes prior to the scroll bar or the CSS adjustment for width
        // Therefor assume 100% and remove a scroll bar width - e.g. 12px
        var e = document.querySelector("#sizer");
        var h = parseInt(window.innerHeight*.6);

        if (!elCanvas) return;
        elCanvas.setAttribute("width", e.offsetWidth - e.offsetLeft - 30);
        elCanvas.setAttribute("height", h);

        elHeight = elCanvas.height;
        elWidth = elCanvas.width;
    }
    function setUpOptions() {
        var elSpeed = document.querySelector("#speed");
        elSpeed.addEventListener("change", function (e) {
            options({ speed: e.currentTarget.value, size: viewModel.ballSize, paddle: viewModel.paddleSize });
        }, false);
        var elBall = document.querySelector("#ball");
        elBall.addEventListener("change", function (e) {
            options({ size: e.currentTarget.value, speed: viewModel.ballSpeed, paddle: viewModel.paddleSize });
        }, false);
        var elPaddle = document.querySelector("#paddle");
        elPaddle.addEventListener("change", function (e) {
            options({ paddle: this.value, speed: viewModel.ballSpeed, size: viewModel.ballSize });
        }, false);
        var elBricks = document.querySelector("#bricksCount");
        elBricks.addEventListener("change", function (e) {
            this.dataset.value = viewModel.numberOfBricks = this.value;
            initViewModelBricks();
            initView();
            play();
        }, false);
    }
    var moveDx = 10, shift = false;
    function setUpKeyOperations() {
        // Set up the keyboard strokes to move the paddle
        document.body.addEventListener("keydown", function (e) {
            // Determine the type of key stroke
            switch (e.keyCode) {
                case WinJS.Utilities.Key.upArrow:
                    mouseY -= moveDy * ((shift) ? 5 : 1);
                    break;
                case WinJS.Utilities.Key.downArrow:
                    mouseY += moveDy * ((shift) ? 5 : 1);
                    break;
                case WinJS.Utilities.Key.leftArrow:
                    mouseX -= moveDx * ((shift) ? 5 : 1);
                    break;
                case WinJS.Utilities.Key.rightArrow:
                    mouseX += moveDx * ((shift) ? 5 : 1);
                    break;
                case WinJS.Utilities.Key.shift:
                    shift = true;
                    break;
                case WinJS.Utilities.Key.enter:
                case WinJS.Utilities.Key.escape:
                    changeState();
                    break;
            }
        }, false);
    }
    function setUpMouseOperations() {
        elCanvas.addEventListener("click", function (e) {
            changeState();
        }, false);

        // Set up the mouse move to move the paddle when in the canvas
        elCanvas.addEventListener("mousemove", function (e) {
            mouseX = e.pageX;
            mouseY = e.pageY;
        }, false);
    }
    PaddleBall.init = init;
})(this);

(function (global, PaddleBall) {
    var ctx;
    function init(element) {
        ctx = element.getContext("2d");
    }
    function clear(w, h) {
        ctx.clearRect(0, 0, w, h);
    }
    function circle(x, y, r) {
        ctx.fillStyle = "#00A308";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    }
    function star(x, y, w, style, strokeStyle) {
        ctx.fillStyle = style;
        ctx.beginPath();
        if (strokeStyle !== undefined) {
            ctx.moveTo(x, y-w);
            ctx.lineTo(x+w/3, y-w/3);
            ctx.lineTo(x+w, y);
            ctx.lineTo(x+w/3, y+w/3);
            ctx.lineTo(x, y + w);
            ctx.lineTo(x-w/3, y+w/3);
            ctx.lineTo(x-w, y);
            ctx.lineTo(x-w/3, y-w/3);
            ctx.lineTo(x, y-w);
        }
        ctx.closePath();

        ctx.fill();

        if (strokeStyle !== undefined) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
        }

    }
    function rect(x, y, w, h, style, strokeStyle) {
        ctx.fillStyle = style;
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        if (strokeStyle !== undefined) {
            ctx.moveTo(x, y);
            ctx.lineTo(x+w, y);
            ctx.lineTo(x+w, y+h);
            ctx.lineTo(x, y+h);
            ctx.lineTo(x, y);
        }
        ctx.closePath();

        ctx.fill();

        if (strokeStyle !== undefined) {
            ctx.lineWidth = 5;
            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
        }
    }
    function rectAndText(x, y, w, h, t, style, strokeStyle, textStyle) {
        rect(x, y, w, h, style, strokeStyle);
        ctx.fillStyle = textStyle;
        ctx.font = 'italic 30px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(t, x + w / 2, y + h / 2);
    }
    PaddleBall.Lib = {
        clear: clear,
        circle: circle,
        rect: rect,
        star: star,
        rectAndText: rectAndText,
        init: init
    };
   
})(this, PaddleBall);
