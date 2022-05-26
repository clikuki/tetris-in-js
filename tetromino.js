export default class Tetromino
{
	constructor(grid, matrices, image)
	{
		this.matrices = matrices;
		this.rotation = 0;
		this.currentMatrix = matrices[this.rotation];
		this.image = image;
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
		let matrix = this.currentMatrix;
		if (canvasToCenterAround) matrix = this.currentMatrix
			.slice(this.boundingIndices.top, this.boundingIndices.bottom + 1)
			.map(row => row.slice(this.boundingIndices.left, this.boundingIndices.right + 1));

		for (let j = 0; j < matrix.length; j++)
		{
			const row = matrix[j];
			for (let i = 0; i < row.length; i++)
			{
				if (row[i])
				{
					let x = (i + this.topX) * this.grid.cellSize;
					let y = (j + this.topY) * this.grid.cellSize;
					if (canvasToCenterAround)
					{
						const xPad = (matrix[0].length * this.grid.cellSize - canvasToCenterAround.width) / 2;
						const yPad = (matrix.length * this.grid.cellSize - canvasToCenterAround.height) / 2;
						x = i * this.grid.cellSize - xPad;
						y = j * this.grid.cellSize - yPad;
					}
					ctx.drawImage(this.image, x, y, this.grid.cellSize, this.grid.cellSize);
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
		const { image, matrices } = presets[index];
		return new Tetromino(grid, matrices, image);
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

function getImage(color)
{
	const distFromEdge = 10;
	const image = document.createElement('canvas');
	const c = image.getContext('2d', { alpha: false });
	const size = 100;
	image.width = size;
	image.height = size;
	c.fillStyle = color;
	c.fillRect(0, 0, size, size);
	c.fillStyle = '#fff5';
	c.beginPath();
	c.moveTo(0, 0);
	c.lineTo(distFromEdge, distFromEdge);
	c.lineTo(size - distFromEdge, distFromEdge);
	c.lineTo(size, 0);
	c.fill();
	c.fillStyle = '#0003';
	c.beginPath();
	c.moveTo(0, 0);
	c.lineTo(distFromEdge, distFromEdge);
	c.lineTo(distFromEdge, size - distFromEdge);
	c.lineTo(0, size);
	c.moveTo(size, 0);
	c.lineTo(size - distFromEdge, distFromEdge);
	c.lineTo(size - distFromEdge, size - distFromEdge);
	c.lineTo(size, size);
	c.fill();
	c.fillStyle = '#0006';
	c.beginPath();
	c.moveTo(0, size);
	c.lineTo(distFromEdge, size - distFromEdge);
	c.lineTo(size - distFromEdge, size - distFromEdge);
	c.lineTo(size, size);
	c.fill();
	return image;
}

const presets = [
	{	// I-Shape
		// color: '#00f0f0',
		image: getImage('#00f0f0'),
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
		// color: '#0000f0',
		image: getImage('#0000f0'),
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
		// color: '#f0a000',
		image: getImage('#f0a000'),
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
		// color: '#f0f000',
		image: getImage('#f0f000'),
		matrices: [
			[
				[1, 1],
				[1, 1],
			],
		]
	},
	{
		// color: '#00f000',
		image: getImage('#00f000'),
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
		// color: '#a000f0',
		image: getImage('#a000f0'),
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
		// color: '#f00000',
		image: getImage('#f00000'),
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
