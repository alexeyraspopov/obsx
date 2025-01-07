/**
 * @param {HTMLElement} root
 * @param {Record<string, any>} context
 */
export function apply(root, context) {
	/* Root element treated as a template. The first step is to traverse it, compile
	expressions and schedule render code. Traversing should really only happen once,
	and all other things delegated to local watchers. Though, I still need to ensure
	this applicable to `data-when` directive's children. Scheduling in watchers must
	use shared queue that yields to browser at 60Hz. */
	let walker = treeWalker(root);
	let keys = allKeys(context);
	for (let node = walker.root; node instanceof HTMLElement; node = walker.nextNode()) {
		let ephemeral = node instanceof HTMLTemplateElement;

		if (Object.hasOwn(node.dataset, "when")) {
			let expression = node.dataset.when;
			let gate = compile(expression, context, keys);
			// TODO schedule compilation
			continue;
		}

		if (Object.hasOwn(node.dataset, "each")) {
			let expression = node.dataset.each;
			// TODO schedule compilation and list reconcillation
			continue;
		}

		for (let key in node.dataset) {
			let expression = node.dataset[key];
			if (key.startsWith("on")) {
				// TODO event binding
			} else if (key.startsWith("attr")) {
				// TODO attribute binding
			} else if (key.startsWith("prop")) {
				// TODO property binding
			}
		}
	}
}

/** @param {HTMLElement} node */
function treeWalker(node) {
	let whatToShow = NodeFilter.SHOW_ELEMENT;
	return document.createTreeWalker(node, whatToShow, { acceptNode });
}

/** @param {HTMLElement} node */
function acceptNode(node) {
	for (let key in node.dataset)
		if (Object.hasOwn(node.dataset, key)) return NodeFilter.FILTER_ACCEPT;
	return NodeFilter.FILTER_SKIP;
}

/**
 * 1. should allow to continue using `this`
 * 2. allows context to have accessible prototype
 *
 * @param {string} expression
 * @param {Record<string, unknown>} context
 * @param {Array<string>} keys
 * @param {Array<string>} [extras]
 * @returns {(...extras: Array<unknown>) => unknown}
 */
function compile(expression, context, keys, extras) {
	// XXX do I need to bind methods?
	let fn = new Function(`
  	${keys.reduce((acc, key) => acc + `const ${key} = this.${key};\n`, "")}
  	return (${extras != null ? extras.join(", ") : ""}) => (${expression});
  `);
	return fn.call(context);
}

/**
 * Collect object keys including prototype chain up to Object.prototype.
 *
 * @param {object} target
 * @returns {Array<string>}
 */
function allKeys(target) {
	let identifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
	let keys = new Set();
	while (target != null && target !== Object.prototype) {
		let ownKeys = Object.getOwnPropertyNames(target);
		for (let key of ownKeys) if (identifier.test(key)) keys.add(key);
		target = Object.getPrototypeOf(target);
	}
	return Array.from(keys);
}
