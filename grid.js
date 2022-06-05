import SplashManager from "./splashText.js";
export default class Grid extends Array
{
	constructor(width, height, cellSize)
	{
		super();
		this.width = width;
		this.height = height;
		this.cellSize = cellSize;
		this.lastClearType = null;
		this.combo = -1;
		for (let j = 0; j < height; j++)
		{
			this[j] = new Array(width).fill(0);
		}
	}
	addTetromino(tetromino, level)
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

		if (hasHitTop) return { type: 2 };

		const linesToRemove = [];
		for (const rowIndex of [...updatedRowIndices].sort((a, b) => b - a))
		{
			if (this[rowIndex].every(v => v))
			{
				linesToRemove.push(rowIndex);
			}
		}
		if (linesToRemove.length)
		{
			let score = 0;
			let splashText = '';
			if (linesToRemove.length < 4) // single to triple
			{
				const isTspin = checkIfTSpin(this, tetromino);

				if (isTspin && this.lastClearType === 'tspin') splashText += 'Back-To-Back T-Spin + ';
				let countWord = 'Single';
				if (linesToRemove.length === 2) countWord = 'Double';
				else if (linesToRemove.length === 3) countWord = 'Triple';
				if (isTspin) splashText += 'T-Spin ';
				splashText += countWord;

				score += (
					(isTspin ? 800 : 100) +
					(isTspin ? 400 : 200) *
					(linesToRemove.length - 1)
				) * (this.lastClearType === 'tspin' ? 1.5 : 1) * level;
				if (isTspin) this.lastClearType = 'tspin';
				else this.lastClearType = null;
			}
			else // Tetris/quadruple
			{
				if (this.lastClearType === 'tetris') splashText += 'Back-To-Back ';
				splashText += 'Tetris';

				score += 800 * (this.lastClearType === 'tetris' ? 1.5 : 1) * level;;
				this.lastClearType = 'tetris';
			}

			if (this.combo++ > 0)
			{
				const comboScore = 50 * this.combo * level;
				splashText += ` + Combo ×${this.combo}`;
				score += comboScore;
			}

			SplashManager.register({
				x: (tetromino.topX + tetromino.curBoundingIndices.left + (tetromino.curBoundingIndices.right - tetromino.curBoundingIndices.left) / 2) * this.cellSize,
				y: (tetromino.topY + tetromino.curBoundingIndices.top + (tetromino.curBoundingIndices.bottom - tetromino.curBoundingIndices.top) / 2) * this.cellSize,
				text: splashText,
				subtext: `+${score}`,
			});

			return {
				type: 1,
				score,
				linesCleared: linesToRemove.length,
				removeLines: (() =>
				{
					let index = 0;
					return () =>
					{
						if (index < this.width)
						{
							for (const rowIndex of linesToRemove)
							{
								this[rowIndex][index] = null;
							}
							index++;
						}
						else
						{
							for (const rowIndex of linesToRemove)
							{
								this.splice(rowIndex, 1);
							}
							this.unshift(...new Array(this.height - this.length).fill(0).map(() => new Array(this.width).fill(0)))
							this.clearedLines = [];
							return true;
						}
					}
				})()
			};
		}
		else
		{
			this.combo = -1;
			return { type: 0 };
		}
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
