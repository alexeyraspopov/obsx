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
	let keys = Object.keys(context);
	for (let node = walker.root; node instanceof HTMLElement; node = walker.nextNode()) {
		let ephemeral = node instanceof HTMLTemplateElement;

		if (Object.hasOwn(node.dataset, "when")) {
			let expression = node.dataset.when;
			let gate = compile(expression, keys, context);
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
 * @param {string} expression
 * @param {Iterable<string>} keys
 * @param {Record<string, any>} context
 */
function compile(expression, keys, context) {
	let fn = new Function(...keys, `return (${expression});`);
	return (...extras) => fn(...Object.values(context), ...extras);
}
