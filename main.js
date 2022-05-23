import Grid from "./grid.js";
import InputHandler from "./inputs.js";
import Tetromino from "./tetromino.js";
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const grid = new Grid(10, 20, 30);
canvas.width = grid.width * grid.cellSize;
canvas.height = grid.height * grid.cellSize;
document.body.append(canvas);

function StartLoop(blocks)
{
	blocks.forEach(block => block.then = 0);
	const loop = (t) =>
	{
		const handle = requestAnimationFrame(loop);
		for (const block of blocks)
		{
			const elapsed = t - block.then;
			if (elapsed > block.interval || t === undefined)
			{
				if (t !== undefined) block.then = t - (elapsed % block.interval);
				let stopLoop = false;
				block.code(block, t, () => stopLoop = true);
				if (stopLoop)
				{
					cancelAnimationFrame(handle);
					break;
				}
			}
		}
	}
	loop();
}

let currentTetromino = Tetromino.getRandom(grid);
const inputHandler = new InputHandler();
inputHandler.addAction('left', 'a');
inputHandler.addAction('right', 'd');
inputHandler.addAction('rotateLeft', 'q');
inputHandler.addAction('rotateRight', 'e');
inputHandler.setConflictingActions(['left', 'right'], 'direction');
inputHandler.setConflictingActions(['rotateLeft', 'rotateRight'], 'rotationDirection');

const rotateFirstDelay = 30;
const rotateDelay = 10;
let currentRotateDelay = 0;
let isFirstRotate = true;

const moveFirstDelay = 10;
const moveDelay = 1;
let currentMoveDelay = 0;
let isFirstMove = true;
StartLoop([
	{
		interval: 1000 / 60,
		code: () =>
		{
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			grid.draw(ctx);
			currentTetromino.draw(ctx);

			const direction = inputHandler.direction;
			if (direction)
			{
				if (currentMoveDelay <= 0)
				{
					currentMoveDelay = isFirstMove ? moveFirstDelay : moveDelay;
					if (direction === 'left') currentTetromino.move(-1);
					else if (direction === 'right') currentTetromino.move(1);
					isFirstMove = false;
				}
				else currentMoveDelay--;
			}
			else
			{
				currentMoveDelay = 0;
				isFirstMove = true;
			}

			const rotationDirection = inputHandler.rotationDirection;
			if (rotationDirection)
			{
				if (currentRotateDelay <= 0)
				{
					currentRotateDelay = isFirstRotate ? rotateFirstDelay : rotateDelay;
					if (rotationDirection === 'rotateLeft') currentTetromino.rotate(-1);
					else if (rotationDirection === 'rotateRight') currentTetromino.rotate(1);
					isFirstRotate = false;
				}
				else currentRotateDelay--;
			}
			else
			{
				currentRotateDelay = 0;
				isFirstRotate = true;
			}
		}
	},
	{
		interval: 1000 / 5,
		code: () =>
		{
			currentTetromino.fall();
		}
	},
]);
