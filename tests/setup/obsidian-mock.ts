export class MockTFile {
	vault: any = { getName: () => 'mock-vault' };
	parent = null;

	constructor(
		public path: string,
		public name: string,
		public extension: string = 'md',
		public stat = {
			type: 'file' as const,
			size: 0,
			ctime: Date.now(),
			mtime: Date.now(),
		},
		public content: string = ''
	) {}

	get basename(): string {
		return this.name.replace(/\.[^/.]+$/, '');
	}
}

function normalizePath(path: string): string {
	return path;
}

export class MockApp {
	private files: Map<string, MockTFile> = new Map();

	constructor() {
		this.files.set('test-campaign.md', new MockTFile('test-campaign.md', 'test-campaign.md'));
	}

	setFile(path: string, content = ''): MockTFile {
		const file = new MockTFile(path, path);
		file.content = content;
		this.files.set(path, file);
		return file;
	}

	vault = {
		getAbstractFileByPath: (path: string): MockTFile | null => {
			return this.files.get(path) || null;
		},
		read: async (file: MockTFile): Promise<string> => {
			if (file.content) {
				return file.content;
			}
			throw new Error(`File not found: ${file.path}`);
		},
		getMarkdownFiles: (): MockTFile[] => {
			return Array.from(this.files.values()).filter(f => f.extension === 'md');
		},
		on: (event: string, callback: (...args: unknown[]) => void): string => {
			return `event-ref-${event}-${Math.random()}`;
		},
		offref: (ref: string): void => {
			console.log(`Removing event ref: ${ref}`);
		},
	};

	metadataCache = {
		getFirstLinkpathDest: (linkpath: string, basePath: string): MockTFile | null => {
			return this.files.get(linkpath) || null;
		},
	};
}

export function parseYaml(content: string): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	const lines = content.split('\n');

	for (const line of lines) {
		const match = line.match(/^(\w+):\s*(.+)$/);
		if (match) {
			const key = match[1];
			const value = match[2].trim();
			result[key] = value;
		}
	}

	return result;
}
