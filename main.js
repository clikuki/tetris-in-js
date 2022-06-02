import Grid from "./grid.js";
import InputHandler from "./inputHandler.js";
import Tetromino, { neutralBlock } from "./tetromino.js";
import TetrominoDisplay from "./tetrominoDisplay.js";

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const grid = new Grid(10, 20, 30);
canvas.width = grid.width * grid.cellSize;
canvas.height = grid.height * grid.cellSize;
canvas.classList.add('game');
document.body.append(canvas);

// [
// 	[1, 1, 0, 0, 1, 1, 1, 1, 1, 1],
// 	[1, 0, 0, 0, 1, 1, 1, 1, 1, 1],
// 	[1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
// 	[1, 0, 0, 1, 1, 1, 1, 1, 1, 1],
// 	[1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
// ].reverse().forEach((row, j) =>
// {
// 	row.forEach((cell, i) =>
// 	{
// 		if (!cell) return;
// 		grid[grid.height - 1 - j][i] = neutralBlock;
// 	})
// })

const nextTetromino = new TetrominoDisplay(document.querySelector('.nextTetromino'), grid.cellSize, Tetromino.getRandom(grid));
const heldTetromino = new TetrominoDisplay(document.querySelector('.holder'), grid.cellSize);
heldTetromino.canSwap = true;

const scoreDisplay = document.querySelector('.scoreDisplay');
let score = 0;
const levelDisplay = document.querySelector('.levelDisplay');
const linesNeededToGoToNextLevel = 10;
let currentLevelLinesCleared = 0;
let level = 1;

let currentTetromino = Tetromino.getRandom(grid);
const inputHandler = new InputHandler(canvas);
inputHandler.addActions({
	left: 'a',
	right: 'd',
	rotateLeft: 'k',
	rotateRight: 'l',
	softDrop: 's',
	hardDrop: ' ',
	hold: 'f',
	restart: 'r',
	pause: 'p',
})
inputHandler.setConflictingActions(['left', 'right'], 'direction');
inputHandler.setConflictingActions(['rotateLeft', 'rotateRight'], 'rotationDirection');

function doGameOverStuff()
{
	currentTetromino = null;
	isGameOver = true;
	nextTetromino.clearCanvas();
	heldTetromino.clearCanvas();
	ctx.fillStyle = '#333333aa';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = 'black';
	ctx.strokeStyle = 'white';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = ctx.font.replace(/\d+px/, '48px');
	ctx.strokeText('GAME OVER', canvas.width / 2, canvas.height / 2);
	ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
	ctx.font = ctx.font.replace(/\d+px/, '30px');
	ctx.lineWidth = 1;
	ctx.strokeText('Press R to restart', canvas.width / 2, canvas.height / 2 + 48);
	ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 48);
}

function drawStartScreen()
{
	ctx.fillStyle = '#333a';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = 'black';
	ctx.strokeStyle = 'white';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = ctx.font.replace(/\d+px/, '40px');
	ctx.strokeText('Press', canvas.width / 2, canvas.height / 2 - 50);
	ctx.fillText('Press', canvas.width / 2, canvas.height / 2 - 50);
	ctx.font = ctx.font.replace(/\d+px/, '50px');
	ctx.strokeText('R', canvas.width / 2, canvas.height / 2);
	ctx.fillText('R', canvas.width / 2, canvas.height / 2);
	ctx.font = ctx.font.replace(/\d+px/, '40px');
	ctx.strokeText('to start', canvas.width / 2, canvas.height / 2 + 50);
	ctx.fillText('to start', canvas.width / 2, canvas.height / 2 + 50);
	ctx.fillStyle = '#cc0000';
	ctx.font = ctx.font.replace(/\d+px/, '60px');
	ctx.textBaseline = 'top';
	ctx.fillText('TETRIS', canvas.width / 2, 10);
	ctx.strokeText('TETRIS', canvas.width / 2, 10);
}

function drawPauseScreen()
{
	ctx.fillStyle = '#333a';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = 'black';
	ctx.strokeStyle = 'white';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = ctx.font.replace(/\d+px/, '48px');
	ctx.strokeText('Paused', canvas.width / 2, canvas.height / 2);
	ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
}

function changeToNextTetromino()
{
	const randomTetromino = Tetromino.getRandom(grid);
	currentTetromino = nextTetromino.swap(randomTetromino);
	currentTetromino.StartGhostPiece();
	nextTetromino.draw();
}

function lockTetromino(t)
{
	const result = grid.addTetromino(currentTetromino, level);
	switch (result.type)
	{
		case 2:
			doGameOverStuff();
			break;
		case 1:
			let levelHasChanged = false;
			currentLevelLinesCleared += result.linesCleared;
			while (currentLevelLinesCleared >= linesNeededToGoToNextLevel)
			{
				levelHasChanged = true;
				currentLevelLinesCleared -= linesNeededToGoToNextLevel;
				level++;
			}
			if (levelHasChanged)
			{
				updateDropValues();
				levelDisplay.textContent = `level: ${level}`;
			}
			score += result.score;
			scoreDisplay.textContent = `score: ${score}`;
			lineClearFunction = result.removeLines;
			lineClearThen = t;
		case 0:
		default:
			// Should I add ARE when drop speeds are getting fast, or keep it throughout?
			if (normalDropInterval > 1000 / 30) changeToNextTetromino();
			else
			{
				// using setTimeout instead of time + delay, not sure which is better
				currentTetromino = null;
				setTimeout(changeToNextTetromino, 500);
			}
			if (heldTetromino)
			{
				heldTetromino.canSwap = true;
				heldTetromino.draw();
			}
			break;
	}
}

// Changes normal and soft drop intervals and lock delay according to current level
function updateDropValues()
{

	const lockDelaySpeeds = [[5, 1], [10, 2], [15, 5], [20, 20], [Infinity, 40]];
	for (const [speedLevelCap, fractionOfSecond] of lockDelaySpeeds)
	{
		if (level < speedLevelCap)
		{
			lockDelay = 1000 / fractionOfSecond;
			break;
		}
	}

	const dropSpeeds = [[5, 1], [10, 5], [15, 10], [20, 20], [25, 40], [Infinity, 60]];
	for (const [speedLevelCap, fractionOfSecond] of dropSpeeds)
	{
		if (level < speedLevelCap)
		{
			normalDropInterval = 1000 / fractionOfSecond;
			break;
		}
	}
	softDropInterval = 1000 / 20 / level;
}

const rotateLongDelay = 1000 / 5;
const rotateShortDelay = 1000 / 15;
let lastRotated = null;
let rotatesInARowCount = 0;

const moveLongDelay = 1000 / 5;
const moveShortDelay = 1000 / 50;
let lastMoved = null;
let moveInARowCount = 0;

let lockDelay = 1000 / 1;
let normalDropInterval = 1000 / 1;
let softDropInterval = 1000 / 20;
updateDropValues();
let lastTouchedBottom = null;

const mainInterval = 1000 / 60;
let mainThen;
let isSoftDropping = false;
let dropThen;
let hasHardDrop = false;
let holdKeyPressed = false;

let lineClearFunction = null;
let lineClearInterval = 1000 / 50;
let lineClearThen;

let isGameOver = false;
let hasStarted = false;
let isPaused = false;
let pauseButtonIsDown = false;
function loop(t)
{
	requestAnimationFrame(loop);

	if (!hasStarted)
	{
		if (inputHandler.restart)
		{
			hasStarted = true;
			dropThen = t;
			mainThen = t;
			nextTetromino.draw();
			currentTetromino.StartGhostPiece();
		}
		return;
	};

	if (isGameOver)
	{
		if (inputHandler.restart)
		{
			grid.empty();
			currentTetromino = Tetromino.getRandom(grid);
			nextTetromino.swap(Tetromino.getRandom(grid));
			nextTetromino.draw();
			heldTetromino.swap(null);
			isGameOver = false;
		}
		return;
	}

	if (inputHandler.pause)
	{
		if (!pauseButtonIsDown)
		{
			pauseButtonIsDown = true;
			isPaused = !isPaused;
			if (isPaused) drawPauseScreen();
		}
	}
	else pauseButtonIsDown = false;
	if (isPaused) return;

	const mainElapsed = t - mainThen;
	if (mainElapsed > mainInterval)
	{
		mainThen = t - (mainElapsed % mainInterval);
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		grid.draw(ctx);

		if (!currentTetromino) return;

		currentTetromino.draw(ctx);
		const moveDirection = inputHandler.direction;
		if (moveDirection)
		{
			if (lastMoved === null) lastMoved = t;
			else if (!moveInARowCount || t - lastMoved > (moveInARowCount === 1 ? moveLongDelay : moveShortDelay))
			{
				if (moveDirection === 'left') currentTetromino.move(-1);
				else currentTetromino.move(1);
				lastMoved = t;
				moveInARowCount++;
			}
		}
		else
		{
			lastMoved = null;
			moveInARowCount = 0;
		}

		const rotationDirection = inputHandler.rotationDirection;
		if (rotationDirection)
		{
			if (lastRotated === null) lastRotated = t;
			else if (!rotatesInARowCount || t - lastRotated > (rotatesInARowCount === 1 ? rotateLongDelay : rotateShortDelay))
			{
				if (rotationDirection === 'rotateLeft') currentTetromino.rotate(-1);
				else currentTetromino.rotate(1);
				lastRotated = t;
				rotatesInARowCount++;
			}
		}
		else
		{
			lastRotated = null;
			rotatesInARowCount = 0;
		}

		if (inputHandler.hold)
		{
			if (!holdKeyPressed && heldTetromino.canSwap)
			{
				holdKeyPressed = true;
				heldTetromino.canSwap = false;
				currentTetromino = heldTetromino.swap(currentTetromino);
				heldTetromino.draw();
				heldTetromino.darken();
				if (!currentTetromino)
				{
					const randomTetromino = Tetromino.getRandom(grid);
					currentTetromino = nextTetromino.swap(randomTetromino);
					nextTetromino.draw();
				}
				currentTetromino.StartGhostPiece();
			}
		}
		else holdKeyPressed = false;
	}

	if (lineClearFunction)
	{
		const lineClearElapsed = t - lineClearThen;
		if (lineClearElapsed > lineClearInterval)
		{
			lineClearThen = t - (lineClearElapsed % lineClearInterval);
			if (lineClearFunction())
			{
				lineClearFunction = null;
				currentTetromino.StartGhostPiece();
			}
		}
		if (lineClearFunction) return;
	}

	const hardDropKeyPressed = inputHandler.hardDrop;
	if (hardDropKeyPressed && !hasHardDrop)
	{
		hasHardDrop = true;
		currentTetromino.fall(true);
		lockTetromino(t);
	}
	else if (currentTetromino)
	{
		if (!hardDropKeyPressed) hasHardDrop = false;
		if (currentTetromino.isTouchingBottom)
		{
			const manualLockHeld = inputHandler.softDrop;
			if (lastTouchedBottom === null) lastTouchedBottom = t;
			if ((manualLockHeld && !isSoftDropping) || t - lastTouchedBottom > lockDelay)
			{
				lastTouchedBottom = null;
				lockTetromino(t);
			}
		}
		else lastTouchedBottom = null;

		const dropElapsed = t - dropThen;
		isSoftDropping = (inputHandler.softDrop && (isSoftDropping || !currentTetromino.isTouchingBottom));
		if (dropElapsed > (isSoftDropping ? softDropInterval : normalDropInterval))
		{
			dropThen = t - (dropElapsed % (isSoftDropping ? softDropInterval : normalDropInterval));
			currentTetromino.fall();
		}
	}
}
drawStartScreen();
requestAnimationFrame(loop)
