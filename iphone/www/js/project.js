// Project settings
var jQT = new $.jQTouch({
	icon: 'images/icon.png',
	startupScreen: 'images/splash.png',
	addGlossToIcon: false,
	statusBar: 'default'
});

//GLOBAL VARIABLES

// The number of continuous answers needed to skunk a level
var skunk = 5; 

// Initial gravity for the app. For dynamic gravity changes use changeGravity()
var INIT_GRAVITY = 0.15;
// How much gravity is increased on success
var GRAVITY_CHANGE = .001;

// Set this to true if you're using the iPhone Simulator
var usingSimulator = false;

// Global ball array
var ball;

// ball values
var ballHeight;
var ballX;
var ballY;

var answerY;

//top of the baseboard
var topBaseboard;

//baseboard offset
var bboffset = 10;

//baseboard number colors
var bbcolors  = ['black','blue','green','purple'];
var bbcolorid = 0;

var error			 = 7; // error allowed in pixels. 
var closeEnoughError = 15;

//accelerometer variables to make the object bounce
var horizontalChange = 0.0; // Maintains the state of the accelerometer

// Used to turn sound on or off
var isSoundOn = true;

// whether the game is over
var gameIsOver = true;

//not needed remove later 
var yDELTA = 1.0;

// whether or not the player is playing the first problem in the game
var firstProblemInTheGame;

var currentLevel = 1;    // Tracks the player's current level
var highestLevel = 8;    // The highest level achieveable in the game
var currentLevelType = 'fraction';  // Tracks the current type of level 
var highestDenominator = [0,4,8,12,20,4,8,12,20];  // Holds the largest denominator available for each level
var problemsFinishedThisLevel = 0; // Tracks how many problems a player has completed on this current level
var numProblemsPerLevel = 15; // Tracks how many problems a player completes per level, 

var currentTry = 1;  // Tracks how many tries the player has attempted on currentProblem. First try = 1;
var maxTries = 4; // Sets the maximum amount of tries a player may make on a singleProblem
var playerScore = 0; // Tracks players score

var baseboardMin = 0; // Tracks the lower number on the baseboard
var baseboardMax = 1; // Tracks the upper number on the baseboard
var baseboardMaxPotential = 2; // The highest number the game will ever make the baseboardMax (used for generating fractions)

var streakCounter = 0; // Tracks the number of continuous problems solved correctly 

var fractionProblems = new Array(); // Creating an Array to hold all the fraction problems
var currentProblem;  // Tracks the current problem the player is working on

var multiplicationProblems = new Array(); // Creating an Array to hold all the multiplication problems
var highestMultiplier = 10; // The highest number for multiplication problems

var wrongAnswerSounds = new Array();
var closeEnoughSounds = new Array();
var bullseyeSounds = new Array();
var nextLevelSounds = new Array();


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
	
	
	$("#settings form").submit(saveSettings);
	$("#settings").bind("pageAnimationStart", loadSettingsScreen);
	
}

function gameScreenHasAppeared(event, info)
{
	if (info.direction == 'out') {
		return; // if we don't return, then we begin a whole new game when the user leaves the page.
	}
	
	//first load any preset settings
	loadSettingsForGame();
	
	//get the x value for the top of the baseboard
	topBaseboard = parseInt($(".baseboardclass").css("margin-top"));
	
	//set background image
	setLevelBackgroundImage(1);
	
	//set level parameters
	setBaseboardLimits();
	
	// Initialize problem arrays
	createFractionProblem2DArray();
	createMultiplicationProblem2DArray();
	currentProblem = fractionProblems[2][1];
	
	// Initialize Game sounds
	initializeGameSounds();
	
	// Add ball to screen
	addBall();
	
	//check for accelerometer movement
	startWatchingForShaking();
	
	// Show game start
	$("#game-start").fadeOut("slow");
	
	// Set up gravity and initialize oldTime for ball movement
	changeGravity(INIT_GRAVITY);
	_oldTime = new Date().getTime();
	
	// Reset game state
	restartGame();
}

/******* PREFERENCES CODE *******/
function loadSettingsForGame() {
	
	// Gravity
	if (localStorage.gravity != null) {
		INIT_GRAVITY = parseFloat(localStorage.gravity);
	}
	
	// Gravity Change
	if (localStorage.gravityChange != null) {
		setGravityChange(localStorage.gravityChange);
	}
	
	// Sound
	if (localStorage.sound != null) {
		isSoundOn = localStorage.sound == "true";
	}
}

function loadSettingsScreen() {
	
	// Gravity
	if (localStorage.gravity == null) {
		localStorage.gravity = INIT_GRAVITY;
	}
    $("#gravity").val([localStorage.gravity]);
	
	// Gravity Change
	if (localStorage.gravityChange == null) {
		localStorage.gravityChange = "g-static";
	}
	$("#gravity-change").val([localStorage.gravityChange]);
	
	// Sound
	if (localStorage.sound == null) {
		localStorage.sound = isSoundOn;
	} else {
		isSoundOn = localStorage.sound == "true";
	}
	if (isSoundOn) {
		$("#sound").val(["soundOn"]);
	}
}

function saveSettings() {
	// Sound
	isSoundOn = $("#sound").is(":checked");
	localStorage.sound = isSoundOn;
	
	// Gravity
	INIT_GRAVITY = parseFloat($("#gravity").val());
    localStorage.gravity = INIT_GRAVITY;
	
	// Gravity
	var gravChange = $("#gravity-change").val();
	setGravityChange(gravChange);
    localStorage.gravityChange = gravChange;
	
    jQT.goBack();
    return false;
}

function setGravityChange(changeValue) {
	switch (changeValue) {
		case "g-static": GRAVITY_CHANGE = 0.0; break;
		case "g-min": GRAVITY_CHANGE = 0.01; break;
		case "g-max": GRAVITY_CHANGE = 0.02; break;
		default: alert("default grav change??? shouldn't happen");
	}
}

/******* ACCELEROMETER CODE *******/
function startWatchingForShaking() {
	if (usingSimulator) {
		return;
	}
	
	var win = function(coords){
		accelerometerFired(coords); 		
	};
	var fail = function(){};
	var options = {};
	options.frequency = 100;
	var watcher = navigator.accelerometer.watchAcceleration(win, fail, options);
}

function accelerometerFired(coords) {
	if ((horizontalChange > 0.0 && coords.x < 0.0) || (horizontalChange < 0.0 && coords.x > 0.0)) {
		horizontalChange = coords.x;
	}
	horizontalChange += coords.x * 4.0;
}

//initialize baseboard settings
function initBaseBoard(){
	this.offset = 10;
}

/******* BUTTON CODE *******/
function leftAxisClick() {
	if (horizontalChange > 0.0) {
		horizontalChange = 0.0;
	}
	horizontalChange -= yDELTA;	
}

function rightAxisClick() {
	if (horizontalChange < 0.0) {
		horizontalChange = 0.0;
	}
	horizontalChange += yDELTA;
}

function animationLoop()
{
	if (gameIsOver) {
		alert("Shouldn't be called");
		return;
	}
	
	// Move the ball up/down	
	var newTop = getTopForTime();
	if (newTop > _yInitial) {
		newTop = _yInitial;
		_oldTime = _newTime;
	}
	$(ball).css("top", newTop);
	
	// Move the ball left/right
	var left = parseInt(ball.css("left"));
	var newLeft = left + horizontalChange;
	if (newLeft < 0) {
		// BOUNCE
		newLeft *= -1;
		horizontalChange *= -1;
	} else if (newLeft > 280) {
		// BOUNCE
		newLeft -= (newLeft - 280); // subtract the amount over 280 from 280
		horizontalChange *= -1;
	}
	$(ball).css("left", newLeft);
	
	//if the object has hit the baseboard check the answer
	if (newTop + ballHeight >= topBaseboard){
		
		//set the current x,y co-ordinates of the object
		setObjectXY(ball);
		
		checkAnswer(ballX,ballY,answerY,ball);
	} 	
}

//checks to see if the answer is correct or not 
function checkAnswer(X,Y,answer,ball){
	
	//if the answer is correct then light up baseboard 
	if ((Y > (answer - closeEnoughError)) && (Y < (answer + closeEnoughError))){
		
		//save the denominator
		var olddenom = currentProblem.denominator;
		
		
		if (Y > answer - error && Y < answer + error){
			displayAnswerBoardDeadOn(answerY);
			bullseyeAnswer(answer);
		}
		else{
			displayAnswerBoardClose(answerY);
			closeEnoughAnswer(answer);
		}
		
		computeBaseboardAnswer(currentProblem.decimalEquivalent, baseboardMin, baseboardMax);
		
		//clear the display answer board;
		clearAnswerBoard();
		//clear any existing hints
		clearArrowHint();
		//clear the number line hints
		clearDenominatorHint(olddenom);
		
		if (currentTry == 1) {
			changeGravity(getAdjustedGravity() + GRAVITY_CHANGE);
		}
		
		//reset current try to 1
		currentTry = 1;
		
		if (firstProblemInTheGame) {
			firstProblemInTheGame = false;
		}
	} else {
		//increment the number of tries 
		currentTry++;
		streakCounter = 0;
		adjustProblemProbabilities('wrong');
		
		// The first time the user has infinite tries
		if (firstProblemInTheGame && currentTry > 3) {
			currentTry = 3;
		}
		
		//the current try is 
		switch(currentTry){
		  case 2:
				//show hint 
				showArrowHint(X,Y,answer);
				playWrongAnswerSound(Y - answer);
                break;
		  case 3:
				//clear any previous hints
				clearArrowHint();
				//show hint 
				showDenominatorHint(X,Y,answer);
				playWrongAnswerSound(Y - answer);
                break;
		  case 4:	
				currentTry = 1;
				clearInterval(timerLoop);	
				clearArrowHint();
				clearDenominatorHint();
				displayAnswerBoardDeadOn(answerY);
				gameOver();	
				break;
		  default:
		}
	}
}


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
  var phoneWidth = 300;
	
	// compute the Y co-ordinate on the baseboard where the correct answer should be 
	//everything is now offset by 10 pixels
	answerY    = problemId * (phoneWidth / (bMax - bMin)) + bboffset;

}

function setLevelBackgroundImage(num){
	var newBg = "url('images/level" + num + "bg.png')";
   $("#level-screen").css("background-image",newBg);	
}


function setBaseboardLimits(){
	$("#baseMin").text(baseboardMin);
	$("#baseMax").text(baseboardMax);

	$("#baseMin").css("color",bbcolors[bbcolorid]).fadeIn('slow');
	$("#baseMax").css("color",bbcolors[bbcolorid]).fadeIn('slow');
	
	bbcolorid++; // change baseboard number colors next time when the numbers change 
}

//does types 0 - 1, 0 - 2, 0 - 100, 1 - 2 and so on .. 
function computeBoardLocation(problemId,bMin,bMax){
  var phoneWidth = 300;
	
	// compute the Y co-ordinate on the baseboard where the correct answer should be 
	// everything is now offset by 10 pixels; 
	var answer    = problemId * (phoneWidth / (bMax - bMin)) + bboffset;
	
	return answer;
}

function addBall()
{
	
	computeBaseboardAnswer(currentProblem.decimalEquivalent,baseboardMin,baseboardMax);
	
	displayCurrentProblem();
	
	// Now, we need to grab a reference to the ball we just added to the HTML
	ball = $("#ball");
	
	// Set the ball's position using a "helper" function
	initializePositionForBall(ball);
	
	ballHeight = parseInt(ball.css("height"));
}

function initializePositionForBall(ball)
{
	// We will position the ball above the top of the screen and at a random x position
	var ballHeight = parseInt(ball.css("height"));
	var ballWidth = parseInt(ball.css("width"));
	var screenWidth = parseInt($("#game-screen").css("width"));
	
	// Start the ball just above the top of the screen
	var newBallTop = 10;
	
	// Make sure the ball doesn't hang off the right side of the screen
	var maxLeft = screenWidth - ballWidth;
	var newBallLeft = Math.floor(Math.random() * maxLeft);
	
	// Finally, update the ball's position
	ball.css("top", newBallTop);
	if (usingSimulator) {
		ball.css("left", "150px");
	} else {
		ball.css("left", newBallLeft);
	}
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
function displayAnswerBoardClose(answerY){
	//set the newWidth to where the correct answer point is
	var newWidth = answerY - bboffset;
	
	$("#answerboard").css("background-color","#ff7200");
	$("#answerboard").css("width",newWidth);
	
	//make it visible 
	$("#answerboard").fadeIn('fast');
  
}


// if the correct answer was selected then light up the board 
function displayAnswerBoardDeadOn(answerY){
	//set the newWidth to where the correct answer point is
	var newWidth = answerY - bboffset;
	
	$("#answerboard").css("background-color","red");
	$("#answerboard").css("width",newWidth);
	
	//make it visible 
	$("#answerboard").fadeIn('fast');
  
}


// clear the answer board
function clearAnswerBoard(answerY){
	$("#answerboard").fadeOut('slow');
}


function gameOver(){
	$("#game-over").css("visibility", "visible");
	$("#game-over").fadeIn("slow");
	
	gameIsOver = true;
}

function goHome() {
	jQT.goTo('#home', 'cube'); 
}

function restartGame() {
	$("#game-over").fadeOut('fast');
	
	// Set that we're starting the game
	firstProblemInTheGame = true;
	
	restartLevel(1);
}

// This resets all values for a 'new' game.
function restartLevel(level) {
	
	// level is undefined when the UI calls this function
	if (level == undefined) {
		level = currentLevel;
		$("#game-over").fadeOut('fast');
	}
	
	setScore(0);
	setLevel(level);
	
	// This is the animation timer
	timerLoop = setInterval("animationLoop()", 50);
	
	gameIsOver = false;
	
	// TODO: Jacob: Do you want to reset probabilities here or in restartGame()?
}

/********* INIT_GRAVITY CODE **********/

/**
 * Improved gravity
 *                     1   2
 *           y = v  +  - gt
 *                ˚    2
 */
var _gravity;
var _ballBounceHeight = 330.0;
var _yInitial = 360.0; // TODO: tie this to location of baseboard
var _roundtripTime = 2500;
function changeGravity(newGravity) {
	_gravity = newGravity / 1000.0;
	var time = Math.sqrt( 2.0 *  _ballBounceHeight / _gravity ); 
	_initialVelocity = -1.0 * ( _ballBounceHeight / time + _gravity * time / 2.0 );
}

function getAdjustedGravity() {
	return _gravity * 1000.0;
}

/**
 * Get the trajectory from the given time.
 *                       1   2              1  
 *       y = y  + v t +  - gt  = y  + t(v + - gt )
 *            ˚    ˚     2        ˚         2
 * returns an int
 */
var _newTime;
var _oldTime;
var starttest = true;
function getTopForTime() {
	_newTime = new Date().getTime();
	
	var newTop;
	if (_newTime == _oldTime) {
		newTop = _xInitial;
	} else {
		var timeDelta = _newTime - _oldTime;
		newTop = _yInitial + timeDelta * ( _initialVelocity + _gravity * timeDelta / 2.0 );
	}
	
	return parseInt( newTop );
}

/********* LEVEL CODE **********/

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

// Initializes the game sounds
function initializeGameSounds()
{
	wrongAnswerSounds[0] = new Media("www/sounds/wrongleft.wav");
	wrongAnswerSounds[1] = new Media("www/sounds/wrongright.wav");

	closeEnoughSounds[0] = new Media("www/sounds/laser.wav");
	closeEnoughSounds[1] = new Media("www/sounds/cashregister.wav");
	closeEnoughSounds[2] = new Media("www/sounds/ching.wav");
	closeEnoughSounds[3] = new Media("www/sounds/arrow.wav");
	
	bullseyeSounds[0] = new Media("www/sounds/explosion2.wav");
	bullseyeSounds[1] = new Media("www/sounds/perfect.wav");
	bullseyeSounds[2] = new Media("www/sounds/precise.wav");
	bullseyeSounds[3] = new Media("www/sounds/yes.wav");
	bullseyeSounds[4] = new Media("www/sounds/onthedot.wav");	
	bullseyeSounds[5] = new Media("www/sounds/immaculate.wav");
	bullseyeSounds[6] = new Media("www/sounds/onthemoney.wav");
	bullseyeSounds[7] = new Media("www/sounds/supreme.wav");
	bullseyeSounds[8] = new Media("www/sounds/ideal.wav");	
	bullseyeSounds[9] = new Media("www/sounds/spotless.wav");
	bullseyeSounds[10] = new Media("www/sounds/sublime.wav");
	bullseyeSounds[11] = new Media("www/sounds/flawless.wav");
	
	
	nextLevelSounds[0] = new Media("www/sounds/cheer.wav");
}

//
//  GAMEPLAY FUNCTIONS
//  Functions related to levels, scoring, answers
//

// Calls the appropriate bullseye sound and graphic, adjusts the score, and pulls the next problem
function bullseyeAnswer(answer)
{
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
function displayCloseEnoughGraphic()
{
	
}

// Displays the graphic that highlights the baseboard and shows the decimal equivalent under the baseboard
function displayBullseyeGraphic()
{

}

// Plays the explosion sound, plus a random sound from the bullseyeSounds Array (but only up to the level of the current level)
function playBullseyeSound()
{
	var random = getRandomInteger(1, Math.min((bullseyeSounds.length - 1), (currentLevel - 1)));
	playSoundIfSoundIsOn(bullseyeSounds[0]);  // Exposion sound
	playSoundIfSoundIsOn(bullseyeSounds[random]);  // + random sound = delicious
}

/********* SOUND CODE **********/

// Plays a sound when the player hasn't hit the right spot, a differnet tone depending on if the guess is too high or too low
function playWrongAnswerSound(ballYMinusAnswer)
{
	if(ballYMinusAnswer > 0){
		playSoundIfSoundIsOn(wrongAnswerSounds[1]);
	} else {
		playSoundIfSoundIsOn(wrongAnswerSounds[0]);		
	}	
}

// Displays the graphic that highlights the baseboard and shows the decimal equivalent under the baseboard
function displayCloseEnoughGraphic()
{
	
}

// Plays a random sound from the closeEnoughSoundArray, but only up to the level of the current level
function playCloseEnoughSound()
{
	var random = getRandomInteger(0,Math.min((closeEnoughSounds.length - 1), (currentLevel - 1)));
	playSoundIfSoundIsOn(closeEnoughSounds[random]);
}

// Plays a random sound from the nextLevel Array
function playNextLevelSound()
{
	var random = getRandomInteger(0,(nextLevelSounds.length - 1));
	playSoundIfSoundIsOn(nextLevelSounds[random]);
}

function playSoundIfSoundIsOn(media) {
	if (isSoundOn) {
		media.play();
	}
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
	setScore(playerScore + increase);
}

function setScore(score) {
	playerScore = score;
	$("#score").text(playerScore);
}

function bonusGraphic()
{
	
}

// Controls the sequences of levels
function nextLevel() {
	changeGravity(INIT_GRAVITY);	// Reset the gravity after each level
	setLevel(currentLevel + 1);
	playNextLevelSound();
}

function setLevel(level)
{
	currentLevel = level;
	$("#level").text(currentLevel);

	streakCounter = 0;
	problemsFinishedThisLevel = 0;
	
	if(currentLevel == 5){
		baseboardMax = 2;  // After 4th level, this sets the baseboardMax to 2, leading to improper fractions
		setBaseboardLimits();
	}   	
	
	if(currentLevel == 9){ 
		changeLevelType('multiplication');
		baseboardMax = highestMultiplier * highestMultiplier;
		setBaseboardLimits();
	}
	
	// Changes background to new level background
	setLevelBackgroundImage(currentLevel);
}

// Changes currentLevelType and the background of the ball to reflect that level
function changeLevelType(levelType)
{
	currentLevelType = levelType;
	
	
	//changes the background of the ball
	switch(levelType){
		case 'multiplication':
			var newBg = "url('../images/plainball.png')";
			$(".ballClass").css("background-image", newBg);
			break;
		case 'sqroot':
			var newBg = "url('../images/sqrootball.png')";
			$(".ballClass").css("background-image", newBg);
			break;
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
				fractionProblems[denom][numer].probability = .3;  // sets lower probabilities for 0 in the numerator
			} else if (numer == denom){  
				fractionProblems[denom][numer].probability = .3;  // sets lower probabilities for all fractions = 1
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
			$("#multiplication-problem").text(fractionString);
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



