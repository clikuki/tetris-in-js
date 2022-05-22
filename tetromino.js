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
	}
	fall()
	{
		this.topY++;
	}
	rotate(direction)
	{
		if (typeof direction !== 'number') return 'Invalid direction';
		direction = Math.sign(direction);
		this.rotation = (this.rotation + 1 + this.matrices.length) % this.matrices.length;
		this.currentMatrix = this.matrices[this.rotation];
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
