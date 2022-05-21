const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const gridWidth = 10;
const gridHeight = 20;
const cellSize = 30;
canvas.width = gridWidth * cellSize;
canvas.height = gridHeight * cellSize;
document.body.append(canvas);

const grid = Array.from({ length: gridHeight }, () => []);
const tetrominoColors = ['#00f0f0', '#0000f0', '#f0a000', '#f0f000', '#00f000', '#a000f0', '#f00000'];
const tetrominoShapes = [
	[
		[[0, 0], [1, 0], [2, 0], [3, 0]],
		[[0, 0], [0, 1], [0, 2], [0, 3]],
	],
	[
		[[0, 0], [0, 1], [1, 1], [2, 1]],
		[[0, 0], [1, 0], [0, 1], [0, 2]],
		[[0, 0], [1, 0], [2, 0], [2, 1]],
		[[1, 0], [1, 1], [1, 2], [0, 2]],
	],
	[
		[[2, 0], [0, 1], [1, 1], [2, 1]],
		[[0, 0], [1, 2], [0, 1], [0, 2]],
		[[0, 0], [1, 0], [2, 0], [0, 1]],
		[[1, 0], [1, 1], [1, 2], [0, 0]],
	],
	[
		[[0, 0], [0, 1], [1, 1], [1, 0]],
	],
	[
		[[1, 0], [2, 0], [0, 1], [1, 1]],
		[[0, 0], [0, 1], [1, 1], [1, 2]],
	],
	[
		[[0, 1], [1, 1], [2, 1], [1, 0]],
		[[0, 0], [0, 1], [1, 1], [0, 2]],
		[[0, 0], [1, 0], [2, 0], [1, 1]],
		[[1, 0], [1, 1], [0, 1], [1, 2]],
	],
	[
		[[0, 0], [1, 0], [1, 1], [2, 1]],
		[[1, 0], [1, 1], [0, 1], [0, 2]],
	],
];

const heldKeys = {};
document.addEventListener('keydown', e => heldKeys[e.key] = true);
document.addEventListener('keyup', e => heldKeys[e.key] = false);

class CurrentTetromino
{
	constructor()
	{
		this.getRandom();
	}
	getRandom()
	{
		if (grid[0].some(v => v !== null)) return 'Cannot get new Tetromino';
		const newType = Math.floor(Math.random() * tetrominoShapes.length);
		const indices = tetrominoShapes[newType][0];
		const width = Math.max(...indices.map(([i]) => i));
		const height = Math.max(...indices.map(([, j]) => j));
		this.type = newType;
		this.rotation = 0;
		this.y = -height;
		this.x = Math.floor(Math.floor(gridWidth / 2) - (width / 2));
		this.w = width;
		this.h = height;
	}
	bottomHasCollided()
	{
		const indices = tetrominoShapes[this.type][this.rotation];
		const yIndices = indices.map(([, j]) => j + this.y);
		const lowestY = Math.max(...yIndices);
		if (lowestY >= gridHeight - 1) return true;
		if (indices.some(([i, j]) =>
		{
			const x = i + this.x;
			const y = j + this.y;
			const rowBelowBlock = grid[y + 1];
			const blockBelowBlock = rowBelowBlock[x];
			if (typeof blockBelowBlock === 'number') return true;
		})) return true;
	}
	// sidesHaveCollided()
	// {

	// }
	rotate(direction)
	{
		if (Math.abs(direction) !== 1) return 'Invalid direction';
		const numOfRotationsTypes = tetrominoShapes[this.type].length;
		this.rotation = (this.rotation + direction + numOfRotationsTypes) % numOfRotationsTypes;
		const indices = tetrominoShapes[this.type][this.rotation];
		const width = Math.max(...indices.map(([i]) => i));
		const height = Math.max(...indices.map(([, j]) => j));
		this.w = width;
		this.h = height;
		if (this.x + width >= gridWidth - 1)
		{
			this.x = gridWidth - 1 - width;
		}
	}
	addToGrid()
	{
		tetrominoShapes[this.type][this.rotation].forEach(([i, j]) =>
		{
			if (!grid[j + this.y]) return;
			grid[j + this.y][i + this.x] = this.type;
		})
	}
}
const curTetromino = new CurrentTetromino();

const fallInterval = 1000 / 10;
const fpsInterval = 1000 / 20;
let fallThen = 0;
let fpsThen = 0;
let lastHeldDown = null;
function loop(t)
{
	const handler = requestAnimationFrame(loop);
	const fallElapsed = t - fallThen;
	const fpsElapsed = t - fpsThen;
	if (fallElapsed > fallInterval || t === undefined)
	{
		if (t !== undefined) fallThen = t - (fallElapsed % fallInterval);
		if (curTetromino.bottomHasCollided())
		{
			curTetromino.addToGrid();
			const e = curTetromino.getRandom();
			if (e) cancelAnimationFrame(handler);
		}
		else curTetromino.y++;
		if ((heldKeys.Enter || heldKeys.r)) curTetromino.rotate(1);
		// if (((heldKeys.Enter && heldKeys.Shift) || heldKeys.R)) curTetromino.rotate(-1);
	}

	if (fpsElapsed > fpsInterval || t === undefined)
	{
		if (t !== undefined) fpsThen = t - (fpsElapsed % fpsInterval);
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		grid.forEach((row, j) =>
		{
			if (!row.length) return;
			row.forEach((clr, i) =>
			{
				ctx.fillStyle = tetrominoColors[clr];
				ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
			})
		})

		ctx.fillStyle = tetrominoColors[curTetromino.type];
		tetrominoShapes[curTetromino.type][curTetromino.rotation].forEach(([i, j]) =>
		{
			const x = i + curTetromino.x;
			const y = j + curTetromino.y;
			ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
		})

		// Prevent next tetrominos from dropping instantly
		if (heldKeys.ArrowDown || heldKeys.s)
		{
			if (lastHeldDown === null || t - lastHeldDown > 500)
			{
				lastHeldDown = t;
				while (true)
				{
					if (curTetromino.bottomHasCollided()) break;
					curTetromino.y++;
				}
			}
		}
		else lastHeldDown = null;
		if ((heldKeys.ArrowLeft || heldKeys.a) && curTetromino.x > 0) curTetromino.x--;
		if ((heldKeys.ArrowRight || heldKeys.d) && curTetromino.x + curTetromino.w < gridWidth - 1) curTetromino.x++;
	}
}
loop();
window.loop = loop;
window.grid = grid;