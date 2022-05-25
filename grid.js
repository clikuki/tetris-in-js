export default class Grid extends Array
{
	constructor(width, height, cellSize)
	{
		super();
		this.width = width;
		this.height = height;
		this.cellSize = cellSize;
		for (let j = 0; j < height; j++)
		{
			this[j] = new Array(width).fill(0);
		}
	}
	addTetromino(tetromino)
	{
		let hasHitTop = false;
		const color = tetromino.color;
		const matrix = tetromino.currentMatrix;
		const updatedRowIndices = new Set();
		for (let j = 0; j < matrix.length; j++)
		{
			const row = matrix[j];
			for (let i = 0; i < row.length; i++)
			{
				const x = i + tetromino.topX;
				const y = j + tetromino.topY;
				if (y <= 0) hasHitTop = true;
				if (y < 0 || y >= this.height || x < 0 || x >= this.width) continue;
				if (row[i])
				{
					updatedRowIndices.add(y);
					this[y][x] = color;
				}
			}
		}

		if (hasHitTop) return 'HIT TOP';

		let lineCleared = false;
		for (const rowIndex of [...updatedRowIndices].sort((a, b) => b - a))
		{
			if (this[rowIndex].every(v => v))
			{
				lineCleared = true;
				this.splice(rowIndex, 1);
			}
		}
		if (lineCleared) this.unshift(...new Array(this.height - this.length).fill(0).map(() => new Array(this.width).fill(0)));
	}
	draw(ctx)
	{
		for (let j = 0; j < this.length; j++)
		{
			const row = this[j];
			for (let i = 0; i < row.length; i++)
			{
				if (row[i])
				{
					ctx.fillStyle = row[i];
					ctx.fillRect(
						i * this.cellSize,
						j * this.cellSize,
						this.cellSize,
						this.cellSize
					);
				}
			}
		}
	}
	empty()
	{
		for (let j = 0; j < this.height; j++)
		{
			this[j] = new Array(this.width).fill(0);
		}
	}
}
