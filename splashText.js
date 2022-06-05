export default class SplashManager
{
	static #splashes = [];
	static #textSubtextGap = 10;
	static register(info)
	{
		this.#splashes.push({
			textSize: 20,
			subtext: null,
			subtextSize: 15,
			lifetime: 1000,
			...info,
			creationTime: Date.now(),
			positionChecked: false,
		});
	}
	static clearOverdue()
	{
		const currentTime = Date.now();
		this.#splashes = this.#splashes
			.filter(({ creationTime, lifetime }) =>
				currentTime < creationTime + lifetime
			);
	}
	/**
	 * 
	 * @param {CanvasRenderingContext2D} ctx 
	 * @param {*} grid 
	 */
	static draw(ctx, grid)
	{
		ctx.textAlign = 'center';
		ctx.lineWidth = 3;
		for (const splash of this.#splashes)
		{
			if (!splash.positionChecked)
			{
				splash.positionChecked = true;
				ctx.font = ctx.font.replace(/\d+px/, `${splash.textSize}px`);
				const textLength = ctx.measureText(splash.text).width;
				ctx.font = ctx.font.replace(/\d+px/, `${splash.subtextSize}px`);
				const subtextLength = ctx.measureText(splash.subtext).width;
				const splashLength = Math.max(textLength, subtextLength);
				const splashTopHeight = (splash.subtext ? this.#textSubtextGap / 2 + splash.textSize : splash.textSize / 2);
				const splashBottomHeight = (splash.subtext ? this.#textSubtextGap / 2 + splash.subtextSize : splash.textSize / 2);
				const screenSideOffset = 5;
				if (splash.x - splashLength / 2 < 0) splash.x = splashLength / 2 + screenSideOffset;
				if (splash.x + splashLength / 2 > grid.width * grid.cellSize) splash.x = grid.width * grid.cellSize - screenSideOffset - splashLength / 2;
				if (splash.y - splashTopHeight < 0) splash.y = splashTopHeight + screenSideOffset;
				if (splash.y + splashBottomHeight > grid.height * grid.cellSize) splash.y = grid.height * grid.cellSize - screenSideOffset - splashBottomHeight;
			}

			const animProgress = getAnimationProgress(splash.creationTime, splash.lifetime);
			const transparency = Math.floor(animProgress * 15).toString(16);
			ctx.fillStyle = `#fff${transparency}`;
			ctx.strokeStyle = `#000${transparency}`;
			ctx.save();
			ctx.translate(splash.x, splash.y);
			ctx.scale(animProgress, animProgress);
			if (splash.subtext)
			{
				ctx.font = ctx.font.replace(/\d+px/, `${splash.textSize}px`);
				ctx.textBaseline = 'bottom';
				ctx.strokeText(splash.text, 0, -this.#textSubtextGap / 2);
				ctx.fillText(splash.text, 0, -this.#textSubtextGap / 2);
				ctx.font = ctx.font.replace(/\d+px/, `${splash.subtextSize}px`);
				ctx.textBaseline = 'top';
				ctx.strokeText(splash.subtext, 0, this.#textSubtextGap / 2);
				ctx.fillText(splash.subtext, 0, this.#textSubtextGap / 2);
			}
			else
			{
				ctx.textBaseline = 'middle';
				ctx.font = ctx.font.replace(/\d+px/, `${splash.textSize}px`);
				ctx.strokeText(splash.text, 0, 0);
				ctx.fillText(splash.text, 0, 0);
			}
			ctx.restore();
		}
	}
}

function getAnimationProgress(creationTime, lifetime)
{
	const currentTime = Date.now();
	const timeSinceCreation = currentTime - creationTime;
	const fadeLength = Math.min(200, lifetime / 3);
	const isFadingIn = currentTime < creationTime + fadeLength;
	const isFadingOut = currentTime > creationTime + lifetime - fadeLength;
	let transparencyPercent;
	if (isFadingIn) transparencyPercent = timeSinceCreation / fadeLength;
	else if (isFadingOut) transparencyPercent = (1 - ((timeSinceCreation - (lifetime - fadeLength)) / fadeLength));
	else transparencyPercent = 1;
	return Math.max(Math.min(transparencyPercent, 1), 0);
}

const LerpBetweenNumbers = (a, b, t) => a + t * (b - a);
const lerpBetweenPoints = (x1, y1, x2, y2, t) => ({
	x: LerpBetweenNumbers(x1, x2, t),
	y: LerpBetweenNumbers(y1, y2, t),
});
function getEasingFunction(sx1, sy1, c1x2, c1y2, c2x2, c2y2, ex1, ex2)
{
	return t =>
	{
		const quadSP = lerpBetweenPoints(sx1, sy1, c1x2, c1y2, t);
		const quadCP = lerpBetweenPoints(c1x2, c1y2, c2x2, c2y2, t);
		const quadEP = lerpBetweenPoints(c2x2, c2y2, ex1, ex2, t);
		const lineSP = lerpBetweenPoints(quadSP.x, quadSP.y, quadCP.x, quadCP.y, t);
		const lineEP = lerpBetweenPoints(quadCP.x, quadCP.y, quadEP.x, quadEP.y, t);
		const { y: progress } = lerpBetweenPoints(lineSP.x, lineSP.y, lineEP.x, lineEP.y, t);
		return progress;
	}
}