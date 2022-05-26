import Grid from "./grid.js";
import InputHandler from "./inputs.js";
import Tetromino, { neutralBlock } from "./tetromino.js";
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const grid = new Grid(10, 20, 30);
canvas.width = grid.width * grid.cellSize;
canvas.height = grid.height * grid.cellSize;
canvas.classList.add('game')
document.body.append(canvas);

class TetrominoDisplay
{
	constructor(canvas, cellSize, startTetromino = null)
	{
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d', { alpha: false });
		this.tetromino = startTetromino;
		canvas.width = cellSize * 5;
		canvas.height = cellSize * 5;
		this.clearCanvas();
		if (startTetromino) startTetromino.resetPosition();
	}
	swap(tetromino)
	{
		if (tetromino) tetromino.resetPosition();
		const tmp = this.tetromino;
		this.tetromino = tetromino;
		return tmp;
	}
	clearCanvas()
	{
		this.ctx.fillStyle = 'black';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}
	darken()
	{
		this.ctx.fillStyle = '#333a';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}
	draw()
	{
		this.clearCanvas();
		if (this.tetromino) this.tetromino.draw(this.ctx, this.canvas);
	}
}

const nextTetromino = new TetrominoDisplay(document.querySelector('.nextTetromino'), grid.cellSize, Tetromino.getRandom(grid));
const heldTetromino = new TetrominoDisplay(document.querySelector('.holder'), grid.cellSize);
heldTetromino.canSwap = true;

const scoreDisplay = document.querySelector('.scoreDisplay');
let score = 0;

let currentTetromino = Tetromino.getRandom(grid);
const inputHandler = new InputHandler(canvas);
inputHandler.addActions({
	left: 'a',
	right: 'd',
	rotateLeft: 'q',
	rotateRight: 'e',
	softDrop: 's',
	hardDrop: ' ',
	hold: 'f',
	restart: 'r',
})
inputHandler.setConflictingActions(['left', 'right'], 'direction');
inputHandler.setConflictingActions(['rotateLeft', 'rotateRight'], 'rotationDirection');

function gameOver()
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

function startScreen()
{
	ctx.fillStyle = '#333333aa';
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
}

function lockTetromino()
{
	const newPoints = grid.addTetromino(currentTetromino);
	if (typeof newPoints !== 'number') gameOver();
	else
	{
		score += newPoints;
		scoreDisplay.textContent = `score: ${score}`;
		const randomTetromino = Tetromino.getRandom(grid);
		currentTetromino = nextTetromino.swap(randomTetromino);
		nextTetromino.draw();
		if (heldTetromino)
		{
			heldTetromino.canSwap = true;
			heldTetromino.draw();
		}
	}
}

const rotateLongDelay = 1000 / 5;
const rotateShortDelay = 1000 / 15;
let lastRotated = null;
let rotatesInARowCount = 0;

const moveLongDelay = 1000 / 5;
const moveShortDelay = 1000 / 50;
let lastMoved = null;
let moveInARowCount = 0;

const lockDelay = 1000 / 1;
let lastTouchedBottom = null;

const mainInterval = 1000 / 60;
let mainThen = 0;
const normalDropInterval = 1000 / 5;
const softDropInterval = 1000 / 10;
let softDropMode = false;
let dropThen = 0;
let hasHardDrop = false;
let holdKeyPressed = false;

let isGameOver = false;
let hasStarted = false;
function loop(t)
{
	requestAnimationFrame(loop);

	if (!hasStarted)
	{
		if (inputHandler.restart)
		{
			hasStarted = true;
			nextTetromino.draw();
		}
		return
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

	const mainElapsed = t - mainThen;
	if (mainElapsed > mainInterval || t === undefined)
	{
		if (t !== undefined) mainThen = t - (mainElapsed % mainInterval);
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
			}
		}
		else holdKeyPressed = false;
	}

	const hardDropKeyPressed = inputHandler.hardDrop;
	if (hardDropKeyPressed && !hasHardDrop)
	{
		hasHardDrop = true;
		currentTetromino.fall(true);
		lockTetromino();
	}
	else
	{
		const dropElapsed = t - dropThen;
		softDropMode = (inputHandler.softDrop && (softDropMode || !currentTetromino.isTouchingBottom));
		if (dropElapsed > (softDropMode ? softDropInterval : normalDropInterval) || t === undefined)
		{
			if (t !== undefined) dropThen = t - (dropElapsed % normalDropInterval);
			if (currentTetromino?.isTouchingBottom)
			{
				const manualLockHeld = inputHandler.softDrop;
				if (lastTouchedBottom === null) lastTouchedBottom = t;
				if ((manualLockHeld && !softDropMode) || t - lastTouchedBottom > lockDelay)
				{
					lastTouchedBottom = null;
					lockTetromino();
				}
			}
			else lastTouchedBottom = null;
			if (currentTetromino) currentTetromino.fall();
		}
		if (!hardDropKeyPressed) hasHardDrop = false;
	}
}
startScreen();
requestAnimationFrame(loop)
