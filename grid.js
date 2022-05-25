export default class Grid extends Array
{
	constructor(width, height, cellSize)
	{
		super();
		this.width = width;
		this.height = height;
		this.cellSize = cellSize;
		this.lastClearIsTetris = false;
		this.combo = -1;
		for (let j = 0; j < height; j++)
		{
			this[j] = new Array(width).fill(0);
		}
	}
	addTetromino(tetromino)
	{
		let hasHitTop = false;
		const image = tetromino.image;
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
					this[y][x] = image;
				}
			}
		}

		if (hasHitTop) return 'HIT TOP';

		let linesCleared = 0;
		for (const rowIndex of [...updatedRowIndices].sort((a, b) => b - a))
		{
			if (this[rowIndex].every(v => v))
			{
				linesCleared++;
				this.splice(rowIndex, 1);
			}
		}
		let score = 0;
		if (linesCleared)
		{
			this.unshift(...new Array(this.height - this.length).fill(0).map(() => new Array(this.width).fill(0)))
			score = 50 * ++this.combo;
			switch (linesCleared)
			{
				case 1:
					this.lastClearIsTetris = false;
					score += 100;
					break;
				case 2:
					this.lastClearIsTetris = false;
					score += 300;
					break;
				case 3:
					this.lastClearIsTetris = false;
					score += 500;
					break;
				case 4:
					{
						let pointsToAdd = 800;
						if (this.lastClearIsTetris) pointsToAdd *= 1.5;
						this.lastClearIsTetris = true;
						score += pointsToAdd;
						break;
					}
				default:
					break;
			}
		}
		else this.combo = -1;
		return score;
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
					ctx.drawImage(
						row[i],
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
