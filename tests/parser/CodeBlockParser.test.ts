import { describe, it, expect } from 'vitest';
import { CodeBlockParser } from '../../src/parser/CodeBlockParser';
import { Action, OracleQuestion, MechanicsRoll, OracleResult, Consequence, TableLookup, Generator, MetaNote, TextLine } from '../../src/types/notation';

describe('CodeBlockParser', () => {
	const parser = new CodeBlockParser();

	describe('parseCodeBlock', () => {
		it('should parse action lines', () => {
			const content = '> The hero draws their sword';
			const result = parser.parseCodeBlock(content, 10);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('action');
			expect((result[0] as Action).content).toBe('The hero draws their sword');
			expect(result[0].lineNumber).toBe(10);
		});

		it('should parse oracle question lines', () => {
			const content = '? Is there danger ahead?';
			const result = parser.parseCodeBlock(content, 5);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('oracle_question');
			expect((result[0] as OracleQuestion).question).toBe('Is there danger ahead?');
		});

		it('should parse mechanics roll lines', () => {
			const content = 'd: 2d10 => Strong hit';
			const result = parser.parseCodeBlock(content, 0);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('mechanics_roll');
			const roll = result[0] as MechanicsRoll;
			expect(roll.roll).toBe('2d10');
			expect(roll.outcome).toBe('Strong hit');
			expect(roll.success).toBe(true);
		});

		it('should parse oracle result lines', () => {
			const content = '-> Yes, it attacks without warning';
			const result = parser.parseCodeBlock(content, 3);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('oracle_result');
			const oracleResult = result[0] as OracleResult;
			expect(oracleResult.answer).toBe('Yes, it attacks without warning');
		});

		it('should parse oracle result lines with roll', () => {
			const content = '-> (1d100: 45) A glowing mist swirls';
			const result = parser.parseCodeBlock(content, 7);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('oracle_result');
			const oracleResult = result[0] as OracleResult;
			expect(oracleResult.answer).toBe('A glowing mist swirls');
			expect(oracleResult.roll).toBe('1d100: 45');
		});

		it('should parse consequence lines', () => {
			const content = '=> The shadow drains life from the party';
			const result = parser.parseCodeBlock(content, 2);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('consequence');
			const consequence = result[0] as Consequence;
			expect(consequence.description).toBe('The shadow drains life from the party');
		});

		it('should parse table lookup lines', () => {
			const content = 'tbl: 1d100 => 45: A crumbling stone altar';
			const result = parser.parseCodeBlock(content, 4);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('table_lookup');
			const table = result[0] as TableLookup;
			expect(table.roll).toBe('1d100');
			expect(table.result).toBe('45: A crumbling stone altar');
		});

		it('should parse generator lines', () => {
			const content = 'gen: Mythic Name Generator 2d6 => Shadowfen';
			const result = parser.parseCodeBlock(content, 6);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('generator');
			const generator = result[0] as Generator;
			expect(generator.system).toBe('Mythic Name Generator 2d6');
			expect(generator.result).toBe('Shadowfen');
		});

		it('should parse meta note lines', () => {
			const content = '(note: Remember to track supply)';
			const result = parser.parseCodeBlock(content, 8);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('meta_note');
			const metaNote = result[0] as MetaNote;
			expect(metaNote.category).toBe('note');
			expect(metaNote.content).toBe('Remember to track supply');
		});

		it('should parse reflection meta notes', () => {
			const content = '(reflection: This encounter is going well)';
			const result = parser.parseCodeBlock(content, 9);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('meta_note');
			const metaNote = result[0] as MetaNote;
			expect(metaNote.category).toBe('reflection');
		});

		it('should parse text lines', () => {
			const content = 'The party continues their journey';
			const result = parser.parseCodeBlock(content, 1);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('text');
			const textLine = result[0] as TextLine;
			expect(textLine.content).toBe('The party continues their journey');
		});

		it('should parse mixed content', () => {
			const content = `> The hero draws their sword
? Is there danger ahead?
d: 2d10 => Strong hit
-> Yes, a monster approaches
=> The party must fight now`;

			const result = parser.parseCodeBlock(content, 10);

			expect(result).toHaveLength(5);
			expect(result[0].type).toBe('action');
			expect(result[1].type).toBe('oracle_question');
			expect(result[2].type).toBe('mechanics_roll');
			expect(result[3].type).toBe('oracle_result');
			expect(result[4].type).toBe('consequence');
		});

		it('should skip empty lines', () => {
			const content = `> First action

> Second action`;

			const result = parser.parseCodeBlock(content, 0);

			expect(result).toHaveLength(2);
		});

		it('should track line numbers correctly', () => {
			const content = `> Line 1
? Line 2
d: Line 3`;

			const result = parser.parseCodeBlock(content, 100);

			expect(result[0].lineNumber).toBe(100);
			expect(result[1].lineNumber).toBe(101);
			expect(result[2].lineNumber).toBe(102);
		});
	});

	describe('success determination', () => {
		it('should detect success from outcome', () => {
			const content = 'd: 2d10 => Success';
			const result = parser.parseCodeBlock(content, 0);
			expect((result[0] as MechanicsRoll).success).toBe(true);
		});

		it('should detect failure from outcome', () => {
			const content = 'd: 1d20 => Failed';
			const result = parser.parseCodeBlock(content, 0);
			expect((result[0] as MechanicsRoll).success).toBe(false);
		});

		it('should detect strong hit as success', () => {
			const content = 'd: 2d10 => Strong hit';
			const result = parser.parseCodeBlock(content, 0);
			expect((result[0] as MechanicsRoll).success).toBe(true);
		});

		it('should detect miss as failure', () => {
			const content = 'd: 2d10 => Miss';
			const result = parser.parseCodeBlock(content, 0);
			expect((result[0] as MechanicsRoll).success).toBe(false);
		});

		it('should return null when success cannot be determined', () => {
			const content = 'd: 2d10 => 5';
			const result = parser.parseCodeBlock(content, 0);
			expect((result[0] as MechanicsRoll).success).toBe(null);
		});
	});

	describe('edge cases', () => {
		it('should handle empty input', () => {
			const result = parser.parseCodeBlock('', 0);
			expect(result).toHaveLength(0);
		});

		it('should handle whitespace-only input', () => {
			const result = parser.parseCodeBlock('   \n  \n  ', 0);
			expect(result).toHaveLength(0);
		});

		it('should handle malformed meta notes as text', () => {
			const content = '(not a meta note)';
			const result = parser.parseCodeBlock(content, 0);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('text');
		});
	});
});
