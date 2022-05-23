import Grid from "./grid.js";
import InputHandler from "./inputs.js";
import Tetromino from "./tetromino.js";
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const grid = new Grid(10, 20, 30);
canvas.width = grid.width * grid.cellSize;
canvas.height = grid.height * grid.cellSize;
document.body.append(canvas);

let currentTetromino = Tetromino.getRandom(grid);
const inputHandler = new InputHandler();
inputHandler.addAction('left', 'a');
inputHandler.addAction('right', 'd');
inputHandler.addAction('rotateLeft', 'q');
inputHandler.addAction('rotateRight', 'e');
inputHandler.addAction('softDrop', 's');
inputHandler.addAction('hardDrop', ' ');
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
let dropThen = 0;
let hasHardDrop = false;
function loop(t)
{
	requestAnimationFrame(loop);
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
	}

	const hardDropKeyPressed = inputHandler.hardDrop;
	if (hardDropKeyPressed && !hasHardDrop)
	{
		hasHardDrop = true;
		currentTetromino.fall(true);
		if (currentTetromino) grid.addTetromino(currentTetromino);
		if (grid[0].every(v => !v)) currentTetromino = Tetromino.getRandom(grid);
		else currentTetromino = null;
	}
	else
	{
		const dropElapsed = t - dropThen;
		if (dropElapsed > (inputHandler.softDrop ? softDropInterval : normalDropInterval) || t === undefined)
		{
			if (t !== undefined) dropThen = t - (dropElapsed % normalDropInterval);
			if (currentTetromino?.isTouchingBottom)
			{
				if (lastTouchedBottom === null) lastTouchedBottom = t;
				else if (t - lastTouchedBottom > lockDelay)
				{
					lastTouchedBottom = null;
					grid.addTetromino(currentTetromino);
					if (grid[0].every(v => !v)) currentTetromino = Tetromino.getRandom(grid);
					else currentTetromino = null;
				}
			}
			else lastTouchedBottom = null;
			if (currentTetromino) currentTetromino.fall();
		}
		if (!hardDropKeyPressed) hasHardDrop = false;
	}
}
// loop();
requestAnimationFrame(loop)
