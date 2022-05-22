import Grid from "./grid.js";
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
StartLoop([
	{
		interval: 1000 / 60,
		code: () =>
		{
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			currentTetromino.draw(ctx);
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
