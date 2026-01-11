import { describe, it, expect } from 'vitest';
import { TagExtractor } from '../../src/parser/TagExtractor';
import { Location } from '../../src/types/notation';

describe('TagExtractor', () => {
	const extractor = new TagExtractor();
	const mockLocation: Location = {
		file: 'test.md',
		lineNumber: 10,
		session: 'Session 1',
		scene: 'S1',
	};

	describe('extractNPCs', () => {
		it('should extract single NPC', () => {
			const content = '[N:Grim]';
			const result = extractor.extractNPCs(content, mockLocation);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Grim');
			expect(result[0].id).toBe('npc:grim');
			expect(result[0].tags).toEqual([]);
		});

		it('should extract NPC with tags', () => {
			const content = '[N:Grim|friendly|helpful]';
			const result = extractor.extractNPCs(content, mockLocation);

			expect(result).toHaveLength(1);
			expect(result[0].tags).toEqual(['friendly', 'helpful']);
		});

		it('should extract multiple NPCs', () => {
			const content = '[N:Grim] [N:Shadow|hostile]';
			const result = extractor.extractNPCs(content, mockLocation);

			expect(result).toHaveLength(2);
			expect(result[0].name).toBe('Grim');
			expect(result[1].name).toBe('Shadow');
		});
	});

	describe('extractLocations', () => {
		it('should extract single location', () => {
			const content = '[L:Dark Woods]';
			const result = extractor.extractLocations(content, mockLocation);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Dark Woods');
			expect(result[0].id).toBe('location:dark woods');
		});

		it('should extract location with tags', () => {
			const content = '[L:Forgotten Shrine|dangerous|magical]';
			const result = extractor.extractLocations(content, mockLocation);

			expect(result).toHaveLength(1);
			expect(result[0].tags).toEqual(['dangerous', 'magical']);
		});
	});

	describe('extractThreads', () => {
		it('should extract thread', () => {
			const content = '[Thread:Discover the source|Open]';
			const result = extractor.extractThreads(content, mockLocation);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Discover the source');
			expect(result[0].state).toBe('Open');
			expect(result[0].id).toBe('thread:discover the source');
		});

		it('should extract multiple threads', () => {
			const content = '[Thread:Quest 1|Open] [Thread:Quest 2|Closed]';
			const result = extractor.extractThreads(content, mockLocation);

			expect(result).toHaveLength(2);
			expect(result[0].state).toBe('Open');
			expect(result[1].state).toBe('Closed');
		});
	});

	describe('extractClocks', () => {
		it('should extract clock', () => {
			const content = '[Clock:Forest Ritual 3/6]';
			const result = extractor.extractClocks(content, mockLocation);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Forest Ritual');
			expect(result[0].current).toBe(3);
			expect(result[0].total).toBe(6);
			expect(result[0].id).toBe('clock:forest ritual');
		});
	});

	describe('extractTracks', () => {
		it('should extract track', () => {
			const content = '[Track:Explore the Woods 2/4]';
			const result = extractor.extractTracks(content, mockLocation);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Explore the Woods');
			expect(result[0].current).toBe(2);
			expect(result[0].total).toBe(4);
		});
	});

	describe('extractTimers', () => {
		it('should extract timer', () => {
			const content = '[Timer:Escape Timer 5]';
			const result = extractor.extractTimers(content, mockLocation);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Escape Timer');
			expect(result[0].value).toBe(5);
		});
	});

	describe('extractEvents', () => {
		it('should extract event', () => {
			const content = '[E:Moon Phase 1/8]';
			const result = extractor.extractEvents(content, mockLocation);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Moon Phase');
			expect(result[0].current).toBe(1);
			expect(result[0].total).toBe(8);
		});
	});

	describe('extractPlayerCharacters', () => {
		it('should extract player character', () => {
			const content = '[PC:Elara|warrior|brave]';
			const result = extractor.extractPlayerCharacters(content, mockLocation);

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe('Elara');
			expect(result[0].id).toBe('pc:elara');
			expect(result[0].tags).toEqual(['warrior', 'brave']);
		});
	});

	describe('extractTags', () => {
		it('should extract all tag types', () => {
			const content = `[N:Grim|friendly]
[L:Dark Woods]
[Thread:Discover the source|Open]
[Clock:Forest Ritual 3/6]
[Track:Explore the Woods 2/4]
[Timer:Escape Timer 5]
[E:Moon Phase 1/8]
[PC:Elara|warrior|brave]`;

			const result = extractor.extractTags(content, mockLocation);

			expect(result.npcs).toHaveLength(1);
			expect(result.locations).toHaveLength(1);
			expect(result.threads).toHaveLength(1);
			expect(result.clocks).toHaveLength(1);
			expect(result.tracks).toHaveLength(1);
			expect(result.timers).toHaveLength(1);
			expect(result.events).toHaveLength(1);
			expect(result.playerCharacters).toHaveLength(1);
		});
	});

	describe('extractReferences', () => {
		it('should extract NPC references', () => {
			const content = '[#N:Grim]';
			const result = extractor.extractReferences(content);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('npc');
			expect(result[0].name).toBe('Grim');
		});

		it('should extract location references', () => {
			const content = '[#L:Dark Woods]';
			const result = extractor.extractReferences(content);

			expect(result).toHaveLength(1);
			expect(result[0].type).toBe('location');
			expect(result[0].name).toBe('Dark Woods');
		});

		it('should extract multiple references', () => {
			const content = '[#N:Grim] [#L:Dark Woods] [#N:Shadow]';
			const result = extractor.extractReferences(content);

			expect(result).toHaveLength(3);
		});

		it('should return empty array for no references', () => {
			const content = 'Just regular text';
			const result = extractor.extractReferences(content);

			expect(result).toHaveLength(0);
		});
	});

	describe('isReference', () => {
		it('should detect NPC reference', () => {
			const content = '[#N:Grim]';
			expect(extractor.isReference(content)).toBe(true);
		});

		it('should detect location reference', () => {
			const content = '[#L:Dark Woods]';
			expect(extractor.isReference(content)).toBe(true);
		});

		it('should not detect regular tags as references', () => {
			const content = '[N:Grim]';
			expect(extractor.isReference(content)).toBe(false);
		});

		it('should not detect plain text as reference', () => {
			const content = 'Just regular text';
			expect(extractor.isReference(content)).toBe(false);
		});
	});

	describe('edge cases', () => {
		it('should handle empty content', () => {
			const result = extractor.extractTags('', mockLocation);
			expect(result.npcs).toHaveLength(0);
			expect(result.locations).toHaveLength(0);
		});

		it('should handle malformed tags', () => {
			const content = '[N:] [L:] [Thread:]';
			const result = extractor.extractTags(content, mockLocation);

			expect(result.npcs).toHaveLength(0);
			expect(result.locations).toHaveLength(0);
		});

		it('should handle tags with whitespace', () => {
			const content = '[N:  Grim  |  friendly  ]';
			const result = extractor.extractTags(content, mockLocation);

			expect(result.npcs).toHaveLength(1);
			expect(result.npcs[0].name).toBe('Grim');
			expect(result.npcs[0].tags).toEqual(['friendly']);
		});
	});
});
