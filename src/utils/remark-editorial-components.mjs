import { fileURLToPath } from 'node:url';
import { visit } from 'unist-util-visit';

const directory = new URL('../components/editorial/', import.meta.url);
const components = new Set(['Compare', 'Example', 'FolderTree', 'GeometricCover', 'WideFigure', 'Workflow']);

function addBindings(pattern, bindings) {
	if (!pattern) return;
	if (pattern.type === 'Identifier') bindings.add(pattern.name);
	else if (pattern.type === 'ObjectPattern') for (const property of pattern.properties) {
		addBindings(property.value ?? property.argument, bindings);
	}
	else if (pattern.type === 'ArrayPattern') for (const item of pattern.elements) addBindings(item, bindings);
	else if (pattern.type === 'RestElement') addBindings(pattern.argument, bindings);
	else if (pattern.type === 'AssignmentPattern') addBindings(pattern.left, bindings);
}

export default function remarkEditorialComponents() {
	return (tree, file) => {
		if (!/[/\\]src[/\\]content[/\\]blog[/\\](?:ko|jp|en)[/\\].+\.mdx$/.test(file.path ?? '')) return;

		const bindings = new Set();
		for (const node of tree.children) {
			if (node.type !== 'mdxjsEsm') continue;
			for (const statement of node.data?.estree?.body ?? []) {
				const declaration = statement.declaration ?? statement;
				for (const specifier of declaration.specifiers ?? []) {
					if (declaration.type === 'ImportDeclaration') bindings.add(specifier.local.name);
				}
				addBindings(declaration.id, bindings);
				for (const variable of declaration.declarations ?? []) addBindings(variable.id, bindings);
			}
		}

		const imports = [];
		for (const type of ['mdxJsxFlowElement', 'mdxJsxTextElement']) visit(tree, type, ({ name }) => {
			if (!components.has(name) || bindings.has(name)) return;
			bindings.add(name);
			const source = fileURLToPath(new URL(name + '.astro', directory));
			imports.push({
				type: 'ImportDeclaration',
				source: { type: 'Literal', value: source },
				specifiers: [{ type: 'ImportDefaultSpecifier', local: { type: 'Identifier', name } }],
			});
		});
		if (imports.length) tree.children.unshift({
			type: 'mdxjsEsm',
			value: '',
			data: { estree: { type: 'Program', sourceType: 'module', body: imports } },
		});
	};
}
