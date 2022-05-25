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
			this[j] = new Array(width);
		}
	}
	addTetromino(tetromino)
	{
		const color = tetromino.color;
		const matrix = tetromino.currentMatrix;
		for (let j = 0; j < matrix.length; j++)
		{
			const row = matrix[j];
			for (let i = 0; i < row.length; i++)
			{
				const x = i + tetromino.topX;
				const y = j + tetromino.topY;
				if (y < 0 || y >= this.height || x < 0 || x >= this.width) continue;
				if (row[i]) this[j + tetromino.topY][i + tetromino.topX] = color;
			}
		}

		if (tetromino.topY < 0) return 'HIT TOP';
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
}
