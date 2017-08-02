/* 
 * Creates a JSON Object to wrap everything nicely; includes func to initialize
 * canvas.
 */
var Context = {
  canvas: null,
  context: null,
  create: function(canvas_tag_id) {
    this.canvas = document.getElementById(canvas_tag_id);
    this.context = this.canvas.getContext("2d");
    return this.context;
  }
};

var Sprite = function(filename, is_pattern) {
  
  // Construct the object
  this.image = null;
  this.pattern = null;
  this.TO_RADIANS = Math.PI/180;

  // Check to make sure filename is not undefined
  if (filename != undefined && filename != "" && filename != null) {
    this.image = new Image();
    this.image.src = filename;

    if (is_pattern) {
      this.pattern = Context.context.createPattern(this.image, 'repeat');
    }
  } else {
    console.log("Unable to load sprite.");
  }

  this.draw = function(x, y, w, h) {
    // Is this a Pattern?
    if (this.pattern != null) {
      Context.context.fillStyle = this.pattern;
      Context.context.fillRect(x, y, w, h);
    } else {
      // If not a Pattern, then this is an Image
      if (w != undefined || h != undefined) {
        Context.context.drawImage(this.image, x, y, 
                                  this.image.width,
                                  this.image.height);
      } else {
        // Stretched
        Context.context.drawImage(this.image, x, y, w, h);
      }
    }
  };

  this.rotate = function(x, y, angle) {
    // Save and restore state of our Context
    Context.context.save();
    Context.context.translate(x, y);
    Context.context.rotate(angle * this.TO_RADIANS);
    Context.context.drawImage(this.image, 
                            -(this.image.width/2),
                            -(this.image.height/2));
    Context.context.restore();
  };

};

$(document).ready(function() {

    // Initialize Sprites, Load pictures...
    // "canvas" string - we get Element by ID from the html file
    Context.create("canvas"); 

    // Important for when you are drawing different shapes
    Context.context.beginPath();
    Context.context.rect(0, 0, 640, 480);
    Context.context.fillStyle = "#000000";
    Context.context.fill();
    Context.context.closePath();

    // Image sources
    var WALL = "http://www.tigrisgames.com/wall.png";
    var CRATE = "http://www.tigrisgames.com/crate.png";

    // Images on screen
    var image = new Sprite(WALL, false);
    var image2 = new Sprite(CRATE, false);
    var pattern = new Sprite(CRATE, true);
    var angle = 0;
    // Ball starting position
    var x = canvas.width/2;
    var y = canvas.height - 30;
    // Change in ball positions
    var dx = 2;
    var dy = -2;
    // Ball dimensions
    var ballRadius = 10;
    // Paddle dimensions
    var paddleHeight = 10;
    var paddleWidth = 75;
    // Paddle's starting point on x axis
    var paddleX = (canvas.width - paddleWidth) / 2;
    // Bools to check if left/right/spacebar are pressed
    var rightPressed = false;
    var leftPressed = false;
    var paused = false;
    
    // Obstacle position
    var obstacleXPos = 160;
    var obstacleYPos = 160;
    // Obstacle dimensions
    var obstacleWidth = 300;
    var obstacleHeight = 100;

    // Score
    var score = 0;
    // Lives
    var lives = 5;

    // Brick variables
    var brickRowCount = 3;
    var brickColumnCount = 7;
    var numBricks = brickRowCount * brickColumnCount;
    var brickWidth = 75;
    var brickHeight = 20;
    var brickPadding = 10;
    var brickOffsetTop = 30;
    var brickOffsetLeft = 30;

    var bricks = [];
    for (c = 0; c < brickColumnCount; c++) {
      bricks[c] = [];
      for (r = 0; r < brickRowCount; r++) {
        bricks[c][r] = {x: 0, y: 0, status: 1};
      }
    }

    // Function draws bricks on screen
    function drawBricks() {
      for (c = 0; c < brickColumnCount; c++) {
        for (r = 0; r < brickRowCount; r++) {
          if (bricks[c][r].status == 1) {
            var brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
            var brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
            bricks[c][r].x = brickX;
            bricks[c][r].y = brickY;
            Context.context.beginPath();
            Context.context.rect(brickX, brickY, brickWidth, brickHeight);
            Context.context.fillStyle = "#FFFFFF";
            Context.context.fill();
            Context.context.closePath();
          }
        }
      }
    }

    // Function draws ball on screen
    function drawBall() {
        Context.context.beginPath();
        Context.context.arc(x, y, ballRadius, 0, Math.PI*2);
        Context.context.fillStyle = "#FFFFFF";
        Context.context.fill();
        Context.context.closePath();
    }
    
    // Function draws paddle on screen
    function drawPaddle() {
      Context.context.beginPath();
      Context.context.rect(paddleX, canvas.height - paddleHeight, paddleWidth,
          paddleHeight);
      Context.context.fillStyle = "#FFFFFF";
      Context.context.fill();
      Context.context.closePath();
    }

    // loops
    function draw() {
      if (paused) {
        drawPause();
        return;
      }
        Context.context.fillStyle = "#000000";
        Context.context.fillRect(0, 0, 800, 800);

        //image.draw(0, 0, 64, 64);
        //image.draw(0, 74, 256, 32);
        pattern.draw(obstacleXPos, obstacleYPos, obstacleWidth, obstacleHeight);

        /*
        image.rotate(115, 160, angle += 3.0);
        image2.rotate(115, 260, -angle/2);
        */

        drawBricks();
        drawBall();
        drawPaddle();
        drawScore();
        drawLives();
        collisionDetection();
        
        if (x + dx + ballRadius > obstacleXPos && x + dx - ballRadius < obstacleXPos +
            obstacleWidth && y + dy + ballRadius > obstacleYPos && y + dy + ballRadius <
            obstacleYPos + obstacleHeight) {

          dx = -dx;
        }
        if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
          dx = -dx;
        }
        if (y + dy < ballRadius) {
          dy = -dy;
        } else if (y + dy > canvas.height - ballRadius) {
          if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
          } else {
            lives--;
            if (!lives) {
              alert("GAME OVER");
              document.location.reload();
            } else {
              x = canvas.width / 2;
              y = canvas.height - 30;
              dx = 2;
              dy = -2;
              paddleX = (canvas.width - paddleWidth) / 2;
            }
          }
        }
        if (rightPressed && paddleX < canvas.width - paddleWidth) {
          paddleX += 7;
        } else if (leftPressed && paddleX > 0) {
          paddleX -= 7;
        } else {
          paddleX += 0;
        }

        x += dx;
        y += dy;

    }

    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);

    function keyDownHandler(e) {
      if (e.keyCode == '39') {
        rightPressed = true;
      } else if (e.keyCode == '37') {
        leftPressed = true;
      }
    }

    function keyUpHandler(e) {
      if (e.keyCode == '39') {
        rightPressed = false;
      } else if (e.keyCode == '37') {
        leftPressed = false;
      } else if (e.keyCode == '32') {
        paused = !paused;
      }
    }

    /*
     * Draw Paused Message
     */
    function drawPause() {
      Context.context.font = "30px Arial";
      Context.context.fillStyle = "#FFFFFF";
      Context.context.fillText("GAME PAUSED", 200, 200);
      Context.context.font = "16px Arial";
      Context.context.fillText("Press Spacebar to Resume", 210, 230);
    }

    /* Function for collision detection that will loop through bricks and
     * compare each brick's pos with ball's pos
     */
    function collisionDetection() {
      for (c = 0; c < brickColumnCount; c++) {
        for (r = 0; r < brickRowCount; r++) {
          var b = bricks[c][r];
          if (b.status == 1) {
            // If center of ball is inside brick's coordinates, change dir of ball
            if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y +
                brickHeight) {
              dy = -dy;
              b.status = 0;
              score += lives;
              numBricks--;
              if (numBricks == 0) {
                alert("Congratulations, you won the game! Press OK to play again.");
                document.location.reload();
              }
            }
          }
        }
      }
    }

    // Function to keep track of and draw lives
    function drawLives() {
      Context.context.font = "16px Arial";
      Context.context.fillStyle = "#FFFFFF";
      Context.context.fillText("Lives: " + lives, canvas.width - 65,
          canvas.height - 20);
    }

    // Function to create and update score display
    function drawScore() {
      Context.context.font = "16px Arial";
      Context.context.fillStyle = "#FFFFFF";
      Context.context.fillText("Score: " + score, 8, 20);
    }

    setInterval(draw, 10);

});
