// Project settings
$.jQTouch({
	icon: 'images/icon.png',
	startupScreen: 'images/splash.png',
	addGlossToIcon: false,
	statusBar: 'default'
});


// Initialization method
$(function() {
	$(document).ready(pageIsLoaded);
});

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


function pageIsLoaded()
{
	$("#problem-testing-screen").bind("pageAnimationEnd", problemTestScreenHasAppeared);
	$("#game-screen").bind("pageAnimationEnd", gameScreenHasAppeared);
}

function gameScreenHasAppeared()
{

}

function problemTestScreenHasAppeared()
{
	if ($('#edit-checkbox-id').is(':checked'))
	{
		alert('1');
	}
	
	createFractionProblem2DArray(); 
	createMultiplicationProblem2DArray();
	initializeProbabilities();
	currentProblem = fractionProblems[2][1];

	displayFirstProblem();
}


// Shows the first problem "1", and then once the 1 is solved correctly, pulls the next problem
function displayFirstProblem()
{
	
}


//
//  GAMEPLAY FUNCTIONS
//  Functions related to levels, scoring, answers
//

// Calls the appropriate bulleye sound and graphic, adjusts the score, and pulls the next problem
function bullseyeAnswer()
{
	displayBullseyeGraphic();
	playBullseyeSound();
	adjustScore('bullseye');
	adjustProblemProbabilities('bullseye');
	alert('hi');
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
	$("#player-score").text(playerScore);
}
		
// Depending on current try, shows appropriate hint, and plays a sound for guessing wrong. 
function wrongAnswer()
{
	streakCounter = 0;
	adjustProblemProbabilities('wrong');

	if(currentTry == 1){
		playWrongAnswerSound();
	}
	else if (currentTry == 2){ 
		playWrongAnswerSound();
		displayFirstHint();
	}
	else if (currentTry == 3){ 
		playWrongAnswerSound();
		displaySecondHint();
	}
	else if(currentTry >= 4){ 
		gameOver(); 
	}
	currentTry++;
}

function playWrongAnswerSound()
{

}

function bonusGraphic()
{
	
}

function displayFirstHint()
{
	alert('first hint');
}

function displaySecondHint()
{
	alert('second hint');	
}

function gameOver()
{
	alert('game over!');	
}

// Controls the sequences of levels
function nextLevel()
{
	currentLevel++;
	alert('level' + currentLevel);
	$("#current-level").text(currentLevel);
	
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
				fractionProblems[denom][numer].probability = .2;  // sets lower probabilities for 0 in the numerator
			} else if (numer == denom){  
				fractionProblems[denom][numer].probability = .4;  // sets lower probabilities for all fractions = 1
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
			var fractionString = currentProblem.numerator + "/" + currentProblem.denominator;
			$("#current-problem").text(fractionString);
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



