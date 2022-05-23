export default class Tetromino
{
	constructor(grid, matrices, color)
	{
		this.matrices = matrices;
		this.rotation = 0;
		this.currentMatrix = matrices[this.rotation];
		this.color = color;
		this.grid = grid;
		this.topX = Math.ceil((grid.width / 2) - (this.currentMatrix[0].length / 2));
		this.topY = -this.currentMatrix.length;
		this.lowestY = getLowestY(this.currentMatrix);
		this.boundingIndices = getLeftRightBoundingIndices(this.currentMatrix);
		this.isTouchingBottom = false;
	}
	fall()
	{
		if (this.topY + this.lowestY >= this.grid.height - 1) this.isTouchingBottom = true;
		else this.topY++;
	}
	rotate(direction)
	{
		if (typeof direction !== 'number') return 'Invalid direction';
		if (this.matrices.length === 1) return;
		this.rotation = (this.rotation + Math.sign(direction) + this.matrices.length) % this.matrices.length;
		this.currentMatrix = this.matrices[this.rotation];
		this.lowestY = getLowestY(this.currentMatrix);
		this.boundingIndices = getLeftRightBoundingIndices(this.currentMatrix);
	}
	move(direction)
	{
		if (typeof direction !== 'number') return 'Invalid direction';
		direction = Math.sign(direction);
		if (
			this.topX + this.boundingIndices.left + direction >= 0 &&
			this.topX + direction + this.boundingIndices.right < this.grid.width
		)
		{
			this.topX += direction;
		}
	}
	draw(ctx)
	{
		ctx.fillStyle = this.color;
		for (let j = 0; j < this.currentMatrix.length; j++)
		{
			const row = this.currentMatrix[j];
			for (let i = 0; i < row.length; i++)
			{
				if (row[i]) ctx.fillRect(
					(i + this.topX) * this.grid.cellSize,
					(j + this.topY) * this.grid.cellSize,
					this.grid.cellSize,
					this.grid.cellSize,
				);
			}
		}
	}
	static getRandom(grid)
	{
		const index = Math.floor(Math.random() * shapeMatrices.length);
		return new Tetromino(grid, shapeMatrices[index], colors[index]);
	}
}

function getLowestY(matrix)
{
	let lowestY = 0;
	for (let j = 1; j < matrix.length; j++)
	{
		if (matrix[j].some(v => v)) lowestY = j;
	}
	return lowestY;
}

function getLeftRightBoundingIndices(matrix)
{
	const setCells = new Array(matrix[0].length).fill(false);
	for (const row of matrix)
	{
		for (let i = 0; i < row.length; i++)
		{
			if (row[i]) setCells[i] = true;
		}
	}
	return {
		left: setCells.findIndex(v => v),
		right: setCells.length - 1 - setCells.reverse().findIndex(v => v),
	};
}

const colors = ['#00f0f0', '#0000f0', '#f0a000', '#f0f000', '#00f000', '#a000f0', '#f00000'];
const shapeMatrices = [
	[	// I-shape
		[
			[0, 0, 0, 0],
			[1, 1, 1, 1],
			[0, 0, 0, 0],
			[0, 0, 0, 0],
		],
		[
			[0, 0, 1, 0],
			[0, 0, 1, 0],
			[0, 0, 1, 0],
			[0, 0, 1, 0],
		],
		[
			[0, 0, 0, 0],
			[0, 0, 0, 0],
			[1, 1, 1, 1],
			[0, 0, 0, 0],
		],
		[
			[0, 1, 0, 0],
			[0, 1, 0, 0],
			[0, 1, 0, 0],
			[0, 1, 0, 0],
		],
	],
	[	// L-shape
		[
			[1, 0, 0],
			[1, 1, 1],
			[0, 0, 0],
		],
		[
			[0, 1, 1],
			[0, 1, 0],
			[0, 1, 0],
		],
		[
			[0, 0, 0],
			[1, 1, 1],
			[0, 0, 1],
		],
		[
			[0, 1, 0],
			[0, 1, 0],
			[1, 1, 0],
		],
	],
	[	// J-shape
		[
			[0, 0, 1],
			[1, 1, 1],
			[0, 0, 0],
		],
		[
			[0, 1, 0],
			[0, 1, 0],
			[0, 1, 1],
		],
		[
			[0, 0, 0],
			[1, 1, 1],
			[1, 0, 0],
		],
		[
			[1, 1, 0],
			[0, 1, 0],
			[0, 1, 0],
		],
	],
	[	// O-shape
		[
			[1, 1],
			[1, 1],
		],
	],
	[	// S-shape
		[
			[0, 1, 1],
			[1, 1, 0],
			[0, 0, 0],
		],
		[
			[0, 1, 0],
			[0, 1, 1],
			[0, 0, 1],
		],
		[
			[0, 0, 0],
			[0, 1, 1],
			[1, 1, 0],
		],
		[
			[1, 0, 0],
			[1, 1, 0],
			[0, 1, 0],
		],
	],
	[	// T-shape
		[
			[0, 1, 0],
			[1, 1, 1],
			[0, 0, 0],
		],
		[
			[0, 1, 0],
			[0, 1, 1],
			[0, 1, 0],
		],
		[
			[0, 0, 0],
			[1, 1, 1],
			[0, 1, 0],
		],
		[
			[0, 1, 0],
			[1, 1, 0],
			[0, 1, 0],
		],
	],
	[	// Z-shape
		[
			[1, 1, 0],
			[0, 1, 1],
			[0, 0, 0],
		],
		[
			[0, 0, 1],
			[0, 1, 1],
			[0, 1, 0],
		],
		[
			[0, 0, 0],
			[1, 1, 0],
			[0, 1, 1],
		],
		[
			[0, 1, 0],
			[1, 1, 0],
			[1, 0, 0],
		],
	],
];
