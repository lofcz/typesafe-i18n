import { NEW_LINE, NEW_LINE_INDENTED } from '../../constants.mjs'
import { isParsedResultEntry, type ParsedResult, type ParsedResultEntry } from '../../types.mjs'
import { wrapObjectKeyIfNeeded } from '../../utils/generator.utils.mjs'

// --------------------------------------------------------------------------------------------------------------------

export const getNestedKey = (key: string, parentKeys: string[]) => [...parentKeys, key].join('.')

// --------------------------------------------------------------------------------------------------------------------

// eslint-disable-next-line prettier/prettier
export const mapToString = <T,>(items: T[], mappingFunction: (item: T) => string): string =>
	items.map(mappingFunction).join('')

// --------------------------------------------------------------------------------------------------------------------

// eslint-disable-next-line prettier/prettier
export const wrapObjectType = <T,>(array: T[], callback: () => string) =>
	!array.length
		? '{}'
		: `{${callback()}
}`

// --------------------------------------------------------------------------------------------------------------------

export const wrapUnionType = (array: string[]) => (!array.length ? ' never' : `${createUnionType(array)}`)

const createUnionType = (entries: string[]) =>
	mapToString(
		entries,
		(locale) => `
	| '${locale}'`,
	)

// --------------------------------------------------------------------------------------------------------------------

// Iterative depth-first flattening to avoid stack overflow on large/deep trees.
// Push children in reverse so pop() yields left-to-right order (same as the
// previous recursive flatMap), which keeps formatter union member order stable.
export const flattenToParsedResultEntry = (parsedResults: ParsedResult[]): ParsedResultEntry[] => {
	const result: ParsedResultEntry[] = []
	const stack: ParsedResult[] = [...parsedResults].reverse()

	while (stack.length) {
		const parsedResult = stack.pop() as ParsedResult
		if (isParsedResultEntry(parsedResult)) {
			result.push(parsedResult)
		} else {
			const nestedItems: ParsedResult[] = []
			for (const nested of Object.values(parsedResult as Exclude<ParsedResult, ParsedResultEntry>)) {
				for (const item of nested) nestedItems.push(item)
			}
			for (let i = nestedItems.length - 1; i >= 0; i--) {
				stack.push(nestedItems[i] as ParsedResult)
			}
		}
	}

	return result
}

// --------------------------------------------------------------------------------------------------------------------

export const processNestedParsedResult = (
	items: Exclude<ParsedResult, ParsedResultEntry>,
	mappingFunction: (item: ParsedResult) => string,
): string =>
	NEW_LINE_INDENTED +
	mapToString(
		Object.entries(items),
		([key, parsedResults]) =>
			`${wrapObjectKeyIfNeeded(key)}: {${mapToString(parsedResults, mappingFunction)
				.split(/\r?\n/)
				.map((line) => `	${line}`)
				.join(NEW_LINE)}
	}`,
	)
