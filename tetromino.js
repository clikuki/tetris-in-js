export default class Tetromino
{
	constructor(grid, matrices, kickData, image)
	{
		this.matrices = matrices;
		this.kickData = kickData;
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
	checkIfBottomTouchesGround()
	{
		return this.topY + this.boundingIndices.bottom >= this.grid.height - 1 || this.checkIfOverlapsGridBlocks({ topY: this.topY + 1 });
	}
	checkIfOverlapsGridBlocks({ topX = this.topX, topY = this.topY, matrix = this.currentMatrix })
	{
		for (let j = 0; j < matrix.length; j++)
		{
			if (j + topY < 0 || j + topY >= this.grid.height) continue;
			const row = matrix[j];
			for (let i = 0; i < row.length; i++)
			{
				if (i + topX < 0 || i + topX >= this.grid.width) continue;
				if (row[i] && this.grid[j + topY][i + topX]) return true;
			}
		}
	}
	fall(hardDrop)
	{
		do
		{
			if (this.checkIfBottomTouchesGround())
			{
				this.isTouchingBottom = true;
				break;
			}
			else this.topY++;
		} while (hardDrop);
	}
	rotate(direction)
	{
		if (typeof direction !== 'number') return 'Invalid direction';
		if (this.matrices.length === 1) return;
		const newRotationIndex = (this.rotation + Math.sign(direction) + this.matrices.length) % this.matrices.length;
		const newMatrix = this.matrices[newRotationIndex]
		const newBoundingIndices = getBoundingIndices(newMatrix);

		const kickIndex = (this.rotation - (direction === 1 ? 0 : 1) + this.matrices.length) % this.matrices.length;
		const kickOffsets = [[0, 0]].concat(
			this.kickData ? this.kickData[kickIndex].map(([x, y]) => [x * direction, y * direction]) : []
		);

		console.log(`Attempting ${direction === -1 ? 'counter' : ''}clockwise rotation`)
		for (const [xOffset, yOffset] of kickOffsets.slice())
		{
			if (
				this.topX + xOffset + newBoundingIndices.left < 0 ||
				this.topX + xOffset + newBoundingIndices.right >= this.grid.width ||
				this.topY + yOffset + newBoundingIndices.bottom >= this.grid.height ||
				this.checkIfOverlapsGridBlocks({ matrix: newMatrix, topY: this.topY + yOffset, topX: this.topX + xOffset })
			)
			{
				console.log(`[${xOffset * direction},${yOffset * direction}] failed`);
				continue
			};

			// Rotation is sucessful
			console.log(`[${xOffset * direction},${yOffset * direction}] succeeded`);
			this.rotation = newRotationIndex
			this.currentMatrix = newMatrix;
			this.boundingIndices = newBoundingIndices;
			this.topX += xOffset;
			this.topY += yOffset;
			break;
		}
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
			this.isTouchingBottom = this.checkIfBottomTouchesGround();
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
		const { image, matrices, kickData } = presets[index];
		return new Tetromino(grid, matrices, kickData, image);
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

// Used for testing out positions by filling cells in
export const neutralBlock = getImage('#999');

// Wall kick data for J,L,S,T,Z shapes
const kickDataForMostTetrominos = [
	[
		[-1, 0],
		[-1, -1],
		[0, 2],
		[-1, 2],
	],
	[
		[1, 0],
		[1, 1],
		[0, -2],
		[1, -2],
	],
	[
		[1, 0],
		[1, -1],
		[0, 2],
		[1, 2],
	],
	[
		[-1, 0],
		[-1, 1],
		[0, -2],
		[-1, -2],
	],
];

const presets = [
	{	// I-Shape
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
		],
		kickData: [
			[
				[-2, 0],
				[1, 0],
				[-2, 1],
				[1, -2],
			],
			[
				[-1, 0],
				[2, 0],
				[-1, -2],
				[2, 1],
			],
			[
				[2, 0],
				[-1, 0],
				[2, -1],
				[-1, 2],
			],
			[
				[1, 0],
				[-2, 0],
				[1, 2],
				[-2, -1],
			],
		],
	},
	{	// J-Shape
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
		],
		kickData: kickDataForMostTetrominos,
	},
	{	// L-Shape
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
		],
		kickData: kickDataForMostTetrominos,
	},
	{	// O-Shape
		image: getImage('#f0f000'),
		matrices: [
			[
				[1, 1],
				[1, 1],
			],
		],
		kickData: null,
	},
	{	// S-Shape
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
		],
		kickData: kickDataForMostTetrominos,
	},
	{	// T-Shape
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
		],
		kickData: kickDataForMostTetrominos,
	},
	{	// Z-Shape
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
		],
		kickData: kickDataForMostTetrominos,
	},
]
