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
		const matrix = tetromino.curMatrix;
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

		if (hasHitTop) return { type: 1 };

		const linesToRemove = [];
		for (const rowIndex of [...updatedRowIndices].sort((a, b) => b - a))
		{
			if (this[rowIndex].every(v => v))
			{
				linesToRemove.push(rowIndex);
			}
		}
		let score = 0;
		if (linesToRemove.length)
		{
			score = 50 * ++this.combo;
			switch (linesToRemove.length)
			{
				case 1:
					this.lastClearIsTetris = false;
					if (checkIfTSpin(this, tetromino)) score += 800;
					else score += 100;
					break;
				case 2:
					this.lastClearIsTetris = false;
					if (checkIfTSpin(this, tetromino)) score += 1200;
					else score += 300;
					break;
				case 3:
					this.lastClearIsTetris = false;
					if (checkIfTSpin(this, tetromino)) score += 1600;
					else score += 500;
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
			for (const rowIndex of linesToRemove)
			{
				this.splice(rowIndex, 1);
			}
			this.unshift(...new Array(this.height - this.length).fill(0).map(() => new Array(this.width).fill(0)))
		}
		else this.combo = -1;
		return {
			type: 0,
			score,
		};
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
	overlaps(x, y, matrix)
	{
		for (let j = 0; j < matrix.length; j++)
		{
			if (j + y < 0 || j + y >= this.height) continue;
			// console.log(`j: ${j}`);
			const row = matrix[j];
			for (let i = 0; i < row.length; i++)
			{
				if (i + x < 0 || i + x >= this.width) continue;
				// console.log(`j: ${i}`);
				if (row[i] && this[j + y][i + x]) return true;
			}
		}
	}
}

function checkIfTSpin(grid, tetromino)
{
	if (tetromino.type !== 'T') return;
	if (tetromino.lastMovement !== 1) return;
	const corners = [[0, 0], [2, 0], [0, 2], [2, 2]]
		.filter(([xOffset, yOffset]) =>
		{
			const x = tetromino.topX + xOffset;
			const y = tetromino.topY + yOffset;
			if (x < 0 || x >= grid.width) return true;
			return grid[y]?.[x];
		});
	if (corners.length < 3) return;
	return true;
}
