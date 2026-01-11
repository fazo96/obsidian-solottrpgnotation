import { ItemView, WorkspaceLeaf, TFile, Notice } from 'obsidian';
import { NotationIndexer } from '../indexer/NotationIndexer';
import { Campaign, NPC, LocationTag, Thread, Reference, PlayerCharacter, Clock, Track, Timer, Event, Location, TableLookup, Generator, MetaNote } from '../types/notation';
import { ProgressParser } from '../parser/ProgressParser';
import { SoloRPGSettings } from '../settings';

export const VIEW_TYPE_DASHBOARD = 'solo-rpg-dashboard';

type ScreenType = 'campaigns' | 'elements';
type ElementType = 'All' | 'PC' | 'NPC' | 'Location' | 'Thread' | 'Clock' | 'Track' | 'Timer' | 'Event' | 'MetaNote' | 'TableLookup' | 'Generator' | 'Reference';

interface RandomEvent {
	type: 'table' | 'generator';
	data: TableLookup | Generator;
	location: Location;
	eventType: string;
	session: string;
	scene: string;
}

interface MetaNoteWithContext {
	note: MetaNote;
	location: Location;
	session: string;
	scene: string;
}

interface ElementCardData {
	elementType: ElementType;
	data: PlayerCharacter | NPC | LocationTag | Thread | Clock | Track | Timer | Event | MetaNoteWithContext | RandomEvent | Reference;
}

export class DashboardView extends ItemView {
	indexer: NotationIndexer;
	settings: SoloRPGSettings;
	progressParser: ProgressParser;
	private currentScreen: ScreenType = 'campaigns';
	private selectedCampaign: Campaign | null = null;
	private currentElementType: ElementType = 'All';
	private searchQuery: string = '';
	private refreshInterval: number | null = null;
	private searchInput: HTMLInputElement | null = null;
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(leaf: WorkspaceLeaf, indexer: NotationIndexer, settings: SoloRPGSettings) {
		super(leaf);
		this.indexer = indexer;
		this.settings = settings;
		this.progressParser = new ProgressParser();
	}

	getViewType(): string {
		return VIEW_TYPE_DASHBOARD;
	}

	getDisplayText(): string {
		return 'Campaign Dashboard';
	}

	getIcon(): string {
		return 'dice';
	}

	async onOpen() {
		await this.render();
	}

	async onClose() {
		if (this.refreshInterval !== null) {
			window.clearInterval(this.refreshInterval);
		}
	}

	async render() {
		const container = this.containerEl.children[1] as HTMLElement;
		const wasSearchFocused = this.searchInput === document.activeElement;
		container.empty();
		container.addClass('solo-rpg-container');

		if (this.currentScreen === 'campaigns') {
			this.renderCampaignScreen(container);
		} else {
			this.renderElementsScreen(container);
		}

		if (wasSearchFocused && this.searchInput) {
			this.searchInput.focus();
		}
	}

	private renderCampaignScreen(container: HTMLElement) {
		const header = container.createDiv({ cls: 'solo-rpg-header' });
		header.createEl('h2', { text: 'Solo RPG Campaigns', cls: 'solo-rpg-title' });

		const refreshBtn = header.createEl('button', {
			text: '🔄 Refresh',
			cls: 'solo-rpg-button',
		});
		refreshBtn.addEventListener('click', () => this.render());

		const campaigns = this.indexer.getAllCampaigns();

		if (campaigns.length === 0) {
			this.renderEmptyState(container);
			return;
		}

		const listContainer = container.createDiv({ cls: 'solo-rpg-campaign-list' });

		for (const campaign of campaigns) {
			this.renderCampaignCard(listContainer, campaign);
		}

		this.renderSummaryStats(container, campaigns);
	}

	private renderElementsScreen(container: HTMLElement) {
		if (!this.selectedCampaign) {
			this.currentScreen = 'campaigns';
			this.render();
			return;
		}

		const header = container.createDiv({ cls: 'solo-rpg-header' });

		const backBtn = header.createEl('button', {
			text: '← Back to Campaigns',
			cls: 'solo-rpg-button',
		});
		backBtn.addEventListener('click', () => {
			this.currentScreen = 'campaigns';
			this.selectedCampaign = null;
			this.currentElementType = 'All';
			this.searchQuery = '';
			this.render();
		});

		header.createEl('h2', { text: this.selectedCampaign.title, cls: 'solo-rpg-title' });

		const refreshBtn = header.createEl('button', { text: '↻ Refresh' });
		refreshBtn.addEventListener('click', () => this.render());

		this.renderElementFilters(container);
		this.renderElementsList(container);
	}

	private renderElementFilters(container: HTMLElement) {
		const panel = container.createDiv({ cls: 'solo-rpg-filter-panel' });

		const searchContainer = panel.createDiv({ cls: 'solo-rpg-search-container' });
		const searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Search elements...',
			value: this.searchQuery,
		});
		this.searchInput = searchInput;
		searchInput.addEventListener('input', (e) => {
			this.searchQuery = (e.target as HTMLInputElement).value;

			if (this.debounceTimer) {
				clearTimeout(this.debounceTimer);
			}

			this.debounceTimer = setTimeout(() => {
				this.render();
			}, 300);
		});

		const typeFilters = panel.createDiv({ cls: 'solo-rpg-type-filters' });
		const types: ElementType[] = ['All', 'PC', 'NPC', 'Location', 'Thread', 'Clock', 'Track', 'Timer', 'Event', 'MetaNote', 'TableLookup', 'Generator', 'Reference'];
		for (const type of types) {
			const chip = typeFilters.createDiv({
				cls: `solo-rpg-type-chip ${this.currentElementType === type ? 'active' : ''}`,
				text: type === 'TableLookup' ? 'Tables' : type,
			});
			chip.addEventListener('click', () => {
				this.currentElementType = type;
				this.render();
			});
		}
	}

	private renderElementsList(container: HTMLElement) {
		if (!this.selectedCampaign) return;

		const elements = this.getFilteredElements();
		const list = container.createDiv({ cls: 'solo-rpg-element-list' });

		if (elements.length === 0) {
			this.renderEmptyElementsState(container);
			return;
		}

		for (const element of elements) {
			this.renderElementCard(list, element);
		}
	}

	private renderElementCard(container: HTMLElement, element: ElementCardData) {
		switch (element.elementType) {
			case 'PC':
				this.renderPCCard(container, element.data as PlayerCharacter);
				break;
			case 'NPC':
				this.renderNPCCard(container, element.data as NPC);
				break;
			case 'Location':
				this.renderLocationCard(container, element.data as LocationTag);
				break;
			case 'Thread':
				this.renderThreadCard(container, element.data as Thread);
				break;
			case 'Clock':
			case 'Event':
				this.renderClockCard(container, element.data as Clock | Event);
				break;
			case 'Track':
				this.renderTrackCard(container, element.data as Track);
				break;
			case 'Timer':
				this.renderTimerCard(container, element.data as Timer);
				break;
			case 'MetaNote':
				this.renderMetaNoteCard(container, element.data as MetaNoteWithContext);
				break;
			case 'TableLookup':
			case 'Generator':
				this.renderRandomEventCard(container, element.data as RandomEvent);
				break;
			case 'Reference':
				this.renderReferenceCard(container, element.data as Reference);
				break;
		}
	}

	private renderCampaignCard(container: HTMLElement, campaign: Campaign) {
		const card = container.createDiv({ cls: 'solo-rpg-campaign-card' });
		card.addEventListener('click', () => {
			this.selectedCampaign = campaign;
			this.currentScreen = 'elements';
			this.render();
		});

		card.createEl('div', {
			text: campaign.title,
			cls: 'solo-rpg-campaign-title',
		});

		const stats = this.indexer.getCampaignStats(campaign.file);
		if (stats) {
			const statsContainer = card.createDiv({ cls: 'solo-rpg-campaign-stats' });

			this.createStat(statsContainer, '📅', `${stats.totalSessions} sessions`);
			this.createStat(statsContainer, '🎬', `${stats.totalScenes} scenes`);
			this.createStat(statsContainer, '👥', `${stats.totalNPCs} NPCs`);
			this.createStat(statsContainer, '📍', `${stats.totalLocations} locations`);
			this.createStat(statsContainer, '🧵', `${stats.activeThreads} active threads`);

			if (stats.totalProgressElements > 0) {
				this.createStat(statsContainer, '⏱️', `${stats.totalProgressElements} trackers`);
			}

			if (stats.totalTableLookups > 0) {
				this.createStat(statsContainer, '🎲', `${stats.totalTableLookups} tables`);
			}
			if (stats.totalGenerators > 0) {
				this.createStat(statsContainer, '⚙️', `${stats.totalGenerators} generators`);
			}
			if (stats.totalMetaNotes > 0) {
				this.createStat(statsContainer, '📝', `${stats.totalMetaNotes} notes`);
			}
		}

		const metadata = card.createDiv({ cls: 'solo-rpg-campaign-meta' });
		if (campaign.frontMatter.ruleset) {
			metadata.createEl('span', {
				text: `System: ${campaign.frontMatter.ruleset}`,
			});
		}
		if (campaign.frontMatter.genre) {
			metadata.createEl('span', {
				text: ` | Genre: ${campaign.frontMatter.genre}`,
			});
		}
		if (campaign.frontMatter.last_update) {
			metadata.createEl('span', {
				text: ` | Updated: ${campaign.frontMatter.last_update}`,
			});
		}
	}

	private createStat(container: HTMLElement, icon: string, text: string) {
		const stat = container.createDiv({ cls: 'solo-rpg-campaign-stat' });
		stat.createSpan({ text: icon });
		stat.createSpan({ text: ` ${text}` });
	}

	private renderSummaryStats(container: HTMLElement, campaigns: Campaign[]) {
		const summary = container.createDiv({ cls: 'solo-rpg-summary' });
		summary.createEl('h3', { text: 'Vault Summary' });

		const totalNPCs = this.indexer.getAllNPCs().length;
		const totalLocations = this.indexer.getAllLocations().length;
		const totalThreads = this.indexer.getAllThreads().length;
		const activeThreads = this.indexer.getActiveThreads().length;
		const totalProgress = this.indexer.getAllProgressElements().length;

		const statsGrid = summary.createDiv({ cls: 'solo-rpg-stats-grid' });

		this.createStatBox(statsGrid, '🎲', campaigns.length.toString(), 'Campaigns');
		this.createStatBox(statsGrid, '👥', totalNPCs.toString(), 'NPCs');
		this.createStatBox(statsGrid, '📍', totalLocations.toString(), 'Locations');
		this.createStatBox(
			statsGrid,
			'🧵',
			`${activeThreads}/${totalThreads}`,
			'Active Threads'
		);
		this.createStatBox(statsGrid, '⏱️', totalProgress.toString(), 'Trackers');
	}

	private createStatBox(
		container: HTMLElement,
		icon: string,
		value: string,
		label: string
	) {
		const box = container.createDiv({ cls: 'solo-rpg-stat-box' });
		box.createDiv({ text: icon, cls: 'solo-rpg-stat-icon' });
		box.createDiv({ text: value, cls: 'solo-rpg-stat-value' });
		box.createDiv({ text: label, cls: 'solo-rpg-stat-label' });
	}

	private renderEmptyState(container: HTMLElement) {
		const empty = container.createDiv({ cls: 'solo-rpg-empty' });
		empty.createDiv({ text: '🎲', cls: 'solo-rpg-empty-icon' });
		empty.createEl('p', {
			text: 'No campaigns found',
			cls: 'solo-rpg-empty-text',
		});
		empty.createEl('p', {
			text: 'Create a new campaign file or use "Insert Campaign Template" to get started',
		});
		empty.createEl('p', {
			text: 'Check out the examples/ folder in the plugin directory for inspiration!',
			cls: 'solo-rpg-empty-hint',
		});
	}

	private renderEmptyElementsState(container: HTMLElement) {
		const empty = container.createDiv({ cls: 'solo-rpg-empty-state' });
		empty.createEl('p', { text: 'No elements found matching the current filters.' });
		empty.createEl('p', { text: 'Try adjusting your filters or add game elements to your campaign.' });
	}

	private getFilteredElements(): ElementCardData[] {
		if (!this.selectedCampaign) return [];

		const campaign = this.selectedCampaign;
		let rawElements: (PlayerCharacter | NPC | LocationTag | Thread | Clock | Track | Timer | Event | MetaNoteWithContext | RandomEvent | Reference)[] = [];

		switch (this.currentElementType) {
			case 'PC':
				rawElements = Array.from(campaign.playerCharacters.values());
				break;
			case 'NPC':
				rawElements = Array.from(campaign.npcs.values());
				break;
			case 'Location':
				rawElements = Array.from(campaign.locations.values());
				break;
			case 'Thread':
				rawElements = Array.from(campaign.threads.values());
				break;
			case 'Clock':
				rawElements = Array.from(campaign.clocks.values());
				break;
			case 'Track':
				rawElements = Array.from(campaign.tracks.values());
				break;
			case 'Timer':
				rawElements = Array.from(campaign.timers.values());
				break;
			case 'Event':
				rawElements = Array.from(campaign.events.values());
				break;
			case 'MetaNote':
				rawElements = this.getMetaNotes();
				break;
			case 'TableLookup':
			case 'Generator':
				rawElements = this.getRandomEvents();
				break;
			case 'Reference':
				rawElements = Array.from(campaign.references.values());
				break;
			case 'All':
				return this.getAllElements();
		}

		const elements = this.wrapElements(rawElements, this.currentElementType);

		if (this.searchQuery) {
			const query = this.searchQuery.toLowerCase();
			return elements.filter(e => this.elementMatchesSearch(e, query));
		}

		return elements.sort((a, b) => this.sortByLastSeen(a, b));
	}

	private getAllElements(): ElementCardData[] {
		if (!this.selectedCampaign) return [];

		const campaign = this.selectedCampaign;
		const elements: ElementCardData[] = [];

		Array.from(campaign.playerCharacters.values()).forEach(e => elements.push({ elementType: 'PC', data: e }));
		Array.from(campaign.npcs.values()).forEach(e => elements.push({ elementType: 'NPC', data: e }));
		Array.from(campaign.locations.values()).forEach(e => elements.push({ elementType: 'Location', data: e }));
		Array.from(campaign.threads.values()).forEach(e => elements.push({ elementType: 'Thread', data: e }));
		Array.from(campaign.clocks.values()).forEach(e => elements.push({ elementType: 'Clock', data: e }));
		Array.from(campaign.tracks.values()).forEach(e => elements.push({ elementType: 'Track', data: e }));
		Array.from(campaign.timers.values()).forEach(e => elements.push({ elementType: 'Timer', data: e }));
		Array.from(campaign.events.values()).forEach(e => elements.push({ elementType: 'Event', data: e }));
		Array.from(campaign.references.values()).forEach(e => elements.push({ elementType: 'Reference', data: e }));
		this.getMetaNotes().forEach(e => elements.push({ elementType: 'MetaNote', data: e }));
		this.getRandomEvents().forEach(e => elements.push({ elementType: e.eventType as ElementType, data: e }));

		return elements.sort((a, b) => this.sortByLastSeen(a, b));
	}

	private wrapElements(rawElements: (PlayerCharacter | NPC | LocationTag | Thread | Clock | Track | Timer | Event | MetaNoteWithContext | RandomEvent | Reference)[], type: ElementType): ElementCardData[] {
		return rawElements.map(e => ({ elementType: type, data: e }));
	}

	private getMetaNotes(): MetaNote[] {
		if (!this.selectedCampaign) return [];

		const notes: MetaNote[] = [];
		const campaign = this.selectedCampaign;

		for (const session of campaign.sessions) {
			for (const scene of session.scenes) {
				for (const element of scene.elements) {
					if (element.type === 'meta_note') {
						const location: Location = {
							file: session.linkedFile || campaign.file,
							lineNumber: element.lineNumber,
							session: `Session ${session.number}`,
							scene: scene.number,
						};
						notes.push({
							note: element,
							location,
							session: `Session ${session.number}`,
							scene: scene.number,
						});
					}
				}
			}
		}

		return notes;
	}

	private getRandomEvents(): RandomEvent[] {
		if (!this.selectedCampaign) return [];

		const events: RandomEvent[] = [];
		const campaign = this.selectedCampaign;

		for (const session of campaign.sessions) {
			for (const scene of session.scenes) {
				for (const element of scene.elements) {
					if (element.type === 'table_lookup' && (this.currentElementType === 'All' || this.currentElementType === 'TableLookup')) {
						const location: Location = {
							file: session.linkedFile || campaign.file,
							lineNumber: element.lineNumber,
							session: `Session ${session.number}`,
							scene: scene.number,
						};
						events.push({
							type: 'table',
							data: element,
							location,
							eventType: 'TableLookup',
							session: `Session ${session.number}`,
							scene: scene.number,
						});
					} else if (element.type === 'generator' && (this.currentElementType === 'All' || this.currentElementType === 'Generator')) {
						const location: Location = {
							file: session.linkedFile || campaign.file,
							lineNumber: element.lineNumber,
							session: `Session ${session.number}`,
							scene: scene.number,
						};
						events.push({
							type: 'generator',
							data: element,
							location,
							eventType: 'Generator',
							session: `Session ${session.number}`,
							scene: scene.number,
						});
					}
				}
			}
		}

		return events;
	}

	private elementMatchesSearch(element: ELementType, query: string): boolean {
		const name = element.name || (element.note && element.note.content) || (element.data && element.data.result) || '';
		const type = element.type || '';
		const tags = element.tags || [];

		return (
			name.toLowerCase().includes(query) ||
			type.toLowerCase().includes(query) ||
			tags.some((tag: string) => tag.toLowerCase().includes(query))
		);
	}

	private sortByLastSeen(a: ElementType, b: ElementType): number {
		const getTimestamp = (element: ElementType): number => {
			if (element.session) {
				const match = element.session.match(/Session (\d+)/);
				if (match) return -parseInt(match[1]);
			}
			if (element.mentions && element.mentions.length > 0) {
				const lastMention = element.mentions[element.mentions.length - 1];
				if (lastMention.session) {
					const match = lastMention.session.match(/Session (\d+)/);
					if (match) return -parseInt(match[1]);
				}
			}
			if (element.locations && element.locations.length > 0) {
				return -element.locations.length;
			}
			return 0;
		};

		return getTimestamp(a) - getTimestamp(b);
	}

	private renderPCCard(container: HTMLElement, pc: PlayerCharacter) {
		const card = container.createDiv({ cls: 'solo-rpg-element-card' });
		card.createDiv({ text: pc.name, cls: 'solo-rpg-element-name' });

		if (pc.tags.length > 0) {
			const tagsContainer = card.createDiv({ cls: 'solo-rpg-element-tags' });
			for (const tag of pc.tags) {
				tagsContainer.createSpan({ text: tag, cls: 'solo-rpg-tag' });
			}
		}

		const meta = card.createDiv({ cls: 'solo-rpg-element-meta' });
		meta.createSpan({ text: `Mentions: ${pc.mentions.length}` });

		const lastMention = pc.mentions[pc.mentions.length - 1];
		if (lastMention.session && lastMention.scene) {
			meta.createSpan({ text: ` | Last seen: ${lastMention.session}, ${lastMention.scene}` });
		}

		card.addEventListener('click', () => this.navigateToLocation(pc.firstMention.file, pc.firstMention.lineNumber));
	}

	private renderNPCCard(container: HTMLElement, npc: NPC) {
		const card = container.createDiv({ cls: 'solo-rpg-element-card' });
		card.createDiv({ text: npc.name, cls: 'solo-rpg-element-name' });

		if (npc.tags.length > 0) {
			const tagsContainer = card.createDiv({ cls: 'solo-rpg-element-tags' });
			for (const tag of npc.tags) {
				tagsContainer.createSpan({ text: tag, cls: 'solo-rpg-tag' });
			}
		}

		const meta = card.createDiv({ cls: 'solo-rpg-element-meta' });
		meta.createSpan({ text: `Mentions: ${npc.mentions.length}` });

		const lastMention = npc.mentions[npc.mentions.length - 1];
		if (lastMention.session && lastMention.scene) {
			meta.createSpan({ text: ` | Last seen: ${lastMention.session}, ${lastMention.scene}` });
		}

		card.addEventListener('click', () => this.navigateToLocation(npc.firstMention.file, npc.firstMention.lineNumber));
	}

	private renderLocationCard(container: HTMLElement, location: LocationTag) {
		const card = container.createDiv({ cls: 'solo-rpg-element-card' });
		card.createDiv({ text: location.name, cls: 'solo-rpg-element-name' });

		if (location.tags.length > 0) {
			const tagsContainer = card.createDiv({ cls: 'solo-rpg-element-tags' });
			for (const tag of location.tags) {
				tagsContainer.createSpan({ text: tag, cls: 'solo-rpg-tag' });
			}
		}

		const meta = card.createDiv({ cls: 'solo-rpg-element-meta' });
		meta.createSpan({ text: `Mentions: ${location.mentions.length}` });

		const lastMention = location.mentions[location.mentions.length - 1];
		if (lastMention.session && lastMention.scene) {
			meta.createSpan({ text: ` | Last seen: ${lastMention.session}, ${lastMention.scene}` });
		}

		card.addEventListener('click', () => this.navigateToLocation(location.firstMention.file, location.firstMention.lineNumber));
	}

	private renderThreadCard(container: HTMLElement, thread: Thread) {
		const card = container.createDiv({ cls: 'solo-rpg-element-card' });
		card.createDiv({ text: thread.name, cls: 'solo-rpg-element-name' });

		const stateColor = this.getThreadStateColor(thread.state);
		const stateBadge = card.createSpan({ text: thread.state, cls: 'solo-rpg-tag' });
		stateBadge.style.backgroundColor = stateColor;

		const meta = card.createDiv({ cls: 'solo-rpg-element-meta' });
		meta.createSpan({ text: `Mentions: ${thread.mentions.length}` });

		const lastMention = thread.mentions[thread.mentions.length - 1];
		if (lastMention.session && lastMention.scene) {
			meta.createSpan({ text: ` | Last seen: ${lastMention.session}, ${lastMention.scene}` });
		}

		card.addEventListener('click', () => this.navigateToLocation(thread.firstMention.file, thread.firstMention.lineNumber));
	}

	private renderClockCard(container: HTMLElement, clock: Clock | Event) {
		const item = container.createDiv({ cls: 'solo-rpg-progress-item solo-rpg-element-card' });

		const header = item.createDiv({ cls: 'solo-rpg-progress-header' });
		header.createDiv({ text: clock.name, cls: 'solo-rpg-progress-name' });
		header.createDiv({ text: `${clock.current}/${clock.total}`, cls: 'solo-rpg-progress-value' });

		if (this.settings.showProgressBars) {
			if (this.settings.clockStyle === 'circle') {
				this.renderCircleProgress(item, clock.current, clock.total);
			} else if (this.settings.clockStyle === 'segments') {
				this.renderSegmentProgress(item, clock.current, clock.total);
			} else {
				this.renderBarProgress(item, clock.current, clock.total);
			}
		}

		const percentage = this.progressParser.calculateProgress(clock.current, clock.total);
		const status = item.createDiv({ cls: 'solo-rpg-progress-status' });

		if (this.progressParser.isComplete(clock.current, clock.total)) {
			status.createSpan({ text: '✅ Complete', cls: 'complete' });
		} else if (this.progressParser.isNearComplete(clock.current, clock.total)) {
			status.createSpan({ text: '⚠️ Near complete', cls: 'warning' });
		} else {
			status.createSpan({ text: `${percentage}%` });
		}

		item.addEventListener('click', () => {
			if (clock.locations.length > 0) {
				const loc = clock.locations[0];
				this.navigateToLocation(loc.file, loc.lineNumber);
			}
		});
	}

	private renderTrackCard(container: HTMLElement, track: Track) {
		const item = container.createDiv({ cls: 'solo-rpg-progress-item solo-rpg-element-card' });

		const header = item.createDiv({ cls: 'solo-rpg-progress-header' });
		header.createDiv({ text: track.name, cls: 'solo-rpg-progress-name' });
		header.createDiv({ text: `${track.current}/${track.total}`, cls: 'solo-rpg-progress-value' });

		if (this.settings.showProgressBars) {
			this.renderBarProgress(item, track.current, track.total);
		}

		const percentage = this.progressParser.calculateProgress(track.current, track.total);
		const status = item.createDiv({ cls: 'solo-rpg-progress-status' });

		if (this.progressParser.isComplete(track.current, track.total)) {
			status.createSpan({ text: '✅ Complete', cls: 'complete' });
		} else if (this.progressParser.isNearComplete(track.current, track.total)) {
			status.createSpan({ text: '🎯 Almost there!', cls: 'near-complete' });
		} else {
			status.createSpan({ text: `${percentage}%` });
		}

		item.addEventListener('click', () => {
			if (track.locations.length > 0) {
				const loc = track.locations[0];
				this.navigateToLocation(loc.file, loc.lineNumber);
			}
		});
	}

	private renderTimerCard(container: HTMLElement, timer: Timer) {
		const item = container.createDiv({ cls: 'solo-rpg-progress-item solo-rpg-element-card' });

		const header = item.createDiv({ cls: 'solo-rpg-progress-header' });
		header.createDiv({ text: timer.name, cls: 'solo-rpg-progress-name' });

		const valueDiv = header.createDiv({ cls: 'solo-rpg-timer-value' });
		if (this.progressParser.isTimerUrgent(timer.value)) {
			valueDiv.addClass('urgent');
		}
		valueDiv.setText(timer.value.toString());

		const status = item.createDiv({ cls: 'solo-rpg-progress-status' });
		if (timer.value === 0) {
			status.createSpan({ text: '⏰ Time\'s up!', cls: 'expired' });
		} else if (this.progressParser.isTimerUrgent(timer.value)) {
			status.createSpan({ text: '⚠️ Urgent!', cls: 'urgent' });
		} else {
			status.createSpan({ text: `${timer.value} remaining` });
		}

		item.addEventListener('click', () => {
			if (timer.locations.length > 0) {
				const loc = timer.locations[0];
				this.navigateToLocation(loc.file, loc.lineNumber);
			}
		});
	}

	private renderMetaNoteCard(container: HTMLElement, noteCtx: MetaNoteWithContext) {
		const card = container.createDiv({ cls: 'solo-rpg-element-card' });

		const categoryLabel = noteCtx.note.category.replace('_', ' ');
		card.createDiv({
			text: categoryLabel.charAt(0).toUpperCase() + categoryLabel.slice(1),
			cls: 'solo-rpg-tag'
		});

		card.createDiv({ text: noteCtx.note.content, cls: 'solo-rpg-element-name' });

		const meta = card.createDiv({ cls: 'solo-rpg-element-meta' });
		if (noteCtx.session && noteCtx.scene) {
			meta.createSpan({ text: `${noteCtx.session}, ${noteCtx.scene}` });
		}

		card.addEventListener('click', () => {
			this.navigateToLocation(noteCtx.location.file, noteCtx.location.lineNumber);
		});
	}

	private renderRandomEventCard(container: HTMLElement, event: RandomEvent) {
		const card = container.createDiv({ cls: 'solo-rpg-element-card' });

		const typeText = event.type === 'table' ? 'Table Lookup' : 'Generator';
		card.createDiv({ text: typeText, cls: 'solo-rpg-tag' });

		if (event.type === 'table') {
			const data = event.data as TableLookup;
			card.createDiv({ text: `${data.roll} => ${data.result}`, cls: 'solo-rpg-element-name' });
		} else {
			const data = event.data as Generator;
			card.createDiv({ text: `${data.system} => ${data.result}`, cls: 'solo-rpg-element-name' });
		}

		const meta = card.createDiv({ cls: 'solo-rpg-element-meta' });
		if (event.session && event.scene) {
			meta.createSpan({ text: `${event.session}, ${event.scene}` });
		}

		card.addEventListener('click', () => {
			this.navigateToLocation(event.location.file, event.location.lineNumber);
		});
	}

	private renderReferenceCard(container: HTMLElement, reference: Reference) {
		const card = container.createDiv({ cls: 'solo-rpg-element-card' });

		const nameContainer = card.createDiv({ cls: 'solo-rpg-element-name' });
		nameContainer.createSpan({ text: reference.name });
		nameContainer.createSpan({ text: ` (${reference.type})`, cls: 'solo-rpg-tag' });

		const meta = card.createDiv({ cls: 'solo-rpg-element-meta' });
		meta.createSpan({ text: `Mentions: ${reference.mentions.length}` });

		if (reference.mentions.length > 0) {
			const lastMention = reference.mentions[reference.mentions.length - 1];
			if (lastMention.session && lastMention.scene) {
				meta.createSpan({ text: ` | Last seen: ${lastMention.session}, ${lastMention.scene}` });
			}
		}

		card.addEventListener('click', () => {
			this.navigateToLocation(reference.firstMention.file, reference.firstMention.lineNumber);
		});
	}

	private getThreadStateColor(state: string): string {
		const stateLower = state.toLowerCase();
		if (stateLower === 'open') return 'var(--interactive-accent)';
		if (stateLower === 'closed') return 'var(--text-success)';
		if (stateLower === 'abandoned') return 'var(--text-muted)';
		return 'var(--background-secondary)';
	}

	private renderCircleProgress(container: HTMLElement, current: number, total: number) {
		const percentage = (current / total) * 100;
		const svg = container.createSvg('svg', { cls: 'solo-rpg-progress-circle' });
		svg.setAttribute('viewBox', '0 0 36 36');

		const bgCircle = svg.createSvg('circle', { cls: 'solo-rpg-progress-circle-bg' });
		bgCircle.setAttribute('cx', '18');
		bgCircle.setAttribute('cy', '18');
		bgCircle.setAttribute('r', '15.915');

		const progressCircle = svg.createSvg('circle', { cls: 'solo-rpg-progress-circle-fill' });
		progressCircle.setAttribute('cx', '18');
		progressCircle.setAttribute('cy', '18');
		progressCircle.setAttribute('r', '15.915');
		progressCircle.setAttribute('stroke-dasharray', `${percentage} 100`);
	}

	private renderSegmentProgress(container: HTMLElement, current: number, total: number) {
		const segments = container.createDiv({ cls: 'solo-rpg-progress-segments' });

		for (let i = 0; i < total; i++) {
			const segment = segments.createDiv({ cls: 'solo-rpg-progress-segment' });
			if (i < current) {
				segment.addClass('filled');
			}
		}
	}

	private renderBarProgress(container: HTMLElement, current: number, total: number) {
		const percentage = (current / total) * 100;
		const barContainer = container.createDiv({ cls: 'solo-rpg-progress-bar-container' });
		const bar = barContainer.createDiv({ cls: 'solo-rpg-progress-bar-fill' });
		bar.style.width = `${percentage}%`;
	}

	private async navigateToLocation(filePath: string, lineNumber: number) {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!(file instanceof TFile)) {
			new Notice(`File not found: ${filePath}`);
			return;
		}

		try {
			const leaf = this.app.workspace.getLeaf(false);
			await leaf.openFile(file);

			const view = this.app.workspace.getActiveViewOfType(ItemView);
			if (view) {
				// @ts-ignore
				const editor = view.editor;
				if (editor) {
					const lineCount = editor.lineCount();
					if (lineNumber >= lineCount) {
						new Notice('Location not found in file, opened at top');
						editor.setCursor({ line: 0, ch: 0 });
					} else {
						editor.setCursor({ line: lineNumber, ch: 0 });
						editor.scrollIntoView({ from: { line: lineNumber, ch: 0 }, to: { line: lineNumber, ch: 0 } }, true);
					}
				}
			}
		} catch (error) {
			console.error('Error navigating to location:', error);
			new Notice('Could not navigate to location');
		}
	}
}
