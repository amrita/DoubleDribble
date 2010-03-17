// Project settings
var jQT = new $.jQTouch({
	icon: 'images/icon.png',
	startupScreen: 'images/splash.png',
	addGlossToIcon: false,
	statusBar: 'default'
});


//GLOBAL VARIABLES

// The number of continuous answers needed to skunk a level
var skunk = 2; 

// Initial gravity for the app. For dynamic gravity changes use changeGravity()
var INIT_GRAVITY = 0.15;
// How much gravity is increased on success
var GRAVITY_CHANGE = .001;

// Set this to true if you're using the iPhone Simulator
var usingSimulator = false; // TODO: replace w/ try/catch blocks

// The ball in the game
var ball;
var ballInitialTop = 260.0;
var ballInitialLeft = 280.0;

// ball values
var ballHeight;
var ballX;
var ballY;

var answerY;

//scaffold upto level 
var highScaffold = 2;
var lowScaffold  = 4;
var isScaffolded = false;

//top of the baseboard
var topBaseboard;

//baseboard offset
var bboffset = 10;

//baseboard number colors
var bbcolors  = ['black','blue','green','purple'];

var error			 = 4; // error allowed in pixels. 
var closeEnoughError = 15;

//accelerometer variables to make the object bounce
var horizontalChange = 0.0; // Maintains the state of the accelerometer

//game paused or not
var gamePaused = false;

// Used to turn sound on or off
var isSoundOn = true;

// How long the phone vibrates on an explosion/bullseye in milliseconds
var vibrateTime = 600;

// whether the game is over
var gameIsOver = true;

// whether or not the player is playing the first problem in the game
var numBeginnerProblems = 0;
var numBeginnerProblemsLeft = numBeginnerProblems;

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

var presidentialProblems = new Array(); // Creating an Array to hold presidentail problems
var presidentialNames = ["Obama"];
var presidentialYearsElected = [2008];

var wrongAnswerSounds = new Array();
var closeEnoughSounds = new Array();
var bullseyeSounds = new Array();
var nextLevelSounds = new Array();
var secretLevelSound;

// Dunking
var dunkGForce = 1.5;  // To eliminate dunking, set this value to 4

var accelerometerFrequency = 60;
var isDunking = false;
var dunkWait = false;
var preDunkGravity;
var dunkGravityChange = 50.0; // Gravity will be multiplied by this amount on a dunk

// Secret Presidential Easter Egg
var isSecretOn = false;
var secretWaiting = false;
var secretThreshold = 0.9;
var secretVal = 0.0;

// Initialization method
$(function() {
  
  // A small patch to fix the background height of jQTouch pages under PhoneGap
  if (typeof(PhoneGap) != 'undefined') {
    $("body > *").css("minHeight", "480px !important");
  }	
  
	document.addEventListener("touchmove",function(e){e.preventDefault();},false); //prevent scrolling 
	
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
	setBaseboardLimits(0);
	
	// Initialize the first problem
	currentProblem = new ProblemObject(1, 2);
	
	// Initialize Game sounds
	initializeGameSounds();
	
	// Run through initial game messages
	initialGameMessages();
	
	// Add ball to screen after game messages are done
	setTimeout('addBall();', 4000);
	
	firstTimeGame = true;
}

/******* PREFERENCES CODE *******/
function loadSettingsForGame() {
	
	// Gravity
	if (localStorage.gravity != null) {
		INIT_GRAVITY = parseFloat(localStorage.gravity);
	}
	
	// Gravity Change
	if (localStorage.skunk != null) {
		skunk = localStorage.skunk;
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
	
	// Skunk value
	if (localStorage.skunk == null) {
		localStorage.skunk = skunk;
	}
	$("#skunk").val([localStorage.skunk]);
	
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
	
	// Skunk
	var skunkVal = $("#skunk").val();
	skunk = parseInt(skunkVal);
    localStorage.skunk = skunk;
	
	// Gravity
	INIT_GRAVITY = parseFloat($("#gravity").val());
    localStorage.gravity = INIT_GRAVITY;
	
	// Gravity change
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
var accelerometerStarted = false;
function startWatchingForShaking() {
	try {
		var win = function(coords){
			accelerometerFired(coords); 		
		};
		var fail = function(){};
		var options = {};
		options.frequency = accelerometerFrequency;
		
		// This is so we don't start multiple accelerometer callbacks
		if (!accelerometerStarted) {
			navigator.accelerometer.watchAcceleration(win, fail, options);
			accelerometerStarted = true;
		}
	} catch (exception) {
		// if there's an error, we're on the simulator
		usingSimulator = true;
	}
}

function accelerometerFired(coords) {
	if ((horizontalChange > 0.0 && coords.x < 0.0) || (horizontalChange < 0.0 && coords.x > 0.0)) {
		horizontalChange = coords.x;
	} else if (dunkGForce < Math.abs(coords.z) && !isDunking && !dunkWait) {
		_gravity *= dunkGravityChange;
		isDunking = true;
		dunkWait = true;
	} else if (secretThreshold < coords.z) {
		isSecretOn = true;
		secretVal = coords.z;
	} else {
		isSecretOn = false;
	}
	
	horizontalChange += coords.x * 4.0;
}



//initialize baseboard settings
function initBaseBoard(){
	this.offset = 10;
}

/******* ANIMATION & MAIN GAME LOOP CODE *******/

function animationLoop()
{
	if (gameIsOver) {
		alert("Please restart the game.\nYou have found 1/4 of the bugs in our game :P");
		return;
	}
	
	// Move the ball up/down	
	var newTop = getTopForTime();
	if (newTop >= _yInitial) {
		newTop = _yInitial;
		_oldTime = _newTime;
		
		if (isDunking) {
			isDunking = false;
			changeGravity(INIT_GRAVITY); // NOTE: if you are changing gravity for correct answers,
										 // this will reset the delta
			setTimeout("dunkWait = false;", 500);
		}
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
			adjustAndGoToNextProblem('bullseye');
		}
		else {
			displayAnswerBoardClose(answerY);
			closeEnoughAnswer(answer);
			adjustAndGoToNextProblem('closeEnough');
		}
		clearScreenBottom(olddenom);
		
		computeBaseboardAnswer(currentProblem.decimalEquivalent, baseboardMin, baseboardMax);
		
		//reset current try to 0
		currentTry = 0;
		
		if (currentTry == 1) {
			changeGravity(getAdjustedGravity() + GRAVITY_CHANGE);
		}
		
		numBeginnerProblemsLeft--;
	} else {
		//increment the number of tries 
		currentTry++;
		
		if (currentTry > 0){
		  //add scaffolding if needed
			addScaffolding();	
		}
		
		streakCounter = 0;
		adjustProblemProbabilities('wrong');
		
		// The first numBeginnerProblems times the user has infinite tries
		if (numBeginnerProblemsLeft > 0 && currentTry > 4) {
			currentTry = 4;
		}
		
		playWrongAnswerSound(Y - answer);
		
		//the current try is 
		switch(currentTry){
		  case 2:
				//show hint
				if (currentLevelType == 'presidential') {
					showPresidentName();
				} else {
					showArrowHint(X,Y,answer);
				}
                break;
		  case 3:
				//clear any previous hints
				clearArrowHint();
				//show hint 
				if (currentLevelType == 'multiplication') {
					showArrowHint(X,Y,answer);
				} else if (currentLevelType == 'presidential') {
					showPresidentName();
					showArrowHint(X,Y,answer);
				} else {
					showDenominatorHint(answer);
				}
                break;
		  case 4:
				clearArrowHint();
				showUpArrowHint(answerY);
				if (numBeginnerProblemsLeft > 0 || currentLevel == 1) {
					break;
				}
		  case 5:
				currentTry = 1;	
				clearArrowHint();
				displayAnswerBoardGameOver(answerY);
				gameOver();	
				break;
		  default:
		}
	}
}

// TODO: Move this to an appropriate location before checking in
function showPresidentName() {
	// TODO: implement
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
	//alert("computeBaseboardAnswer: "+problemId);
	var phoneWidth = 320 - 2*bboffset;
	
	// compute the Y co-ordinate on the baseboard where the correct answer should be 
	//everything is now offset by 10 pixels
	answerY    = problemId * (phoneWidth / (bMax - bMin)) + bboffset;

}

function setLevelBackgroundImage(num){
	// num = Math.min(num, 17); // prevents going past the levels we have, commented out b/c no one's going that high currently
	var newBg = "url('images/level" + num + "bg.png')";
   $("#level-screen").css("background-image",newBg);	
}

// pass in different colors when the numbers change
function setBaseboardLimits(bbcolorid){
	$("#baseMin").text(baseboardMin);
	$("#baseMax").text(baseboardMax);
	$("#baseMin").css("color",bbcolors[bbcolorid]).fadeIn('slow');
	$("#baseMax").css("color",bbcolors[bbcolorid]).fadeIn('slow');
}

//does types 0 - 1, 0 - 2, 0 - 100, 1 - 2 and so on .. 
function computeBoardLocation(problemId,bMin,bMax){
  var phoneWidth = 300;
	
	// compute the Y co-ordinate on the baseboard where the correct answer should be 
	// everything is now offset by 10 pixels; 
	var answer    = problemId * (phoneWidth / (bMax - bMin)) + bboffset;
	
	return answer;
}

function addScaffolding(){
	//if we are in scaffolding display denonminator hints
	if (currentLevel < lowScaffold){
		showDenominatorHint(answerY);
		isScaffolded = true;
	}	
}

function addBall()
{
	
	// Make the ball's background visible
	var newBg = "url('images/fractionball.png')";
	$(".ballClass").css("background-image", newBg);

	// Now, we need to grab a reference to the ball we just added to the HTML
	ball = $("#ball");
	
	// Set the ball's position using a "helper" function
	initializePositionForBall(ball);
	
	ballHeight = parseInt(ball.css("height"));
}

function initializePositionForBall(ball)
{
	// Finally, update the ball's position
	ball.css("top", ballInitialTop);
	if (usingSimulator) {
		ball.css("left", "145px");
	} else {
		ball.css("left", ballInitialLeft);
	}
	
	//check for accelerometer movement
	startWatchingForShaking();
	
	// Set up gravity and initialize oldTime for ball movement
	changeGravity(INIT_GRAVITY);
	setBallAtHeight(ballInitialTop, true);
	tempGravityChange(.007);
	
	// Reset game state
	restartGame();
}

function initialGameMessages()
{
	// set first game message
	changeGameMessage("messageboard");
	
	// after three seconds, change to second game message
	setTimeout('changeGameMessage("messageboardwball");', 2000);

	// then make game-message invisible
	setTimeout('changeGameMessage("");', 4000)	
}


function changeGameMessage(imageName)
{
	var newMessage = "url('images/" + imageName + ".png')";
	$("#game-messageboard").css("background-image",newMessage);
}


/********* SHOW HINTS/SCAFFOLDING CODE **********/

function showPresidentName() {
	$("#baseboard-message").text(currentProblem.problemLabel);
}

// show either the left or the right hint arrow based on the position
// of the ball as opposed to the correct answer 
function showArrowHint(X,Y,answer){
	
	//if the answer is less than the current location, show the left arrow
  if (Y > answer){
		var left    = parseInt($("#blackarrowleft").css("margin-left"));
		var width   = parseInt($("#blackarrowleft").css("width"));
		var newLeft = left + (Y - left) - width;
		
		//does the arrow go past the answer ?
		if ((newLeft - width) < answer){
			newLeft = newLeft + width;
		}
		
	  //set the new left value for the arrow 
		$("#blackarrowleft").css("margin-left",newLeft);			
		$("#blackarrowleft").css("visibility","visible");	
		$("#blackarrowright").css("visibility","hidden");
	}
	//if the answer is greater than the current location, show the right arrow
	else{
		var left    = parseInt($("#blackarrowright").css("margin-left"));
		var width   = parseInt($("#blackarrowright").css("width"));
		var newLeft = left + (Y - left);
		
		//does the arrow go past the answer ?
		if ((newLeft + width) > answer){
			newLeft = newLeft - width;
		}
		
		//set the new left value for the arrow 
		$("#blackarrowright").css("margin-left",newLeft);			
		$("#blackarrowright").css("visibility","visible");	
		$("#blackarrowleft").css("visibility","hidden");	
	}
	
}

/********* CLEAR HINTS/SCAFFOLDING CODE **********/

function clearScreenBottom(olddenom) {
	//clear the display answer board;
	clearAnswerBoard();
	//clear any existing hints
	clearArrowHint();
	clearUpArrowHint();
	
	clearDenominatorHint(olddenom);
}

function clearArrowHint(){
    $("#blackarrowright").css("visibility","hidden");	
	$("#blackarrowleft").css("visibility","hidden");	
	
}

// Up arrow, behaves differently from left/right arrows
function showUpArrowHint(newLeft) {
	$("#uparrow").css("margin-left",newLeft - 10); // newLeft minus 1/2 the width of the uparrow image			
	$("#uparrow").css("visibility","visible");	
}

function clearUpArrowHint() {
	$("#uparrow").css("visibility","hidden");	
}


// show either the left or the right hint arrow based on the position
// of the ball as opposed to the correct answer 
function showDenominatorHint(answer){

	var decimalvalue;
	var answer;
	var showHint = 0;
	
	var denom = currentProblem.denominator;
	var numer = currentProblem.numerator;
	
	//if already present then return
	if (isScaffolded){
		return;
	}
	
	if (denom == 0) {
		//alert("denom 0 2");
		return;
	}
	
	//compute points on the number line
	i = 1;
	while ( (i / denom) < baseboardMax){
		//compute the decimal value of the point
		decimalvalue = i / denom; 
		
		//compute the pixel where it should be on the baseboard 
		answer       = computeBoardLocation(decimalvalue,baseboardMin, baseboardMax);
	
		//add the hint line to the pixel on the baseboard 
		$("#full-screen-area").append('<div id="hint-' + i + '" class="dHint"></div>');
		
		// Now, we need to grab a reference to the hint we just added to the HTML
		var pHint = $("#hint-" + i);
		
		//move the hint to the correct place on the number line
		pHint.css("margin-left",answer);
		
		//if the scaffold is high then add the hint every single time.
		//if the scaffold is low then only add random hints
		if(currentLevel < lowScaffold){
			showHint = getRandomInteger(0,1);
			if (answer == answerY) showHint = 0; //do not display a hint for the answer if scaffold is low
		}
		
		if (currentLevel < highScaffold || showHint){
		  //add the hint value below the baseboard 
		  $("#full-screen-area").append('<div id="hintnumer-' + i + '" class="numerHint">'+ i +'</div>');
			$("#full-screen-area").append('<div id="hintline-'  + i + '" class="lineHint"> &#151; </div>');
		  $("#full-screen-area").append('<div id="hintdenom-' + i + '" class="denomHint">'+ denom +'</div>');
		
	
		  //Now, we need to grab a reference to the number hint we just added to the HTML
		  var nHint = $("#hintnumer-" + i);
		  var lHint = $("#hintline-" + i);
		  var dHint = $("#hintdenom-" + i);

		
		  //move the hint to the correct place on the number line
			//need to clean this up 
			if (i > 10){
		    nHint.css("margin-left",answer - 10);
			}
			else{
				nHint.css("margin-left",answer - 8);
			}
		  lHint.css("margin-left",answer - 8);
			if (denom > 10){
		    dHint.css("margin-left",answer - 10);
			}
			else{
				dHint.css("margin-left",answer - 8);
			}
		}
		
		//if the value of decimal value of this hint is 1, change its color to orange
		if (decimalvalue == 1){
		  pHint.css("background-color","#ff7200");	
		}
		
		//inc i
		i++;
		
	} //while ends 
}

/**
 * TODO: if we put all hints into the same class, would it erase all of them with a single "remove()"?
 */
function clearDenominatorHint(denom){
	if (denom == 0) {
		//alert("denom 0 1");
		return;
	}
	
	var i = 1;
	while ( (i / denom) < baseboardMax){
		$('#hint-' + i).remove();
		$('#hintnumer-' + i).remove();
		$('#hintline-' + i).remove();
		$('#hintdenom-' + i).remove();
		i++;
	}
	isScaffolded = false;
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
	
	//special case for when the answer is 0. Set pixel width to 2 to display
  //the answer. 
	if (newWidth == 0) newWidth = 2;
	
	$("#answerboard").css("background-color","red");
	$("#answerboard").css("width",newWidth);
	
	//make it visible 
	$("#answerboard").fadeIn('fast');
  
}

// if the correct answer was selected then light up the board 
function displayAnswerBoardGameOver(answerY){
	
	//set the newWidth to where the correct answer point is
	var newWidth = answerY - bboffset;
	
	//special case for when the answer is 0. Set pixel width to 2 to display
  //the answer. 
	if (newWidth == 0) newWidth = 2;
	
	$("#answerboard").css("background-color","#878185");
	$("#answerboard").css("width",newWidth);
	
	//make it visible 
	$("#answerboard").fadeIn('fast');
  
}

// clear the answer board
function clearAnswerBoard(answerY){
	$("#answerboard").fadeOut('slow');
}

function gameOver(){
	clearInterval(timerLoop);
	
	$("#game-over").css("visibility", "visible");
	$("#game-over").fadeIn("slow");
	
	gameIsOver = true;
}

function goHome() {
	clearScreenBottom(currentProblem.denominator);
	$("#game-over").css("visibility", "hidden");
	setTimeout("jQT.goTo('#home', 'cube');", 100);
}

var firstTimeGame = true;
function restartGame() {
	
	$("#game-over").css("visibility", "hidden");
	
	// Initialize problem arrays
	createFractionProblem2DArray();
	createMultiplicationProblem2DArray();
	createPresidentialProblemArray();
	
	if (firstTimeGame) {
		firstTimeGame = false;
	} else {
		// Clean up previous game
		clearScreenBottom(currentProblem.denominator);
		
		currentLevel = 1;
		baseboardMax = 1;
		baseboardMin = 0;
		currentProblem = new ProblemObject(1, 2);
		getNewProblem();
	}
	
	// Fix up the baseboard
	computeBaseboardAnswer(currentProblem.decimalEquivalent,baseboardMin,baseboardMax);
	displayCurrentProblem();
	addScaffolding();
	
	restartLevel(1);
}

// This resets all values for a 'new' game.
function restartLevel(level) {
	
	clearUpArrowHint(); // Just in case it's still on TODO: DOn't think needed
	
	// level is undefined when the UI calls this function
	if (level == undefined) {
		level = currentLevel;
		$("#game-over").css("visibility", "hidden");
	}
	
	setScore(0);
	setLevel(level);
	
	// Scaffolding happens for all levels less than six
	if (level <= 5) {
		numBeginnerProblemsLeft = numBeginnerProblems;
	}
	
	// This is the animation timer
	timerLoop = setInterval("animationLoop()", 50);
	
	gameIsOver = false;
	
}

/********* INIT_GRAVITY CODE **********/

/**
 * Improved gravity
 *                     1   2
 *           y = v t + - gt
 *                ˚    2
 */
var _gravity;
var _ballBounceHeight = 330.0;
var _yInitial = 360.0; // TODO: tie this to location of baseboard
function changeGravity(newGravity) {
	_gravity = newGravity / 1000.0;
	var time = getGravityTime();
	_initialVelocity = -1.0 * ( _ballBounceHeight / time + _gravity * time / 2.0 );
}

// This is the time to go from the bottom to the top of the screen
function getGravityTime() {
	return Math.sqrt( 2.0 *  _ballBounceHeight / _gravity );
}

function getAdjustedGravity() {
	return _gravity * 1000.0;
}

/**
 * Change gravity at a point      _____
 *                               / g   
 *                    t  = t    /   1
 *                     2    1  /  ---
 *                            /    g
 *                           √      2
 */
function changeGravityAtPoint(newGravity) {
	var currTime = new Date().getTime();
	var newTime = (currTime - _oldTime) * Math.sqrt(getAdjustedGravity() / newGravity);
	
	changeGravity(newGravity);
	_oldTime = currTime - newTime;
	
}

function tempGravityChange(tempGravity) {
	var oldGravity = getAdjustedGravity();
	
	changeGravityAtPoint(tempGravity);
	setTimeout("resetGravity("+oldGravity+")", 1000);
}

function resetGravity(gravity) {
	changeGravityAtPoint(parseFloat(gravity));
}

/**
 * If falling is true, then this calculates the position of the ball at the given height with the ball dropping.
 * This is opposed to false where the ball is calculated on the way up.
 *                     ________
 *                    / 2
 *          t = v +  √ v  - 2gy
 *               ˚   ----------
 *                        g
 */
function setBallAtHeight(height, falling) {
	var distance;
	var time;
	
	if (falling) {
		distance = height - (_yInitial - _ballBounceHeight);
		time = Math.sqrt(2 * distance / _gravity); // calculate
		time += getGravityTime(); // add the time to get to the top of the screen
		time *= -1.0; // make this value negative for the _oldTime calculation below
		
	} else {
		distance = _yInitial - height;
		time = (_initialVelocity + Math.sqrt(_initialVelocity * _initialVelocity - 2*_gravity*distance)) / _gravity;
	}
	
	_oldTime = new Date().getTime() + time;
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
	if (_newTime <= _oldTime) {
		newTop = _yInitial;
	} else {
		var timeDelta = _newTime - _oldTime;
		newTop = _yInitial + timeDelta * ( _initialVelocity + _gravity * timeDelta / 2.0 );
	}
	
	return parseInt( newTop );
}

/********* LEVEL CODE **********/

// Creating the ProblemObject 
function ProblemObject(numer, denom)
{
	this.problemType = 'fraction'; // default is fraction, other types could be fractionAddition, percent, integer, etc
	this.numerator = numer;
	this.denominator = denom;
	
	// this is the "answer" for this problem, it's decimalEquivalent;
	this.decimalEquivalent = (denom == 0) ? 0 : (numer / denom);
	this.probability = .5;  // this is the probability (between 0-1) that this problem will be put on the screen once it is selected
	this.problemLabel = ""; // a placeholder for Presidential names and other labels. 
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
	
	secretLevelSound = new Media("www/sounds/hailtothechief.wav");
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
	if(dunkWait){
		changeGameMessage("dddunk");
		// Then erases it after 1 seconds
		setTimeout('changeGameMessage("");', 1000)
	}
}

// Calls the appropriate closeEnough sound and graphic, adjusts the score, and pulls the next problem
function closeEnoughAnswer()
{
	playCloseEnoughSound();
	adjustScore('closeEnough');
	if(dunkWait){
		changeGameMessage("dddunk");
		// Then erases it after 1 seconds
		setTimeout('changeGameMessage("");', 1000)
	}
}

function adjustAndGoToNextProblem(accuracy) {
	if (currentLevelType == 'fraction') {
		adjustProblemProbabilities(accuracy);
	}
	nextProblem();
}

// Plays the explosion sound, plus a random sound from the bullseyeSounds Array (but only up to the level of the current level)
function playBullseyeSound()
{
	var random = getRandomInteger(1, Math.min((bullseyeSounds.length - 1), (currentLevel - 1)));
	playSoundIfSoundIsOn(bullseyeSounds[0]);  // Exposion sound
	playSoundIfSoundIsOn(bullseyeSounds[random]);  // + random sound = delicious
	
	navigator.notification.vibrate(vibrateTime);
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
	var dunkBonus = 0;	
	if(currentTry > 2){
		return;
	}
	else if(currentTry == 1){
		switch(accuracy){
			case 'bullseye':
				if(dunkWait){dunkBonus = 10;}
				increaseScore(20 + dunkBonus);
				break;
			case 'closeEnough':
				if(dunkWait){dunkBonus = 5;}
				increaseScore(15 + dunkBonus);
				break;
		}
	}
	else if(currentTry == 2){
		switch(accuracy){
			case 'bullseye':
				if(dunkWait){dunkBonus = 10;}
				increaseScore(15 + dunkBonus);
				break;
			case 'closeEnough':
				if(dunkWait){dunkBonus = 5;}
				increaseScore(10  + dunkBonus);
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
	var newScoreText = playerScore + " pts";
	$("#score").text(newScoreText);
}

function bonusGraphic()
{
	
}

// Controls the sequences of levels
function nextLevel() {	// TODO: nextLevel()
	var newLevel = currentLevel + 1;
	
	if (secretWaiting) {
		newLevel = (currentLevelType == 'multiplication') ? 20 : 9;
		secretWaiting = false;
	}
	
	// if the level is greater than 20 or between 9 and 20, then do not change levels
	if (newLevel > 20 || (20 > newLevel && newLevel > 9)) {
		return;
	}
	
	changeGravity(INIT_GRAVITY);	// Reset the gravity after each level
	setLevel(newLevel);
	playNextLevelSound();
}

function setLevel(level)
{
	currentLevel = level;
	$("#level").text(currentLevel);

	streakCounter = 0;
	problemsFinishedThisLevel = 0;
	
	if (currentLevel == 1) 
	{
		baseboardMax = 1;
		setBaseboardLimits(0);
	}
	else if (currentLevel == 5)
	{
		baseboardMax = 2;  // After 4th level, this sets the baseboardMax to 2, leading to improper fractions
		setBaseboardLimits(1);
	}
	else if (currentLevel == 9)
	{	// TODO: put everything related to multiplication here
		$("#numerator").text("");
		$("#denominator").text("");
		$("#baseMax").css("margin-left", "265px");
		changeLevelType('multiplication');
		baseboardMax = highestMultiplier * highestMultiplier;
		setBaseboardLimits(2);
	}
	else if (currentLevel == 20)  // presidential
	{
		// moves message div up to above the White House
		$("#game-messageboard").css("top","80px");
		
		$("#numerator").text("");
		$("#denominator").text("");
		$("#baseMax").css("margin-left", "275px");
		$("#baseMax").css("font-size", "15pt");  // Makes the Presidential years smaller
		$("#baseMin").css("font-size", "15pt");
		changeLevelType('presidential');
		baseboardMax = 2010;
		baseboardMin = 1900;
		setBaseboardLimits(3);
	}

	// Changes background to new level background
	setLevelBackgroundImage(currentLevel);
	
	var gameMessageTime = 3000; 
	if(currentLevel == 20){gameMessageTime = 7000;}  // more time for Prez level
	if(currentLevel == 5 || currentLevel == 9){gameMessageTime = 5000;}  // more time for levels with new paradigms

	// Changes Game Message, except for first level
	if(currentLevel != 1){
		var messageImageName = "messagelevel" + currentLevel;
		changeGameMessage(messageImageName);
		// Then erases it after 3 seconds, 7 if in President's mode
		setTimeout('changeGameMessage("");', gameMessageTime)	
	} 
}

// Changes currentLevelType and the background of the ball to reflect that level
function changeLevelType(levelType)
{
	currentLevelType = levelType;
	
	
	//changes the background of the ball
	switch(levelType){
		case 'multiplication':
			var newBg = "url('images/plainball.png')";
			$(".ballClass").css("background-image", newBg);
			break;
		case 'presidential':
			var newBg = "url('images/Obama.png')";
			$(".ballClass").css("background-image", newBg);
			$("#multiplication-problem").fadeOut('fast'); // clears the multiplication prob off Obama's face
			break;
		case 'sqroot':
			var newBg = "url('images/sqrootball.png')";
			$(".ballClass").css("background-image", newBg);
			break;
		
	}
}

// currentProblem.problemLabel.replace(' ', '_') + ".png"


//
//  PROBLEM GENERATION FUNCTIONS
//  Functions related to working with the fractionProblems 2D array
//

// Creates the double array that holds all the fraction problems. 
// fractionProblems uses the syntax [denominator][numerator]
// For example, fractionProblems[2][1] is where the ProblemObject 1/2 lives.  
function createFractionProblem2DArray()
{
	for(var denom = 1; denom <= highestDenominator[highestLevel]; denom++){   
		fractionProblems[denom] = new Array();
		
		for(var numer = 0; numer <= (denom * baseboardMaxPotential); numer++) // this stops fraction being created that are larger than the baseboard
		{ 			
			fractionProblems[denom][numer] = new ProblemObject(numer, denom); 
			
			if(numer == 0){   
				fractionProblems[denom][numer].probability = .3;  // sets lower probabilities for 0 in the numerator
			} else if (numer == denom){  
				fractionProblems[denom][numer].probability = .3;  // sets lower probabilities for all fractions = 1
			} else if (numer == 1){
				fractionProblems[denom][numer].probability = .6;  // sets high probability for when numer = 1
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
			
			// Note that this is a hacky misnomer. We are storing the first number of the multiplication problem as the "numerator". Sorry, God. 
			multiplicationProblems[firstNum][secondNum] = new ProblemObject(firstNum, secondNum);
			multiplicationProblems[firstNum][secondNum].problemType = 'multiplication'; 
			multiplicationProblems[firstNum][secondNum].decimalEquivalent = firstNum * secondNum;
			multiplicationProblems[firstNum][secondNum].probability = .5;
		}
	}
}

// Adjusts the problem and related problem probabilties based on accuracy 
// and creates and displays a new problem  
function nextProblem()
{
	streakCounter++;
	currentTry = 1;
	
	if(streakCounter >= skunk)
	{
		increaseScore(50);
		bonusGraphic();
		nextLevel();
	} 
	else if(++problemsFinishedThisLevel >= numProblemsPerLevel || secretWaiting)
	{
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
			var oldNumer = currentProblem.numerator;
			var oldDenom = currentProblem.denominator;
			do{	
				var randomFloat = Math.random();
				var denom = getRandomInteger(2,highestDenominator[currentLevel]);
				var numer = getRandomInteger(0,(denom * baseboardMax));
			} while(randomFloat > fractionProblems[denom][numer].probability || ((denom == oldDenom) && (numer == oldNumer)));   
			// exits the do loop once it has found a problem probability higher than the randomFloat, and ensures new problem is not identical
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
		case 'presidential':
			break;
	} 
}

// Changes the ball to reflect the current problem, taking into consideration the problem type
function displayCurrentProblem()
{
	switch(currentProblem.problemType){
		case 'fraction':
			$("#numerator").text(currentProblem.numerator);
			$("#denominator").text(currentProblem.denominator);
			break;
		case 'multiplication':
			var fractionString = currentProblem.numerator + "x" + currentProblem.denominator;
			$("#multiplication-problem").text(fractionString);
			break;
		case 'integer':
			break;
		case 'presidential':
			break;
	}
}


//
//  Presidential Mode
// 
//


function createPresidentialProblemArray()
{
	 for(i = 0; i < presidentialNames.length; i++){
		 
		// makes the decimal equivalent to the year elected b/c decimal equiv is calculated as firstnum/secondnum
		presidentialProblems[i] = new ProblemObject(presidentialYearsElected[i],1); 
		presidentialProblems[i].problemLabel = presidentialNames[i];
		presidentialProblems[i].problemType = 'presidential';   
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


/********* SECRET CODE **********/

/**
 * Current behavior: During the game.  Hold the iPhone face-down towards the floor (easiest when you hold it
 * above your head), then click on the Score.
 * The alert below should appear.
 */
function secretClick() {

	if (gameIsOver) {
		return;
	} else if (isSecretOn) {
		playSoundIfSoundIsOn(secretLevelSound);
		secretWaiting = true;
	}
}

/* EMAIL FUNCTION */
function sendMail()
{ 
	document.location.href = "mailto:doubledribblegame@gmail.com?subject=Contact Us &body="; 
}



