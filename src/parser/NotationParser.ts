import { App, TFile, parseYaml } from 'obsidian';
import { Campaign, Session, Scene, Location, NPC, LocationTag, Thread, Reference, PlayerCharacter } from '../types/notation';
import { CodeBlockParser } from './CodeBlockParser';
import { TagExtractor } from './TagExtractor';
import { ProgressParser } from './ProgressParser';

/**
 * Main parser for Solo RPG Notation campaign files
 */
export class NotationParser {
	private app: App | undefined;
	private codeBlockParser: CodeBlockParser;
	private tagExtractor: TagExtractor;
	private progressParser: ProgressParser;

	constructor(app?: App) {
		this.app = app;
		this.codeBlockParser = new CodeBlockParser();
		this.tagExtractor = new TagExtractor();
		this.progressParser = new ProgressParser();
	}

	/**
	 * Parse a complete campaign file (async to support linked sessions)
	 */
	async parseCampaignFile(content: string, filePath: string): Promise<Campaign> {
		// Extract YAML frontmatter
		const frontMatter = this.extractFrontMatter(content);

		// Extract title from frontmatter or H1
		const title = frontMatter.title || this.extractTitle(content);

		// Parse sessions (both inline and linked)
		const sessions = await this.parseSessions(content, filePath);

		// Collect all tags across all sessions
		const allTags = this.collectAllTags(sessions, filePath);

		// Build campaign object
		const campaign: Campaign = {
			file: filePath,
			title,
			frontMatter,
			sessions,
			npcs: this.mergeNPCs(allTags.npcs),
			locations: this.mergeLocations(allTags.locations),
			threads: this.mergeThreads(allTags.threads),
			clocks: this.progressParser.mergeClocks(allTags.clocks),
			tracks: this.progressParser.mergeTracks(allTags.tracks),
			timers: this.progressParser.mergeTimers(allTags.timers),
			events: this.progressParser.mergeEvents(allTags.events),
			playerCharacters: this.mergePlayerCharacters(allTags.playerCharacters),
			references: this.mergeReferences(allTags.references),
		};

		return campaign;
	}

	/**
	 * Extract YAML frontmatter
	 */
	private extractFrontMatter(content: string): Record<string, any> {
		const match = content.match(/^---\n([\s\S]*?)\n---/);
		if (!match) return {};

		try {
			return parseYaml(match[1]) || {};
		} catch (error) {
			console.error('Error parsing YAML frontmatter:', error);
			return {};
		}
	}

	/**
	 * Extract title from H1 heading
	 */
	private extractTitle(content: string): string {
		const match = content.match(/^#\s+(.+)$/m);
		return match ? match[1].trim() : 'Untitled Campaign';
	}

	/**
	 * Parse all sessions (inline and linked) in the content
	 */
	private async parseSessions(content: string, filePath: string): Promise<Session[]> {
		const sessions: Session[] = [];
		const lines = content.split('\n');

		// First pass: detect all session links
		const sessionLinks = this.extractSessionLinks(content, filePath);
    console.log('sessionLinks', sessionLinks)

		let currentSession: Session | null = null;
		let currentSessionContent: string[] = [];
		let sessionStartLine = 0;
		let currentLineNumber = 0;

		while (currentLineNumber < lines.length) {
			const line = lines[currentLineNumber];

			// Check for inline session header (## Session N)
			const sessionMatch = line.match(/^##\s+Sessione?\s+(\d+)/i);

			// Check for session link (but only if not already in an inline session)
			const linkMatch = currentSession === null ? sessionLinks.find(
				l => l.lineNumber === currentLineNumber
			) : undefined;

			if (sessionMatch) {
				// Save previous session
				if (currentSession) {
					currentSession.scenes = this.parseScenes(
						currentSessionContent.join('\n'),
						filePath,
						sessionStartLine
					);
					currentSession.endLine = currentLineNumber - 1;
					sessions.push(currentSession);
				}

				// Start new inline session
				const sessionNumber = parseInt(sessionMatch[1]);
				sessionStartLine = currentLineNumber;
				currentSessionContent = [];

				const metadata = this.parseSessionMetadata(lines[currentLineNumber + 1] || '');

				currentSession = {
					number: sessionNumber,
					date: metadata.get('Date'),
					duration: metadata.get('Duration'),
					recap: metadata.get('Recap'),
					goals: metadata.get('Goals'),
					scenes: [],
					startLine: currentLineNumber,
					endLine: currentLineNumber,
					metadata,
				};
				currentLineNumber++;
			} else if (linkMatch && !currentSession) {
				// Parse linked session
				if (linkMatch.linkedFilePath) {
					const linkedSession = await this.parseSessionFile(linkMatch.linkedFilePath, linkMatch.sessionNumber);
					if (linkedSession) {
						linkedSession.startLine = linkMatch.lineNumber;
						linkedSession.endLine = linkMatch.lineNumber;
						sessions.push(linkedSession);
					} else {
						console.warn(`Could not parse linked session: ${linkMatch.linkText}`);
					}
				} else {
					console.warn(`Could not resolve session link: ${linkMatch.linkText}`);
				}
				currentLineNumber++;
			} else if (currentSession) {
				// Collect content for inline session
				currentSessionContent.push(line);
				currentLineNumber++;
			} else {
				currentLineNumber++;
			}
		}

		// Save last inline session
		if (currentSession) {
			currentSession.scenes = this.parseScenes(
				currentSessionContent.join('\n'),
				filePath,
				sessionStartLine
			);
			currentSession.endLine = lines.length - 1;
			sessions.push(currentSession);
		}

		// Sort sessions by number
		sessions.sort((a, b) => a.number - b.number);

		return sessions;
	}

	/**
	 * Parse session metadata from the line after session header
	 */
	private parseSessionMetadata(line: string): Map<string, string> {
		const metadata = new Map<string, string>();

		// Parse *Date: ... | Duration: ...*
		const inlineMatch = line.match(/\*([^*]+)\*/);
		if (inlineMatch) {
			const pairs = inlineMatch[1].split('|');
			for (const pair of pairs) {
				const [key, value] = pair.split(':').map(s => s.trim());
				if (key && value) {
					metadata.set(key, value);
				}
			}
		}

		return metadata;
	}

	/**
	 * Detect session links in content (e.g., [[Session 3]], [[Session 3|The Dungeon]])
	 */
	private extractSessionLinks(content: string, basePath: string): Array<{
		lineNumber: number;
		sessionNumber: number;
		linkText: string;
		linkedFilePath?: string;
	}> {
		const links: Array<{
			lineNumber: number;
			sessionNumber: number;
			linkText: string;
			linkedFilePath?: string;
		}> = [];

		const lines = content.split('\n');
		const wikilinkPattern = /\[\[([^\]]+)\]\]/g;
		const sessionPattern = /(?:^|\/)(Session|Sessione)\s+(\d+)/i;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			let match;

			wikilinkPattern.lastIndex = 0;

			while ((match = wikilinkPattern.exec(line)) !== null) {
				const fullLink = match[0];
				const linkContent = match[1];

				let linkPath = linkContent;
				let linkAlias: string | undefined;

				const pipeIndex = linkContent.indexOf('|');
				if (pipeIndex !== -1) {
					linkPath = linkContent.slice(0, pipeIndex);
					linkAlias = linkContent.slice(pipeIndex + 1);
				}

				const pathMatch = sessionPattern.exec(linkPath);
				const aliasMatch = linkAlias ? sessionPattern.exec(linkAlias) : null;

				if (pathMatch || aliasMatch) {
					const sessionMatch = pathMatch || aliasMatch;
					const sessionNumber = parseInt(sessionMatch![2]);

					let linkedFilePath: string | undefined;
					if (this.app) {
						const linkedFile = this.app.metadataCache.getFirstLinkpathDest(linkPath, basePath);
						if (linkedFile) {
							linkedFilePath = linkedFile.path;
						}
					}

					links.push({
						lineNumber: i,
						sessionNumber,
						linkText: fullLink,
						linkedFilePath,
					});
				}
			}
		}

		return links;
	}

	/**
	 * Parse a standalone session file (linked note)
	 */
	private async parseSessionFile(filePath: string, sessionNumber: number): Promise<Session | null> {
		try {
			if (!this.app) {
				console.warn('No app instance available, cannot parse linked session file:', filePath);
				return null;
			}

			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (!file || !(file instanceof TFile)) {
				console.warn('Linked session file not found or is not a file:', filePath);
				return null;
			}

			const content = await this.app.vault.read(file);

			// Parse metadata from first few lines
			const lines = content.split('\n');
			const metadata = this.parseSessionMetadata(lines[0] || '');

			// Check for explicit recap and goals fields
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				const recapMatch = line.match(/^\*\*Recap:\*\*\s*(.+)$/i);
				if (recapMatch) {
					metadata.set('Recap', recapMatch[1].trim());
				}
				const goalsMatch = line.match(/^\*\*Goals:\*\*\s*(.+)$/i);
				if (goalsMatch) {
					metadata.set('Goals', goalsMatch[1].trim());
				}
			}

			// Parse scenes (session file contains only scenes, no session header)
			const scenes = this.parseScenes(content, filePath, 0);

			return {
				number: sessionNumber,
				date: metadata.get('Date'),
				duration: metadata.get('Duration'),
				recap: metadata.get('Recap'),
				goals: metadata.get('Goals'),
				scenes,
				startLine: 0,
				endLine: lines.length - 1,
				metadata,
				linkedFile: filePath,
			};
		} catch (error) {
			console.error('Error parsing linked session file:', filePath, error);
			return null;
		}
	}

	/**
	 * Parse scenes within a session
	 */
	private parseScenes(content: string, filePath: string, baseLineNumber: number): Scene[] {
		const scenes: Scene[] = [];
		const lines = content.split('\n');

		let currentScene: Scene | null = null;
		let currentSceneContent: string[] = [];
		let sceneStartLine = 0;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			// Check for scene header (### S1, S2a, T1-S3, etc.)
			const sceneMatch = line.match(/^###\s+(S[\w.-]+|\w+-S[\w.-]+)\s*\*?([^*]*)\*?/);
			if (sceneMatch) {
				// Save previous scene
				if (currentScene) {
					currentScene.elements = this.parseSceneContent(
						currentSceneContent.join('\n'),
						filePath,
						baseLineNumber + sceneStartLine
					);
					currentScene.endLine = baseLineNumber + i - 1;
					scenes.push(currentScene);
				}

				// Start new scene
				const sceneNumber = sceneMatch[1];
				const context = sceneMatch[2]?.trim() || undefined;
				sceneStartLine = i;
				currentSceneContent = [];

				currentScene = {
					id: sceneNumber,
					number: sceneNumber,
					context,
					startLine: baseLineNumber + i,
					endLine: baseLineNumber + i,
					elements: [],
				};
			} else if (currentScene) {
				currentSceneContent.push(line);
			}
		}

		// Save last scene
		if (currentScene) {
			currentScene.elements = this.parseSceneContent(
				currentSceneContent.join('\n'),
				filePath,
				baseLineNumber + sceneStartLine
			);
			currentScene.endLine = baseLineNumber + lines.length - 1;
			scenes.push(currentScene);
		}

		return scenes;
	}

	/**
	 * Parse scene content (find code blocks and parse notation)
	 */
	private parseSceneContent(content: string, filePath: string, baseLineNumber: number) {
		const elements: any[] = [];
		const lines = content.split('\n');

		let inCodeBlock = false;
		let codeBlockContent: string[] = [];
		let codeBlockStartLine = 0;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			if (line.trim() === '```') {
				if (inCodeBlock) {
					// End of code block - parse it
					const parsed = this.codeBlockParser.parseCodeBlock(
						codeBlockContent.join('\n'),
						baseLineNumber + codeBlockStartLine
					);
					elements.push(...parsed);
					codeBlockContent = [];
					inCodeBlock = false;
				} else {
					// Start of code block
					inCodeBlock = true;
					codeBlockStartLine = i + 1;
				}
			} else if (inCodeBlock) {
				codeBlockContent.push(line);
			}
		}

		return elements;
	}

	/**
	 * Collect all tags from all sessions
	 */
	private collectAllTags(sessions: Session[], filePath: string) {
		const allNPCs: NPC[] = [];
		const allLocations: LocationTag[] = [];
		const allThreads: Thread[] = [];
		const allClocks: any[] = [];
		const allTracks: any[] = [];
		const allTimers: any[] = [];
		const allEvents: any[] = [];
		const allPCs: any[] = [];
		const allReferences: Reference[] = [];

		for (const session of sessions) {
			for (const scene of session.scenes) {
				for (const element of scene.elements) {
					const location: Location = {
						file: filePath,
						lineNumber: element.lineNumber,
						session: `Session ${session.number}`,
						scene: scene.number,
					};

					// Extract content based on element type
					let contentToScan = '';
					if (element.type === 'action') {
						contentToScan = element.content;
					} else if (element.type === 'oracle_question') {
						contentToScan = element.question;
					} else if (element.type === 'mechanics_roll') {
						contentToScan = element.roll + ' ' + element.outcome;
					} else if (element.type === 'oracle_result') {
						contentToScan = element.answer;
					} else if (element.type === 'consequence') {
						contentToScan = element.description;
					} else if (element.type === 'text') {
						// Bare tags, dialogue, narrative, etc.
						contentToScan = element.content;
					} else if (element.type === 'table_lookup') {
						// Extract tags from table result
						contentToScan = element.result;
					} else if (element.type === 'generator') {
						// Extract tags from generator result
						contentToScan = element.result;
					} else if (element.type === 'meta_note') {
						// Don't extract tags from meta notes (out-of-character)
						continue;
					}

					// Extract tags from content
					if (contentToScan) {
						const tags = this.tagExtractor.extractTags(contentToScan, location);
						allNPCs.push(...tags.npcs);
						allLocations.push(...tags.locations);
						allThreads.push(...tags.threads);
						allClocks.push(...tags.clocks);
						allTracks.push(...tags.tracks);
						allTimers.push(...tags.timers);
						allEvents.push(...tags.events);
						allPCs.push(...tags.playerCharacters);

						// Extract references
						const refs = this.tagExtractor.extractReferences(contentToScan);
						for (const ref of refs) {
							allReferences.push({
								id: ref.name,
								name: ref.name,
								type: ref.type,
								firstMention: location,
								mentions: [location],
							});

							// Also add references as mentions to NPCs/Locations
							if (ref.type === 'npc') {
								allNPCs.push({
									id: `npc:${ref.name.toLowerCase()}`,
									name: ref.name,
									tags: [],
									firstMention: location,
									mentions: [location],
								});
							} else if (ref.type === 'location') {
								allLocations.push({
									id: `location:${ref.name.toLowerCase()}`,
									name: ref.name,
									tags: [],
									firstMention: location,
									mentions: [location],
								});
							}
						}
					}
				}
			}
		}

		return {
			npcs: allNPCs,
			locations: allLocations,
			threads: allThreads,
			clocks: allClocks,
			tracks: allTracks,
			timers: allTimers,
			events: allEvents,
			playerCharacters: allPCs,
			references: allReferences,
		};
	}

	/**
	 * Get the key portion of a tag (name before '=' if present)
	 */
	private getTagKey(tag: string): string {
		const equalsIndex = tag.indexOf('=');
		return equalsIndex !== -1 ? tag.slice(0, equalsIndex) : tag;
	}

	/**
	 * Merge NPCs (combine mentions of same NPC)
	 */
	private mergeNPCs(npcs: NPC[]): Map<string, NPC> {
		const merged = new Map<string, NPC>();

		for (const npc of npcs) {
			const existing = merged.get(npc.id);
			if (existing) {
				for (const tag of npc.tags) {
					if (tag.startsWith('-')) {
						const tagToRemove = tag.slice(1);
						existing.tags = existing.tags.filter(t => t !== tagToRemove);
					} else {
						const newTagKey = this.getTagKey(tag);
						if (newTagKey !== tag) {
							existing.tags = existing.tags.filter(t => this.getTagKey(t) !== newTagKey);
						}
						if (!existing.tags.includes(tag)) {
							existing.tags.push(tag);
						}
					}
				}
				existing.mentions.push(...npc.mentions);
			} else {
				merged.set(npc.id, { ...npc });
			}
		}

		return merged;
	}

	/**
	 * Merge Locations
	 */
	private mergeLocations(locations: LocationTag[]): Map<string, LocationTag> {
		const merged = new Map<string, LocationTag>();

		for (const loc of locations) {
			const existing = merged.get(loc.id);
			if (existing) {
				for (const tag of loc.tags) {
					if (tag.startsWith('-')) {
						const tagToRemove = tag.slice(1);
						existing.tags = existing.tags.filter(t => t !== tagToRemove);
					} else {
						const newTagKey = this.getTagKey(tag);
						if (newTagKey !== tag) {
							existing.tags = existing.tags.filter(t => this.getTagKey(t) !== newTagKey);
						}
						if (!existing.tags.includes(tag)) {
							existing.tags.push(tag);
						}
					}
				}
				existing.mentions.push(...loc.mentions);
			} else {
				merged.set(loc.id, { ...loc });
			}
		}

		return merged;
	}

	/**
	 * Merge Threads
	 */
	private mergeThreads(threads: Thread[]): Map<string, Thread> {
		const merged = new Map<string, Thread>();

		for (const thread of threads) {
			const existing = merged.get(thread.id);
			if (existing) {
				// Update state to latest
				existing.state = thread.state;
				existing.mentions.push(...thread.mentions);
			} else {
				merged.set(thread.id, { ...thread });
			}
		}

		return merged;
	}

	/**
	 * Merge Player Characters
	 */
	private mergePlayerCharacters(pcs: PlayerCharacter[]): Map<string, PlayerCharacter> {
		const merged = new Map<string, PlayerCharacter>();

		for (const pc of pcs) {
			const existing = merged.get(pc.id);
			if (existing) {
				for (const tag of pc.tags) {
					if (tag.startsWith('-')) {
						const tagToRemove = tag.slice(1);
						existing.tags = existing.tags.filter((t: string) => t !== tagToRemove);
					} else {
						const newTagKey = this.getTagKey(tag);
						if (newTagKey !== tag) {
							existing.tags = existing.tags.filter((t: string) => this.getTagKey(t) !== newTagKey);
						}
						if (!existing.tags.includes(tag)) {
							existing.tags.push(tag);
						}
					}
				}
				existing.mentions.push(...pc.mentions);
			} else {
				merged.set(pc.id, { ...pc });
			}
		}

		return merged;
	}

	/**
	 * Merge References
	 */
	private mergeReferences(references: Reference[]): Map<string, Reference> {
		const merged = new Map<string, Reference>();

		for (const ref of references) {
			const key = `${ref.type}:${ref.id}`;
			const existing = merged.get(key);
			if (existing) {
				existing.mentions.push(...ref.mentions);
			} else {
				merged.set(key, { ...ref });
			}
		}

		return merged;
	}
}
