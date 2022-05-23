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
				block.code({
					b: block, t,
					stop: () => stopLoop = true
				});
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
StartLoop([
	{
		interval: 1000 / 60,
		code: ({ t }) =>
		{
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			grid.draw(ctx);

			if (!currentTetromino) return;

			currentTetromino.draw(ctx);
			const moveDirection = inputHandler.direction;
			if (moveDirection)
			{
				if (lastMoved === null) lastMoved = t;
				else if (t - lastMoved > (moveInARowCount === 1 ? moveLongDelay : moveShortDelay))
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
				else if (t - lastRotated > (rotatesInARowCount === 1 ? rotateLongDelay : rotateShortDelay))
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
	},
	{
		interval: 1000 / 5,
		code: ({ t }) =>
		{
			if (!currentTetromino) return;
			if (currentTetromino.isTouchingBottom)
			{
				if (lastTouchedBottom === null) lastTouchedBottom = t;
				else if (t - lastTouchedBottom > lockDelay)
				{
					lastTouchedBottom = null;
					grid.addTetromino(currentTetromino);
					currentTetromino = null;
				}
			}
			else lastTouchedBottom = null;
			currentTetromino.fall();
		}
	},
]);
