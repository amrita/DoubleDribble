// Project settings
$.jQTouch({
	icon: 'images/icon.png',
	startupScreen: 'images/splash.png',
	addGlossToIcon: false,
	statusBar: 'default'
});

//GLOBAL VARIABLES

// Global ball array
var ball;

//Global click (x,y) position
var clickX;
var clickY;

var ballX;
var ballY;

var answerY;

//top of the baseboard
var topBaseboard;

/*decimal Equivalent of the answer 
var decimalEquivalent = [0.25,0.40,0.50,1.00,0.30,0.66,0.80,0.35,0.70,0.33];
var numerators=         [   1,   2,   1,   1,   3,   2,   4,   7,   7,   1];
var denominators=       [   4,   5,   2,   1,  10,   3,   5,  20,  10,   3];
var id     = 0; 
var randomId; 
*/

var error			 = 15; // error allowed in pixels. 
var closeEnoughError = 30;

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
	
	//alert("gameScreenHasAppeared");
	//get the x value for the top of the baseboard
	topBaseboard = parseInt($(".baseboardclass").css("margin-top"));
	
	//alert("gameScreenHasAppeared1");
	// This is the animation timer
	timerLoop = setInterval("animationLoop()", 50);
	
	//alert("gameScreenHasAppeared1a");
	//set level parameters
	setLevelParameters();
	
	//alert("gameScreenHasAppeared1b");
	// Initialize problem arrays
	createFractionProblem2DArray();
	//alert("gameScreenHasAppeared1c"); 
	createMultiplicationProblem2DArray();
	//alert("gameScreenHasAppeared1d");
	currentProblem = fractionProblems[2][1];
	
	//alert("gameScreenHasAppeared2");
	// Add ball to screen
	addBall();
	
	//alert("gameScreenHasAppeared3");
	//check for accelerometer movement
	startWatchingForShaking();
	
}

/******* ACCELEROMETER CODE *******/
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

/******* BUTTON CODE *******/
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
	
	//alert("animationloop");
	// Move the ball position down 1 pixel	
	var top = parseInt(ball.css("top"));
	var newTop = top + velocity;
	if (newTop > 360) {
		//alert("top: "+top+" vel: "+velocity);
		//newTop = 0;
		newTop = 360;
		//velocity = 0.0;
		//velocity *= -1.0; - Gradually made ball jump higher and higher
		velocity = BOUNCE_VELOCITY;
		yVal = 0.0;
	}
	$(ball).css("top", parseInt(newTop));
	
	// Move left/right
	var left = parseInt(ball.css("left"));
	var newLeft = left + yVal;
	if (newLeft < -20) {
		// BOUNCE
		newLeft += (newLeft + 20);
		yVal *= -1;
	} else if (newLeft > 300) {
		// BOUNCE
		newLeft -= (newLeft - 300); // subtract the amount over 310 from 310
		yVal *= -1;
	}
	$(ball).css("left", newLeft);
	
	//set the current x,y co-ordinates of the object
	setObjectXY(ball);

	
	//if the object has hit the baseboard check the answer
	if (ballX >= topBaseboard){
		checkAnswer(ballX,ballY,answerY,ball);
	} 	
	
	//change velocity for the next loop entry
	velocity += gravity;
	
}

//checks to see if the answer is correct or not 
function checkAnswer(X,Y,answer,ball){
	
	//if the answer is correct then light up baseboard 
	if ((Y >= (answer - error)) && (Y <= (answer + error))){
			
		//set timeout
		//setTimeout("",2000);
		
		//save the denominator
		var olddenom = currentProblem.denominator;
		
		bullseyeAnswer(answer);
		computeBaseboardAnswer(currentProblem.decimalEquivalent, baseboardMin, baseboardMax);
		//set the new problem
		//ball.text(decimalEquivalent[randomId]);
		//setNewProblem(randomId);
		
		//re-initialize the ball position
		//initializePositionForBall(ball);
		
		//clear the display answer board;
		clearAnswerBoard();
		//clear any existing hints
		clearArrowHint();
		//clear the number line hints
		clearDenominatorHint(olddenom);
		//reset current try to 1
		currentTry = 1;
		
		
	} else {
		//increment the number of tries 
		currentTry++;
		streakCounter = 0;
		adjustProblemProbabilities('wrong');
		//alert("current try is " + currentTry);
		
		//the current try is 
		switch(currentTry){
		  case 2:
				//show hint 
				showArrowHint(X,Y,answer);
				playWrongAnswerSound();
                break;
		  case 3:
				//clear any previous hints
				clearArrowHint();
				//show hint 
				showDenominatorHint(X,Y,answer);
				playWrongAnswerSound();
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

/*
function setNewProblem(randomId) {
	
	$("#numerator").text(numerators[randomId]);
	$("#denominator").text(denominators[randomId]);
}
 */


//set the current x,y co-ordinates of the ball 
function setObjectXY(obj){
	var top;
	var left;
	var width;
	var height;
	
	top    = parseInt(obj.css("top"));
	height = parseInt(obj.css("height"));
	ballX  = top + height;
	
	left   = parseInt(obj.css("left"));
	width  = parseInt(obj.css("width"));	
	ballY  = left + (width / 2);
	
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

function setLevelParameters(){
	$("#baseMin").text(baseboardMin);
	$("#baseMax").text(baseboardMax);
}

//does types 0 - 1, 0 - 2, 0 - 100, 1 - 2 and so on .. 
function computeBoardLocation(problemId,bMin,bMax){
  var phoneWidth = 320;
	
	// compute the Y co-ordinate on the baseboard where the correct answer should be 
	var answer    = problemId * (phoneWidth / (bMax - bMin));
	
	return answer;
}

function addBall()
{
	
	computeBaseboardAnswer(currentProblem.decimalEquivalent,baseboardMin,baseboardMax);
	
	displayCurrentProblem();
	
	//$("#ball").text(decimalEquivalent[randomId]);
	
	// Now, we need to grab a reference to the ball we just added to the HTML
	ball = $("#ball");
	
	// Set the ball's position using a "helper" function
	initializePositionForBall(ball);
}

function initializePositionForBall(ball)
{
	// We will position the ball above the top of the screen and at a random x position
	var ballHeight = parseInt(ball.css("height"));
	var ballWidth = parseInt(ball.css("width"));
	var screenWidth = parseInt($("#game-screen").css("width"));
	
	// Start the ball just above the top of the screen
	//var newBallTop = -1 * ballHeight;
	var newBallTop = 10;
	
	// Make sure the ball doesn't hang off the right side of the screen
	var maxLeft = screenWidth - ballWidth;
	var newBallLeft = Math.floor(Math.random() * maxLeft);
	
	// Finally, update the ball's position
	ball.css("top", newBallTop);
	ball.css("left", newBallLeft);
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
	
	denom = currentProblem.denominator;
	
	//alert("in show denom hint denom is " + denom );
	
	//compute points on the number line based on the denominator
	for (i = 1; i <= denom; i++){
		
		//compute the decimal value of the point
	  decimalvalue	= i / denom; 
		
		//compute the pixel where it should be on the baseboard 
		answer        = computeBoardLocation(decimalvalue,baseboardMin, baseboardMax);
		
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
	//$("#answerboard").css("visibility","visible");
	$("#answerboard").fadeIn('fast');
  
}

// clear the answer board
function clearAnswerBoard(answerY){
	
	$("#answerboard").fadeOut('slow');
	//$("#answerboard").css("width",0);
	
	//make it invisible 
	//$("#answerboard").css("visibility","hidden");
  
}


function gameOver(){
  alert("Game Over !!");
}


/********* LEVEL CODE **********/

// Global variables
var currentLevel = 1;    // Tracks the player's current level
var highestLevel = 8;    // The highest level achieveable in the game
var currentLevelType = 'fraction';  // Tracks the current type of level 
var highestDenominator = [0,4,8,12,20,4,8,12,20];  // Holds the largest denominator available for each level
var problemsFinishedThisLevel = 0; // Tracks how many problems a player has completed on this current level
var numProblemsPerLevel = 20; // Tracks how many problems a player completes per level, 

var currentTry = 1;  // Tracks how many tries the player has attempted on currentProblem. First try = 1;
var maxTries = 4; // Sets the maximum amount of tries a player may make on a singleProblem
var playerScore = 0; // Tracks players score

var baseboardMin = 0; // Tracks the lower number on the baseboard
var baseboardMax = 1; // Tracks the upper number on the baseboard
var baseboardMaxPotential = 2; // The highest number the game will ever make the baseboardMax (used for generating fractions)

var streakCounter = 0; // Tracks the number of continuous problems solved correctly 
var skunk = 2; // The number of continuous answers needed to skunk a level

var fractionProblems = new Array(); // Creating an Array to hold all the fraction problems
var currentProblem;  // Tracks the current problem the player is working on

var multiplicationProblems = new Array(); // Creating an Array to hold all the multiplication problems
var highestMultiplier = 10; // The highest number for multiplication problems

// Creating the problemObject 
function problemObject()
{
	this.problemType = 'fraction'; // default is fraction, other types could be fractionAddition, percent, integer, etc
	this.numerator = 1;
	this.denominator = 1;
	this.decimalEquivalent = 1;   // this is the "answer" for this problem, it's decimalEquivalent;
	this.probability = .5;  // this is the probability (between 0-1) that this problem will be put on the screen once it is selected
}

/*
function initialize()
{
	createFractionProblem2DArray(); 
	createMultiplicationProblem2DArray();
	initializeProbabilities();
	currentProblem = fractionProblems[2][1];
	
	displayFirstProblem();
}
*/

// Shows the first problem "1", and then once the 1 is solved correctly, pulls the next problem
// TODO: implement
function displayFirstProblem()
{
	
}


//
//  GAMEPLAY FUNCTIONS
//  Functions related to levels, scoring, answers
//

// Calls the appropriate bulleye sound and graphic, adjusts the score, and pulls the next problem
function bullseyeAnswer(answer)
{
	//lights up the baseboard to the correct value
	displayAnswerBoard(answer);
	
	playBullseyeSound();
	adjustScore('bullseye');
	adjustProblemProbabilities('bullseye');
	nextProblem();
}

// Calls the appropriate closeEnough sound and graphic, adjusts the score, and pulls the next problem
function closeEnoughAnswer()
{
	displayCloseEnoughGraphic();
	playCloseEnoughSound();
	adjustScore('closeEnough');	
	adjustProblemProbabilities('closeEnough');
	nextProblem();
}

// Displays the graphic that highlights the baseboard and shows the decimal equivalent under the baseboard
function displayBullseyeGraphic()
{
	
}

// Plays a random sound from the bullseyeSoundArray
function playBullseyeSound()
{
	
}

// Displays the graphic that highlights the baseboard and shows the decimal equivalent under the baseboard
function displayCloseEnoughGraphic()
{
	
}

// Plays a random sound from the closeEnoughSoundArray
function playCloseEnoughSound()
{
	
}

// Increases score based on accuracy and currentTry
function adjustScore(accuracy)
{
	if(currentTry > 2){
		return;
	}
	else if(currentTry == 1){
		switch(accuracy){
			case 'bullseye':
				increaseScore(20);
				break;
			case 'closeEnough':
				increaseScore(15);
				break;
		}
	}
	else if(currentTry == 2){
		switch(accuracy){
			case 'bullseye':
				increaseScore(15);
				break;
			case 'closeEnough':
				increaseScore(10);
				break;	
		}
	}
}

// Increases playerScore by the amount passed, and redisplays the new value
function increaseScore(increase)
{
	playerScore = playerScore + increase;
	$("#score").text(playerScore);
}

function playWrongAnswerSound()
{
	
}

function bonusGraphic()
{
	
}

// Controls the sequences of levels
function nextLevel()
{
	currentLevel++;
	//alert('level' + currentLevel);
	$("#level").text(currentLevel);
	
	streakCounter = 0;
	problemsFinishedThisLevel = 0;
	
	if(currentLevel == 5){
		baseboardMax = 2;  // After 4th level, this sets the baseboardMax to 2, leading to improper fractions
	}   	
	
	if(currentLevel == 9){ 
		currentLevelType = 'multiplication';
		baseboardMax = highestMultiplier * highestMultiplier;
	}
}


//
//  PROBLEM GENERATION FUNCTIONS
//  Functions related to working with the fractionProblems 2D array
//

// Creates the double array that holds all the fraction problems. 
// fractionProblems uses the syntax [denominator][numerator]
// For example, fractionProblems[2][1] is where the problemObject 1/2 lives.  
function createFractionProblem2DArray()
{
	for(var denom = 1; denom <= highestDenominator[highestLevel]; denom++){   
		fractionProblems[denom] = new Array();
		
		for(var numer = 0; numer <= (denom * baseboardMaxPotential); numer++) // this stops fraction being created that are larger than the baseboard
		{ 			
			fractionProblems[denom][numer] = new problemObject(); 
			fractionProblems[denom][numer].numerator = numer; 
			fractionProblems[denom][numer].denominator = denom;
			fractionProblems[denom][numer].decimalEquivalent = (numer / denom);
			
			if(numer == 0){   
				fractionProblems[denom][numer].probability = .0;  // sets lower probabilities for 0 in the numerator
			} else if (numer == denom){  
				fractionProblems[denom][numer].probability = .0;  // sets lower probabilities for all fractions = 1
			} else if (numer == 1){
				fractionProblems[denom][numer].probability = .1;  // sets high probability for when numer = 1
			} else {
				fractionProblems[denom][numer].probability = .5;  // the rest are defaulted to .5 probability
			}			
		}
	}
}

// Creates the 2D array that holds all the multiplication problems
function createMultiplicationProblem2DArray()
{
	for(var firstNum = 0; firstNum <= highestMultiplier; firstNum++){
		
		multiplicationProblems[firstNum] = new Array();
		
		for(var secondNum = 0; secondNum <= highestMultiplier; secondNum++){
			
			multiplicationProblems[firstNum][secondNum] = new problemObject();
			multiplicationProblems[firstNum][secondNum].problemType = 'multiplication'; 
			multiplicationProblems[firstNum][secondNum].numerator = firstNum; 
			// Note that this is a hacky misnomer. We are storing the first number of the multiplication problem as the "numerator". Sorry, God. 
			multiplicationProblems[firstNum][secondNum].denominator = secondNum; 
			multiplicationProblems[firstNum][secondNum].decimalEquivalent = firstNum * secondNum;
			multiplicationProblems[firstNum][secondNum].probability = .5;
		}
	}
}


// Initializes the probabilities for each of the fractions up to denom level 5 - the rest are defaulted to 
function initializeProbabilities()
{
	// emptied out b/c these are now set inside createFractionProblem2DArray
}

// Adjusts the problem and related problem probabilties based on accuracy 
// and creates and displays a new problem  
function nextProblem()
{
	streakCounter++;
	currentTry = 1;
	
	if(streakCounter >= skunk){
		increaseScore(50);
		bonusGraphic();
		nextLevel();		
	}
	
	problemsFinishedThisLevel++;
	if(problemsFinishedThisLevel >= numProblemsPerLevel){
		nextLevel();
	}
	
	getNewProblem();
	displayCurrentProblem();
}


// Adjusts the probabilities of the currentProblem and related problems
function adjustProblemProbabilities(accuracy)
{
	var currentProblemMultiplier;
	var relatedProblemMultiplier;
	switch(accuracy){
		case 'bullseye':
			currentProblemMultiplier = .5;  // If you get a bullseye, the problemProbability for the current problem will decrease by a factor of 2
			relatedProblemMultiplier = .8;  // and related problem probabilities will decrease by a factor of .2
			break;
		case 'closeEnough':
			currentProblemMultiplier = .75;
			relatedProblemMultiplier = .9;			
			break;
		case 'wrong':
			currentProblemMultiplier = 1.6;  // If you get a problem wrong, probabilities increase
			relatedProblemMultiplier = 1.3;
			break;
	}
	
	var currentProblemProbability = currentProblem.probability;
	var newProblemProbability = currentProblemProbability * currentProblemMultiplier;
	currentProblem.probability = Math.min(1,newProblemProbability); // ensures probabilities never get larger than 1
	
	var denom = currentProblem.denominator;  // changes probabilities for all related problems
	for(var numer = 0; numer <= currentProblem.denominator; numer++){  
		currentProblemProbability = fractionProblems[denom][numer].probability;
		newProblemProbability = currentProblemProbability * relatedProblemMultiplier;
		if(numer != currentProblem.numerator){ // we don't adjust this problem because we already did
			fractionProblems[denom][numer].probability = Math.min(1,newProblemProbability);
		}
	}
}

// Changes the currentProblem by randomly choosing a denominator value, and then a numerator value to select a 
// random fractionProblem in the fractionProblems array. Then the function examines that problems's probability and 
// either accepts this as the new problem, or begins the search anew. 
function getNewProblem()
{
	switch(currentLevelType){
		case 'fraction':
			do{	
				var randomFloat = Math.random();
				var denom = getRandomInteger(2,highestDenominator[currentLevel]);
				var numer = getRandomInteger(0,(denom * baseboardMax));
			} while(randomFloat > fractionProblems[denom][numer].probability);   
			// exits the do loop once it has found a problem probability higher than the randomFloat
			currentProblem = fractionProblems[denom][numer];
			break;
		case 'multiplication':
			do{
				var randomFloat = Math.random();
				var firstNum = getRandomInteger(0,highestMultiplier);
				var secondNum = getRandomInteger(0,highestMultiplier);
			} while(randomFloat > multiplicationProblems[firstNum][secondNum].probability); 
			currentProblem = multiplicationProblems[firstNum][secondNum];
			break;
	} 
}

// Changes the ball to reflect the current problem, taking into consideration the problem type
function displayCurrentProblem()
{
	switch(currentProblem.problemType){
		case 'fraction':
			//var fractionString = currentProblem.numerator + "/" + currentProblem.denominator;
			//$("#current-problem").text(fractionString);
			$("#numerator").text(currentProblem.numerator);
			$("#denominator").text(currentProblem.denominator);
			break;
		case 'multiplication':
			var fractionString = currentProblem.numerator + "x" + currentProblem.denominator;
			$("#current-problem").text(fractionString);
			break;
		case 'integer':
			break;
	}
}


//
// Helper functions
//


// Returns a random integer between the min and max, inclusive 
function getRandomInteger(min,max)
{
	return( Math.floor(Math.random() * (max - min + 1) + min));
}



