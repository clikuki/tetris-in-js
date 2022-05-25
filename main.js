import Grid from "./grid.js";
import InputHandler from "./inputs.js";
import Tetromino from "./tetromino.js";
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const grid = new Grid(10, 20, 30);
canvas.width = grid.width * grid.cellSize;
canvas.height = grid.height * grid.cellSize;
canvas.classList.add('game')
document.body.append(canvas);

const nextTetrominoCanvas = document.querySelector('.nextTetromino');
const ntctx = nextTetrominoCanvas.getContext('2d', { alpha: false });
let nextTetromino = Tetromino.getRandom(grid);
nextTetrominoCanvas.width = grid.cellSize * 5;
nextTetrominoCanvas.height = grid.cellSize * 5;
ntctx.fillStyle = 'black';
ntctx.fillRect(0, 0, nextTetrominoCanvas.width, nextTetrominoCanvas.height);
nextTetromino.draw(ntctx, nextTetrominoCanvas);

const tetrominoHolderCanvas = document.querySelector('.holder');
const thctx = tetrominoHolderCanvas.getContext('2d', { alpha: false });
let heldTetromino = null;
tetrominoHolderCanvas.width = grid.cellSize * 5;
tetrominoHolderCanvas.height = grid.cellSize * 5;
thctx.fillStyle = 'black';
thctx.fillRect(0, 0, tetrominoHolderCanvas.width, tetrominoHolderCanvas.height);

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
let canSwapHeldTetromino = true;

let gameOver = false;
let hasDrawnGameOver = false;
function loop(t)
{
	requestAnimationFrame(loop);
	if (gameOver)
	{
		if (!hasDrawnGameOver)
		{
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
			hasDrawnGameOver = true;
		}
		else if (inputHandler.restart)
		{
			grid.empty();
			currentTetromino = Tetromino.getRandom(grid);
			heldTetromino = null;
			thctx.fillStyle = 'black';
			thctx.fillRect(0, 0, tetrominoHolderCanvas.width, tetrominoHolderCanvas.height);
			nextTetromino = Tetromino.getRandom(grid,);
			ntctx.fillStyle = 'black';
			ntctx.fillRect(0, 0, nextTetrominoCanvas.width, nextTetrominoCanvas.height);
			nextTetromino.draw(ntctx, nextTetrominoCanvas);
			gameOver = false;
			hasDrawnGameOver = false;
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
			if (!holdKeyPressed && canSwapHeldTetromino)
			{
				holdKeyPressed = true;
				canSwapHeldTetromino = false;
				[heldTetromino, currentTetromino] = [currentTetromino, heldTetromino];
				if (!currentTetromino)
				{
					currentTetromino = nextTetromino;
					nextTetromino = Tetromino.getRandom(grid);
					ntctx.fillStyle = 'black';
					ntctx.fillRect(0, 0, nextTetrominoCanvas.width, nextTetrominoCanvas.height);
					nextTetromino.draw(ntctx, nextTetrominoCanvas);
				}
				heldTetromino.resetPosition();
				thctx.fillStyle = 'black';
				thctx.fillRect(0, 0, nextTetrominoCanvas.width, nextTetrominoCanvas.height);
				heldTetromino.draw(thctx, tetrominoHolderCanvas);
				thctx.fillStyle = '#333333aa';
				thctx.fillRect(0, 0, nextTetrominoCanvas.width, nextTetrominoCanvas.height);
			}
		}
		else holdKeyPressed = false;
	}

	const hardDropKeyPressed = inputHandler.hardDrop;
	if (hardDropKeyPressed && !hasHardDrop)
	{
		hasHardDrop = true;
		currentTetromino.fall(true);
		const newPoints = grid.addTetromino(currentTetromino);
		if (typeof newPoints !== 'number')
		{
			currentTetromino = null;
			gameOver = true;
		}
		else
		{
			score += newPoints;
			scoreDisplay.textContent = `score: ${score}`;
			currentTetromino = nextTetromino;
			nextTetromino = Tetromino.getRandom(grid);
			ntctx.fillStyle = 'black';
			ntctx.fillRect(0, 0, nextTetrominoCanvas.width, nextTetrominoCanvas.height);
			nextTetromino.draw(ntctx, nextTetrominoCanvas);
			if (heldTetromino)
			{
				canSwapHeldTetromino = true;
				thctx.fillStyle = 'black';
				thctx.fillRect(0, 0, nextTetrominoCanvas.width, nextTetrominoCanvas.height);
				heldTetromino.draw(thctx, tetrominoHolderCanvas);
			}
		}
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
					const newPoints = grid.addTetromino(currentTetromino);
					if (typeof newPoints !== 'number')
					{
						currentTetromino = null;
						gameOver = true;
					}
					else
					{
						softDropMode = false;
						score += newPoints;
						scoreDisplay.textContent = `score: ${score}`;
						currentTetromino = nextTetromino;
						nextTetromino = Tetromino.getRandom(grid);
						ntctx.fillStyle = 'black';
						ntctx.fillRect(0, 0, nextTetrominoCanvas.width, nextTetrominoCanvas.height);
						nextTetromino.draw(ntctx, nextTetrominoCanvas);
						if (heldTetromino)
						{
							canSwapHeldTetromino = true;
							thctx.fillStyle = 'black';
							thctx.fillRect(0, 0, nextTetrominoCanvas.width, nextTetrominoCanvas.height);
							heldTetromino.draw(thctx, tetrominoHolderCanvas);
						}
					}
				}
			}
			else lastTouchedBottom = null;
			if (currentTetromino) currentTetromino.fall();
		}
		if (!hardDropKeyPressed) hasHardDrop = false;
	}
}
requestAnimationFrame(loop)
