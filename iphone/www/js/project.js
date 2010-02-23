// Project settings
$.jQTouch({
	icon: 'images/icon.png',
	startupScreen: 'images/splash.png',
	addGlossToIcon: false,
	statusBar: 'default'
});

// Initialization method
$(function() {
  if (typeof(PhoneGap) != "undefined") {
	$("body > *").css("minHeight", "460px !important");
  }
  $(document).ready(pageIsLoaded);
});

var yVal = 0.0;
var GRAV = 8.1;
var gravity = GRAV * 50.0 / 1000.0;
var BOUNCE_VELOCITY = -13.5;
var velocity = 0.0;

function pageIsLoaded()
{
	$("#game-screen").bind("pageAnimationEnd", gameScreenHasAppeared);
	//$("#axis-left").click(leftAxisClick);
	//$("#axis-right").click(rightAxisClick);
	
}

function startWatchingForShaking() {
	var win = function(coords){
		accelerometerFired(coords); 		
	};
	var fail = function(){};
	var options = { frequency : 100 };
	var watcher = navigator.accelerometer.watchAcceleration(win, fail, options);
	
	//alert("accelerometer loaded: "+watchId);
}

function accelerometerFired(coords) {
	if ((yVal > 0.0 && coords.x < 0.0) || (yVal < 0.0 && coords.x > 0.0)) {
		yVal = coords.x;
	}
	yVal += coords.x * 4.0;
}


var yDELTA = 1.0; // this is for left and right click buttons (not used when accelerometer is on)
function leftAxisClick() {
	yVal -= yDELTA;
}
function rightAxisClick() {
	yVal += yDELTA;
}

function gameScreenHasAppeared()
{
//	setTimeout("dropDuck()", 1000);

	// This is the animation timer
	setInterval("animationLoop()", 50);

	// This is the timer for adding new ducks
	//setInterval("addDuck()", 8000);

	// Go ahead and add the first duck right now
	addDuck();
	
	startWatchingForShaking();
}

// Global duck array
var ducks = [];

function animationLoop()
{
	// Move all the ducks
	for (index in ducks)
	{
		// Access the duck at the current index
		var duck = ducks[index];

		// Move the duck position down 1 pixel	
		var top = parseInt(duck.css("top"));
		var newTop;
		if (top > 350) {
			//alert("top: "+top+" vel: "+velocity);
			//newTop = 0;
			newTop = 300;
			//velocity = 0.0;
			//velocity *= -1.0; - Gradually made duck jump higher and higher
			velocity = BOUNCE_VELOCITY;
			yVal = 0.0;
		} else {
			newTop = top + velocity;
		}
		$(duck).css("top", parseInt(newTop));
		
		// Move left/right
		var left = parseInt(duck.css("left"));
		var newLeft = left + yVal;
		if (newLeft < 0) {
			// BOUNCE
			newLeft *= -1;
			yVal *= -1;
		} else if (newLeft > 270) {
			// BOUNCE
			newLeft -= (newLeft - 270); // subtract the amount over 310 from 310
			yVal *= -1;
		}
		$(duck).css("left", newLeft);
				
	}	
	
	velocity += gravity;
	// You can also do other things in the animation loop,
	// like checking to see if a duck has hit the bottom of the
	// screen or not.
	//
	// Also, you can use a global boolean variable to determine
	// whether or not you should keep animating the ducks
	// dropping or not.
}



function duckTapped() {
	var quack = new Media("www/sounds/quack.wav");
	quack.play();
}

function addDuck()
{
	// Figure out the duck's id number
	var idNumber = ducks.length;

	// Add the duck HTML
	$("#game-screen").append('<div id="duck-' + idNumber + '" class="duck">' + idNumber + '</div>');

	// Now, we need to grab a reference to the duck we just added to the HTML
	var duck = $("#duck-" + idNumber);
	
	duck.click(duckTapped);
	
	// Add the duck to the ducks array
	ducks.push(duck);

	// Set the duck's position using a "helper" function
	initializePositionForDuck(duck);
}

function initializePositionForDuck(duck)
{
	// We will position the duck above the top of the screen and at a random x position
	var duckHeight = parseInt(duck.css("height"));
	var duckWidth = parseInt(duck.css("width"));
	var screenWidth = parseInt($("#game-screen").css("width"));
	
	// Start the duck just above the top of the screen
	//var newDuckTop = -1 * duckHeight;
	var newDuckTop = 10;
	
	// Make sure the duck doesn't hang off the right side of the screen
	var maxLeft = screenWidth - duckWidth;
	var newDuckLeft = Math.floor(Math.random() * maxLeft);
	
	// Finally, update the duck's position
	duck.css("top", newDuckTop);
	duck.css("left", newDuckLeft);
}

