// Project settings
$.jQTouch({
	icon: 'images/icon.png',
	startupScreen: 'images/splash.png',
	addGlossToIcon: false,
	statusBar: 'default'
});

//GLOBAL VARIABLES

// Global duck array
var ducks = [];

//Global click (x,y) position
var clickX;
var clickY;

var duckX;
var duckY;

var answerY;

//top of the baseboard
var topBaseboard;

//current try 
var currentTry = 1;

//max tries
var maxTries = 4;

//problem counter
var numProblemsThisLevel;

//decimal Equivalent of the answer 
var decimalEquivalent = [0.25,0.40,0.50,1.00,0.30,0.66,0.80,0.35,0.70,0.33];
var numerators=         [   1,   2,   1,   1,   3,   2,   4,   7,   7,   1];
var denominators=       [   4,   5,   2,   1,  10,   3,   5,  20,  10,   3];
var id     = 0; 
var error  = 10; // error allowed in pixels. 
var randomId; 

//Baseboard min and max values
var baseBoardMin = 0;
var baseBoardMax = 1;

//accelerometer variables to make the object bounce
var yVal = 0.0;
var GRAV = 8.1;
var gravity = GRAV * 50.0 / 1000.0;
var BOUNCE_VELOCITY = -13.5;
var velocity = 0.0;
//not needed remove later 
var yDELTA = 1.0;

// Initialization method
$(function() {
  
  // A small patch to fix the background height of jQTouch pages under PhoneGap
  if (typeof(PhoneGap) != 'undefined') {
    $("body > *").css("minHeight", "460px !important");
  }	
  
  $(document).ready(pageIsLoaded);
});

function pageIsLoaded()
{

	$("#game-screen").bind("pageAnimationEnd", gameScreenHasAppeared);
}

function gameScreenHasAppeared()
{

	//get the x value for the top of the baseboard
	topBaseboard = parseInt($(".baseboardclass").css("margin-top"));

	// This is the animation timer
	timerLoop = setInterval("animationLoop()", 50);

	// This is the timer for adding new ducks
	//setInterval("addDuck()", 6000);
	
	//set level parameters
	setLevelParameters();

	// Go ahead and add the first duck right now
	addDuck();
	
	//check for accelerometer movement
	startWatchingForShaking();
	
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

function setLevelParameters(){
	$("#baseMin").text(baseBoardMin);
	$("#baseMax").text(baseBoardMax);
}

function leftAxisClick() {
	if (yVal > 0.0) {
		yVal = 0.0;
	}
	yVal -= yDELTA;	
}

function rightAxisClick() {
	if (yVal < 0.0) {
		yVal = 0.0;
	}
	yVal += yDELTA;
}

function animationLoop()
{
	var newBottom;
	var height;
	var width;
	var left;
	
	// Move all the ducks
	for (index in ducks)
	{
		// Access the duck at the current index
		var duck = ducks[index];
		
		
		// Move the duck position down 1 pixel	
		var top = parseInt(duck.css("top"));
		var newTop = top + velocity;
		if (newTop > 360) {
			//alert("top: "+top+" vel: "+velocity);
			//newTop = 0;
			newTop = 360;
			//velocity = 0.0;
			//velocity *= -1.0; - Gradually made duck jump higher and higher
			velocity = BOUNCE_VELOCITY;
			yVal = 0.0;
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
		
		//set the current x,y co-ordinates of the object
		setObjectXY(duck);
	
		//if the object has hit the baseboard check the answer
		if (duckX >= topBaseboard){
			checkAnswer(duckX,duckY,answerY,duck);
		}
	} // for ends 	
	
	//change velocity for the next loop entry
	velocity += gravity;
	
}

//checks to see if the answer is correct or not 
function checkAnswer(X,Y,answer,duck){
	
	//if the answer is correct then light up baseboard 
	if ((Y >= (answer - error)) && (Y <= (answer + error))){
	//if (Y == answer){
		//display the correct answer
		displayAnswerBoard(answer);
	
		//set timeout
		setTimeout("",2000);
		
		//save the denominator 
		var olddenom = denominators[randomId];
		
		// get another problem
		// get a random problem from the problems array
		randomId = Math.floor(Math.random() * 10);
		computeBaseboardAnswer(decimalEquivalent[randomId],baseBoardMin,baseBoardMax);
		//set the new problem
		duck.text(decimalEquivalent[randomId]);
		
		//re-initialize the duck position
		//initializePositionForDuck(duck);
		
		//clear the display answer board;
		clearAnswerBoard();
		//clear any existing hints
		clearArrowHint();
		//clear the number line hints
		clearDenominatorHint(olddenom);
		//reset current try to 1
		currentTry = 1;
		
		
	}
	else{
		//increment the number of tries 
		currentTry++;
		//alert("current try is " + currentTry);
		
		//the current try is 
		switch(currentTry){
		  case 2:
				//show hint 
				showArrowHint(X,Y,answer);
				//reset the position of the duck
				//initializePositionForDuck(duck);
                break;
			case 3:
				//clear any previous hints
				clearArrowHint();
				//show hint 
				showDenominatorHint(X,Y,answer);
				//reset the position of the duck
				//initializePositionForDuck(duck);
                break;
			case 4:	
			  currentTry = 1;
				clearInterval(timerLoop);	
				clearArrowHint();
				clearDenominatorHint();
				displayAnswerBoard(answerY);
				gameOver();	
				break;
		}
  }
	
}

//set the current x,y co-ordinates of the duck 
function setObjectXY(obj){
	var top;
	var left;
	var width;
	var height;
	
	top    = parseInt(obj.css("top"));
	height = parseInt(obj.css("height"));
	duckX  = top + height;
	
	left   = parseInt(obj.css("left"));
	width  = parseInt(obj.css("width"));	
	duckY  = left + (width / 2);
	
}

//based on the current problem decimal value compute the 
//x,y co-ordinates on the baseboard which is the 
//exact correct answer to the problem 

//does types 0 - 1, 0 - 2, 0 - 100, 1 - 2 and so on .. 
function computeBaseboardAnswer(problemId,bMin,bMax){
  var phoneWidth = 320;
	
	// compute the Y co-ordinate on the baseboard where the correct answer should be 
	answerY    = problemId * (phoneWidth / (bMax - bMin));
	
	//alert("the answer is " + answerY);
}


//does types 0 - 1, 0 - 2, 0 - 100, 1 - 2 and so on .. 
function computebBoardLocation(problemId,bMin,bMax){
  var phoneWidth = 320;
	
	// compute the Y co-ordinate on the baseboard where the correct answer should be 
	var answer    = problemId * (phoneWidth / (bMax - bMin));
	
	return answer;
}

function addDuck()
{
	// Figure out the duck's id number
	var idNumber = ducks.length;

	// get a random problem from the problems array
    randomId = Math.floor(Math.random() * 10);
	
	computeBaseboardAnswer(decimalEquivalent[randomId],baseBoardMin,baseBoardMax);
	
	// Add the duck HTML
	$("#game-screen").append('<div id="duck-' + idNumber + '" class="duck">' + decimalEquivalent[randomId] + '</div>');

	// Now, we need to grab a reference to the duck we just added to the HTML
	var duck = $("#duck-" + idNumber);

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

// show either the left or the right hint arrow based on the position
// of the ball as opposed to the correct answer 
function showArrowHint(X,Y,answer){
	
	//if the answer is less than the current location, show the left arrow
  if (Y > answer){
		var left    = parseInt($("#blackarrowleft").css("margin-left"));
		var width   = parseInt($("#blackarrowleft").css("width"));
		var newLeft = left + (Y - left) - width;
		
	  //set the new left value for the arrow 
		$("#blackarrowleft").css("margin-left",newLeft);			
		$("#blackarrowleft").css("visibility","visible");	
		$("#blackarrowright").css("visibility","hidden");
	}
	//if the answer is greater than the current location, show the right arrow
	else{
		var left    = parseInt($("#blackarrowright").css("margin-left"));
		var newLeft = left + (Y - left);
		
		//set the new left value for the arrow 
		$("#blackarrowright").css("margin-left",newLeft);			
		$("#blackarrowright").css("visibility","visible");	
		$("#blackarrowleft").css("visibility","hidden");	
	}
	
}

function clearArrowHint(){
	$("#blackarrowright").css("margin-left",0);	
  $("#blackarrowright").css("visibility","hidden");	
	$("#blackarrowright").css("margin-right",0);
	$("#blackarrowleft").css("visibility","hidden");	
	
}

// show either the left or the right hint arrow based on the position
// of the ball as opposed to the correct answer 
function showDenominatorHint(X,Y,answer){

	var decimalvalue;
	var answer;
	
	denom = denominators[randomId];
	
	//alert("in show denom hint denom is " + denom );
	
	//compute points on the number line based on the denominator
	for (i = 1; i <= denom; i++){
		
		//compute the decimal value of the point
	  decimalvalue	= i / denom; 
		
		//compute the pixel where it should be on the baseboard 
		answer        = computebBoardLocation(decimalvalue,baseBoardMin, baseBoardMax);
		
		//add the hint line to the pixel on the baseboard 
		$("#full-screen-area").append('<div id="hint-' + i + '" class="dHint"></div>');
		
		// Now, we need to grab a reference to the hint we just added to the HTML
		var pHint = $("#hint-" + i);
		
		//move the hint to the correct place on the number line
		pHint.css("margin-left",answer);

	}
}

function clearDenominatorHint(denom){
  for (i = 1; i <= denom; i++){
		$('#hint-' + i).remove();
	}
}

// if the correct answer was selected then light up the board 
function displayAnswerBoard(answerY){
	//set the newWidth to where the correct answer point is
	var newWidth = answerY;
	
	$("#answerboard").css("width",newWidth);
	
	//make it visible 
	$("#answerboard").css("visibility","visible");
  
}

// clear the answer board
function clearAnswerBoard(answerY){
	$("#answerboard").css("width",0);
	
	//make it invisible 
	$("#answerboard").css("visibility","hidden");
  
}


function gameOver(){
  alert("Game Over !!");
	
}
