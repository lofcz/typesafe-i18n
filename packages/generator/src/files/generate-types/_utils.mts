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
export const flattenToParsedResultEntry = (parsedResults: ParsedResult[]): ParsedResultEntry[] => {
	const result: ParsedResultEntry[] = []
	const stack: ParsedResult[] = [...parsedResults]

	while (stack.length) {
		const parsedResult = stack.pop() as ParsedResult
		if (isParsedResultEntry(parsedResult)) {
			result.push(parsedResult)
		} else {
			for (const nested of Object.values(parsedResult as Exclude<ParsedResult, ParsedResultEntry>)) {
				for (const item of nested) stack.push(item)
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
