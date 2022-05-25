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
		this.boundingIndices = getBoundingIndices(this.currentMatrix);
		this.isTouchingBottom = false;
	}
	resetPosition()
	{
		this.topX = Math.ceil((this.grid.width / 2) - (this.currentMatrix[0].length / 2));
		this.topY = -this.currentMatrix.length;
	}
	checkIfBotttomTouchesGround()
	{
		return this.topY + this.boundingIndices.bottom >= this.grid.height - 1 || this.checkIfOverlapsGridBlocks({ topY: this.topY + 1 });
	}
	checkIfOverlapsGridBlocks({ topX = this.topX, topY = this.topY, matrix = this.currentMatrix })
	{
		for (let j = 0; j < matrix.length; j++)
		{
			const row = matrix[j];
			for (let i = 0; i < row.length; i++)
			{
				if (j + topY < 0) continue;
				if (row[i] && this.grid[j + topY][i + topX]) return true;
			}
		}
	}
	fall(hardDrop)
	{
		do
		{
			if (this.checkIfBotttomTouchesGround())
			{
				this.isTouchingBottom = true;
				break;
			}
			else this.topY++;
		} while (hardDrop);
	}
	// TODO: Implement wall and floor kicks
	rotate(direction)
	{
		if (typeof direction !== 'number') return 'Invalid direction';
		if (this.matrices.length === 1) return;
		const newRotationIndex = (this.rotation + Math.sign(direction) + this.matrices.length) % this.matrices.length;
		const newMatrix = this.matrices[newRotationIndex]
		const newBoundingIndices = getBoundingIndices(newMatrix);

		// Test for overlap against grid walls
		if (
			this.topX + newBoundingIndices.left < 0 ||
			this.topX + newBoundingIndices.right >= this.grid.width
		) return;

		// Test for overlap against grid floor
		if (this.topY + this.boundingIndices.bottom >= this.grid.height - 1) return;

		// Test for grid block overlaps
		if (this.checkIfOverlapsGridBlocks({ matrix: newMatrix })) return;

		// Rotation is sucessful
		this.rotation = newRotationIndex
		this.currentMatrix = newMatrix;
		this.boundingIndices = newBoundingIndices;
	}
	move(direction)
	{
		if (typeof direction !== 'number') return 'Invalid direction';
		direction = Math.sign(direction);
		const newX = this.topX + direction;
		if (
			newX + this.boundingIndices.left >= 0 &&
			newX + this.boundingIndices.right < this.grid.width &&
			!this.checkIfOverlapsGridBlocks({ topX: newX })
		)
		{
			this.topX = newX;
			this.isTouchingBottom = this.checkIfBotttomTouchesGround();
		}
	}
	draw(ctx, canvasToCenterAround)
	{
		ctx.fillStyle = this.color;
		for (let j = 0; j < this.currentMatrix.length; j++)
		{
			const row = this.currentMatrix[j];
			for (let i = 0; i < row.length; i++)
			{
				if (row[i])
				{
					let x = (i + this.topX) * this.grid.cellSize;
					let y = (j + this.topY) * this.grid.cellSize;

					if (canvasToCenterAround)
					{
						const xPad = (this.currentMatrix[0].length * this.grid.cellSize - canvasToCenterAround.width) / 2;
						const yPad = (this.currentMatrix.length * this.grid.cellSize - canvasToCenterAround.height) / 2;
						x = i * this.grid.cellSize - xPad;
						y = j * this.grid.cellSize - yPad;
					}

					ctx.fillRect(x, y, this.grid.cellSize, this.grid.cellSize);
				}
			}
		}
	}
	static getRandom(grid)
	{
		if (!indicesBucket.length)
		{
			const bucketSize = 2;
			const preIndicesBucket = [];
			for (let i = 0; i < bucketSize; i++)
			{
				while (preIndicesBucket.length < presets.length)
				{
					const index = Math.floor(Math.random() * presets.length);
					if (preIndicesBucket.includes(index)) continue;
					preIndicesBucket.push(index);
				}
			}
			while (preIndicesBucket.length)
			{
				const randomIndex = Math.floor(Math.random() * preIndicesBucket.length);
				const indexToPush = preIndicesBucket.splice(randomIndex, 1);
				indicesBucket.push(indexToPush);
			}
		}

		const index = indicesBucket.pop();
		const { color, matrices } = presets[index];
		return new Tetromino(grid, matrices, color);
	}
}

const indicesBucket = [];

function getBoundingIndices(matrix)
{
	const horizontalCells = [];
	for (const row of matrix)
	{
		for (let i = 0; i < row.length; i++)
		{
			if (row[i]) horizontalCells[i] = true;
		}
	}

	const verticalCells = [];
	for (let j = 0; j < matrix.length; j++)
	{
		let hasCell = false;
		for (const cell of matrix[j])
		{
			if (cell)
			{
				hasCell = true;
				break;
			}
		}
		verticalCells[j] = hasCell;
	}

	return {
		left: horizontalCells.findIndex(v => v),
		right: horizontalCells.length - 1 - horizontalCells.reverse().findIndex(v => v),
		top: verticalCells.findIndex(v => v),
		bottom: verticalCells.length - 1 - verticalCells.reverse().findIndex(v => v),
	};
}

const presets = [
	{	// I-Shape
		color: '#00f0f0',
		matrices: [
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
		]
	},
	{
		color: '#0000f0',
		matrices: [
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
		]
	},
	{
		color: '#f0a000',
		matrices: [
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
		]
	},
	{
		color: '#f0f000',
		matrices: [
			[
				[1, 1],
				[1, 1],
			],
		]
	},
	{
		color: '#00f000',
		matrices: [
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
		]
	},
	{
		color: '#a000f0',
		matrices: [
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
		]
	},
	{
		color: '#f00000',
		matrices: [
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
		]
	},
]
