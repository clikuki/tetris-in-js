export default class InputHandler
{
	constructor()
	{
		this.actionKeyPairs = {};
		this.keyDownEvent = e =>
		{
			const action = this.actionKeyPairs[e.key];
			if (!action) return;
			this[action] = true;
		}
		this.keyUpEvent = e =>
		{
			const action = this.actionKeyPairs[e.key];
			if (!action) return;
			this[action] = false;
		}
		document.addEventListener('keydown', this.keyDownEvent);
		document.addEventListener('keyup', this.keyUpEvent);
	}
	addKey(action, key)
	{
		this.actionKeyPairs[key] = action;
	}
	removeKey(key)
	{
		const action = this.actionKeyPairs[key];
		delete this[action];
		delete this.actionKeyPairs[key];
	}
	destroy()
	{
		document.removeEventListener('keydown', this.keyDownEvent);
		document.removeEventListener('keyup', this.keyUpEvent);
	}
}