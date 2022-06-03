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
		this.boundingIndices = getBoundingIndices(this.matrices, type);
		this.curBoundingIndices = this.boundingIndices[this.rotation];
		this.startX = Math.ceil((grid.width / 2) - (this.curMatrix[0].length / 2));
		this.startY = -this.curBoundingIndices.bottom;
		this.resetPosition();
		this.isTouchingBottom = false;
		this.ghostY = null;
	}
	resetPosition()
	{
		this.topX = this.startX;
		this.topY = this.startY;
	}
	checkIfBottomTouchesGround()
	{
		return this.topY + this.curBoundingIndices.bottom >= this.grid.height - 1 || this.grid.overlaps(this.topX, this.topY + 1, this.curMatrix);
	}
	fall(hardDrop)
	{
		do
		{
			if (this.checkIfBottomTouchesGround())
			{
				this.isTouchingBottom = true;
				return;
			}
			else
			{
				this.lastMovement = 0;
				this.topY++;
			}
		} while (hardDrop);

		if (this.checkIfBottomTouchesGround())
		{
			this.isTouchingBottom = true;
			return;
		}
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
				this.grid.overlaps(this.topX + xOffset, this.topY + yOffset, newMatrix)
			) continue;

			// Rotation is sucessful
			this.lastMovement = 1;
			this.rotation = newRotationIndex
			this.curMatrix = newMatrix;
			this.curBoundingIndices = newBoundingIndices;
			this.topX += xOffset;
			this.topY += yOffset;
			this.isTouchingBottom = this.checkIfBottomTouchesGround();
			if (this.ghostY !== null) this.ghostY = getGhostY(this.grid, this.topX, this.topY, newMatrix, newBoundingIndices);
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
			!this.grid.overlaps(newX, this.topY, this.curMatrix)
		)
		{
			this.lastMovement = 2;
			this.topX = newX;
			this.isTouchingBottom = this.checkIfBottomTouchesGround();
			if (this.ghostY !== null) this.ghostY = getGhostY(this.grid, newX, this.topY, this.curMatrix, this.curBoundingIndices);
		}
	}
	draw(ctx, canvasToCenterAround)
	{
		let matrix = this.curMatrix;
		if (canvasToCenterAround) matrix = this.curMatrix
			.slice(this.curBoundingIndices.top, this.curBoundingIndices.bottom + 1)
			.map(row => row.slice(this.curBoundingIndices.left, this.curBoundingIndices.right + 1));

		if (!canvasToCenterAround && this.ghostY) drawGhost(ctx, this.topX, this.ghostY, this.curMatrix, this.grid.cellSize);

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
	StartGhostPiece()
	{
		this.ghostY = getGhostY(this.grid, this.topX, this.topY, this.curMatrix, this.curBoundingIndices);
	}
	static getRandom(grid)
	{
		if (!bucket.length)
		{
			const copy = [...terominoData];
			while (copy.length)
			{
				const index = Math.floor(Math.random() * copy.length);
				bucket.push(...copy.splice(index, 1));
			}
		}

		const { image, type, matrices, kickData } = bucket.pop();
		return new Tetromino(grid, matrices, kickData, type, image);
	}
}

const bucket = [];
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

function getGhostY(grid, x, startY, matrix, boundingIndices)
{
	let y = startY;
	while (true)
	{
		if (y + boundingIndices.bottom >= grid.height - 1 || grid.overlaps(x, y + 1, matrix)) return y;
		else y++;
	}
}

function drawGhost(ctx, topX, topY, matrix, cellSize)
{
	ctx.beginPath();
	for (let j = 0; j < matrix.length; j++)
	{
		const row = matrix[j];
		for (let i = 0; i < row.length; i++)
		{
			if (row[i])
			{
				const x = (i + topX) * cellSize;
				const y = (j + topY) * cellSize;
				ctx.moveTo(x, y);
				for (const [[neighborXOffset, neighborYOffset], [drawXOffset, drawYOffset]] of [
					[[0, -1], [cellSize, 0]],
					[[1, 0], [cellSize, cellSize]],
					[[0, 1], [0, cellSize]],
					[[-1, 0], [0, 0]],
				])
				{
					const neighborX = i + neighborXOffset;
					const neighborY = j + neighborYOffset;
					const drawX = x + drawXOffset;
					const drawY = y + drawYOffset;
					if (!matrix[neighborY]?.[neighborX]) ctx.lineTo(drawX, drawY);
					else ctx.moveTo(drawX, drawY);
				}
			}
		}
	}
	ctx.strokeStyle = 'white';
	ctx.lineWidth = 1;
	ctx.stroke();
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

const terominoData = [
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
