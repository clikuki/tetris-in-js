export default class InputHandler
{
	constructor()
	{
		this.actionKeyPairs = {};
		this.conflictingActions = [];
		this.keyDownEvent = e =>
		{
			const action = this.actionKeyPairs[e.key];
			if (!action) return;
			this[action] = true;
			for (const { conflicts, key } of this.conflictingActions)
			{
				if (conflicts.includes(action)) this[key] = action;
			}
		}
		this.keyUpEvent = e =>
		{
			const action = this.actionKeyPairs[e.key];
			if (!action) return;
			this[action] = false;
			for (const { conflicts, key } of this.conflictingActions)
			{
				if (conflicts.includes(action)) this[key] = null;
			}
		}
		document.addEventListener('keydown', this.keyDownEvent);
		document.addEventListener('keyup', this.keyUpEvent);
	}
	addAction(action, key)
	{
		this.actionKeyPairs[key] = action;
	}
	addActions(actionKeyPairs)
	{
		for (const action in actionKeyPairs)
		{
			const key = actionKeyPairs[action];
			this.addAction(action, key);
		}
	}
	removeAction(key)
	{
		const action = this.actionKeyPairs[key];
		delete this[action];
		delete this.actionKeyPairs[key];
	}
	setConflictingActions(conflictingActions, key)
	{
		this.conflictingActions.push({ conflicts: conflictingActions, key });
		this[key] = null;
	}
	unsetConflictingActions(key)
	{
		this.conflictingActions = this.conflictingActions.filter(({ Bkey: BKey }) => BKey !== key);
		delete this[key];
	}
	destroy()
	{
		document.removeEventListener('keydown', this.keyDownEvent);
		document.removeEventListener('keyup', this.keyUpEvent);
	}
}