import { vi } from 'vitest';
import { parseYaml as mockParseYaml } from '../setup/obsidian-mock';

export const App = vi.fn();
export const TFile = class {
	constructor(
		public path: string,
		public name: string,
		public extension: string = 'md'
	) {}
};
export const normalizePath = (path: string) => path;
export const parseYaml = (content: string) => mockParseYaml(content);
export const MarkdownView = vi.fn();
export const Menu = vi.fn();
export const MenuItem = vi.fn();
export const Notice = vi.fn();
export const ItemView = vi.fn();
export const PluginSettingTab = vi.fn();
export const Setting = vi.fn();
