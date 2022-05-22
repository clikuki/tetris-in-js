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
		// for (let j = 0; j < this.length; j++)
		// {
		// 	const row = this[j];
		// 	for (let i = 0; i < row.length; i++)
		// 	{
		// 		if (row[i])
		// 		{
		// 			ctx.fillStyle = row[i];
		// 			ctx.fillRect(
		// 				i * this.cellSize,
		// 				j * this.cellSize,
		// 				this.cellSize,
		// 				this.cellSize
		// 			);
		// 		}
		// 	}
		// }
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
