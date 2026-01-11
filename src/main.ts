import { Plugin } from 'obsidian';
import { SoloRPGSettings, DEFAULT_SETTINGS, SoloRPGSettingTab } from './settings';
import { TemplateManager } from './templates/TemplateManager';
import { NotationIndexer } from './indexer/NotationIndexer';
import { registerNotationCommands } from './commands/notationCommands';
import { DashboardView, VIEW_TYPE_DASHBOARD } from './views/DashboardView';

export default class SoloRPGNotationPlugin extends Plugin {
	settings: SoloRPGSettings;
	templateManager: TemplateManager;
	indexer: NotationIndexer;

	async onload() {
		console.log('Loading Solo RPG Notation plugin');

		await this.loadSettings();

		this.templateManager = new TemplateManager(this.app, this.settings);

		this.indexer = new NotationIndexer(this.app, this.settings);
		if (this.settings.enableIndexing) {
			this.indexer.initialize().catch(error => {
				console.error('Error initializing indexer:', error);
			});
		}

		this.registerViews();
		registerNotationCommands(this.app, this, this.templateManager);
		this.registerIndexerCommands();
		this.registerViewCommands();

		this.addSettingTab(new SoloRPGSettingTab(this.app, this));

		this.addRibbonIcon('dice', 'Solo RPG Notation', () => {
			this.activateView(VIEW_TYPE_DASHBOARD);
		});

		console.log('Solo RPG Notation plugin loaded successfully');
	}

	async onunload() {
		console.log('Unloading Solo RPG Notation plugin');

		if (this.indexer) {
			this.indexer.cleanup();
		}

		this.app.workspace.detachLeavesOfType(VIEW_TYPE_DASHBOARD);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private registerViews() {
		this.registerView(
			VIEW_TYPE_DASHBOARD,
			(leaf) => new DashboardView(leaf, this.indexer, this.settings)
		);
	}

	async activateView(viewType: string) {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(viewType)[0];

		if (!leaf) {
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				leaf = rightLeaf;
				await leaf.setViewState({ type: viewType, active: true });
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	private registerIndexerCommands() {
		this.addCommand({
			id: 'reindex-current-file',
			name: 'Reindex Current Campaign',
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (file) {
					if (!checking) {
						this.indexer.indexFile(file);
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({
			id: 'reindex-vault',
			name: 'Reindex All Campaigns',
			callback: async () => {
				await this.indexer.indexVault();
			}
		});

		this.addCommand({
			id: 'show-index-stats',
			name: 'Show Index Statistics',
			callback: () => {
				const campaigns = this.indexer.getAllCampaigns();
				const npcs = this.indexer.getAllNPCs();
				const locations = this.indexer.getAllLocations();
				const threads = this.indexer.getAllThreads();

				console.log('=== Solo RPG Notation Index Stats ===');
				console.log(`Campaigns: ${campaigns.length}`);
				console.log(`NPCs: ${npcs.length}`);
				console.log(`Locations: ${locations.length}`);
				console.log(`Threads: ${threads.length}`);
				console.log('===================================');
			}
		});
	}

	private registerViewCommands() {
		this.addCommand({
			id: 'open-dashboard',
			name: 'Open Campaign Dashboard',
			callback: () => {
				this.activateView(VIEW_TYPE_DASHBOARD);
			}
		});
	}
}
