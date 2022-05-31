export default class TetrominoDisplay
{
	constructor(canvas, cellSize, startTetromino = null)
	{
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d', { alpha: false });
		this.tetromino = startTetromino;
		canvas.width = cellSize * 5;
		canvas.height = cellSize * 5;
		this.clearCanvas();
		if (startTetromino) startTetromino.resetPosition();
	}
	swap(tetromino)
	{
		if (tetromino) tetromino.resetPosition();
		const tmp = this.tetromino;
		this.tetromino = tetromino;
		return tmp;
	}
	clearCanvas()
	{
		this.ctx.fillStyle = 'black';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}
	darken()
	{
		this.ctx.fillStyle = '#333a';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}
	draw()
	{
		this.clearCanvas();
		if (this.tetromino) this.tetromino.draw(this.ctx, this.canvas);
	}
}