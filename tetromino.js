export default class Tetromino
{
	constructor(grid, matrices, kickData, type, image)
	{
		this.type = type;
		this.matrices = matrices;
		this.kickData = kickData;
		this.rotation = 0;
		this.lastMovement = null; // 0 = fall, 1 = rotation, 2 = move
		this.curMatrix = matrices[this.rotation];
		this.image = image;
		this.grid = grid;
		this.topX = Math.ceil((grid.width / 2) - (this.curMatrix[0].length / 2));
		this.topY = -this.curMatrix.length;
		this.boundingIndices = getBoundingIndices(this.matrices, type);
		this.curBoundingIndices = this.boundingIndices[this.rotation];
		this.isTouchingBottom = false;
	}
	resetPosition()
	{
		this.topX = Math.ceil((this.grid.width / 2) - (this.curMatrix[0].length / 2));
		this.topY = -this.curMatrix.length;
	}
	checkIfBottomTouchesGround()
	{
		return this.topY + this.curBoundingIndices.bottom >= this.grid.height - 1 || this.checkIfOverlapsGridBlocks({ topY: this.topY + 1 });
	}
	checkIfOverlapsGridBlocks({ topX = this.topX, topY = this.topY, matrix = this.curMatrix })
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
			else
			{
				this.lastMovement = 0;
				this.topY++;
			}
		} while (hardDrop);
	}
	rotate(direction)
	{
		if (typeof direction !== 'number') return 'Invalid direction';
		if (this.matrices.length === 1) return;
		const newRotationIndex = (this.rotation + Math.sign(direction) + this.matrices.length) % this.matrices.length;
		const newMatrix = this.matrices[newRotationIndex]
		const newBoundingIndices = this.boundingIndices[newRotationIndex];

		const kickIndex = (this.rotation - (direction === 1 ? 0 : 1) + this.matrices.length) % this.matrices.length;
		const kickOffsets = [[0, 0]].concat(
			this.kickData ? this.kickData[kickIndex].map(([x, y]) => [x * direction, y * direction]) : []
		);

		for (const [xOffset, yOffset] of kickOffsets.slice())
		{
			if (
				this.topX + xOffset + newBoundingIndices.left < 0 ||
				this.topX + xOffset + newBoundingIndices.right >= this.grid.width ||
				this.topY + yOffset + newBoundingIndices.bottom >= this.grid.height ||
				this.checkIfOverlapsGridBlocks({ matrix: newMatrix, topY: this.topY + yOffset, topX: this.topX + xOffset })
			) continue;

			// Rotation is sucessful
			this.lastMovement = 1;
			this.rotation = newRotationIndex
			this.curMatrix = newMatrix;
			this.curBoundingIndices = newBoundingIndices;
			this.topX += xOffset;
			this.topY += yOffset;
			this.isTouchingBottom = this.checkIfBottomTouchesGround();
			break;
		}
	}
	move(direction)
	{
		if (typeof direction !== 'number') return 'Invalid direction';
		direction = Math.sign(direction);
		const newX = this.topX + direction;
		if (
			newX + this.curBoundingIndices.left >= 0 &&
			newX + this.curBoundingIndices.right < this.grid.width &&
			!this.checkIfOverlapsGridBlocks({ topX: newX })
		)
		{
			this.lastMovement = 2;
			this.topX = newX;
			this.isTouchingBottom = this.checkIfBottomTouchesGround();
		}
	}
	draw(ctx, canvasToCenterAround)
	{
		let matrix = this.curMatrix;
		if (canvasToCenterAround) matrix = this.curMatrix
			.slice(this.curBoundingIndices.top, this.curBoundingIndices.bottom + 1)
			.map(row => row.slice(this.curBoundingIndices.left, this.curBoundingIndices.right + 1));

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
		const { image, type, matrices, kickData } = presets[index];
		return new Tetromino(grid, matrices, kickData, type, image);
	}
}

const indicesBucket = [];

const mem = {};
function getBoundingIndices(matrices, type)
{
	const data = mem[type] ? mem[type] : matrices.map(matrix =>
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
	})
	if (!mem[type]) mem[type] = data;
	return data;
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
const kickDataForIShape = [
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
]

const presets = [
	{
		type: 'I',
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
		kickData: kickDataForIShape,
	},
	{
		type: 'J',
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
	{
		type: 'L',
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
	{
		type: 'O',
		image: getImage('#f0f000'),
		matrices: [
			[
				[1, 1],
				[1, 1],
			],
		],
		kickData: null,
	},
	{
		type: 'S',
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
	{
		type: 'T',
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
	{
		type: 'Z',
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
