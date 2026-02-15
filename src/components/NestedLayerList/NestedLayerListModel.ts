import type {
    ComponentModelProperties,
    PropertyDefs,
} from "@vertigis/web/models";
import {
    ComponentModelBase,
    serializable,
} from "@vertigis/web/models";
import type Layer from "@arcgis/core/layers/Layer";

export interface LayerGroupConfig {
    label: string;
    expanded?: boolean;
    visible?: boolean;
    layers?: string[];
    groups?: LayerGroupConfig[];
    layerVisibility?: Record<string, boolean>;
}

export interface NestedLayerListModelProperties extends ComponentModelProperties {
    layerConfig?: LayerGroupConfig[];
    editorAllowedGroups?: string[];
}

@serializable
export default class NestedLayerListModel extends ComponentModelBase<NestedLayerListModelProperties> {
    map: any;
    view: any;

    layerConfig: NestedLayerListModelProperties["layerConfig"];
    editorAllowedGroups: NestedLayerListModelProperties["editorAllowedGroups"];
    resolvedLayers: Map<string, Layer> = new Map();
    /** Per-layer intended visibility (independent of group on/off state). */
    layerIntent: Map<string, boolean> = new Map();
    initialized = false;
    private _cachedUserGroups: any[] = [];

    get canEditConfig(): boolean {
        const allowed = this.editorAllowedGroups;
        if (!allowed || allowed.length === 0) return true;
        try {
            const userGroups = (this as any)._authService?.userGroups ?? this._cachedUserGroups;
            // If we have no group info yet, default to allowing access
            if (!userGroups || userGroups.length === 0) return true;
            return userGroups.some((g: any) =>
                allowed.includes(g.title ?? g.id ?? "")
            );
        } catch {
            return false;
        }
    }

    findLayerByTitle(title: string): Layer | undefined {
        if (!this.map) return undefined;
        return this.map.allLayers.items.find(
            (layer: Layer) => layer.title === title
        );
    }

    resolveAllLayers(): void {
        this.resolvedLayers.clear();
        this.layerIntent.clear();
        const resolve = (groups: LayerGroupConfig[]) => {
            for (const group of groups) {
                const visibility = group.layerVisibility ?? {};
                if (group.layers) {
                    for (const title of group.layers) {
                        if (!this.resolvedLayers.has(title)) {
                            const layer = this.findLayerByTitle(title);
                            if (layer) {
                                const intent = title in visibility ? visibility[title] : layer.visible;
                                this.layerIntent.set(title, intent);
                                this.resolvedLayers.set(title, layer);
                            } else {
                                console.warn(`[NestedLayerList] Layer not found: "${title}"`);
                            }
                        }
                    }
                }
                if (group.groups) {
                    resolve(group.groups);
                }
            }
        };
        resolve(this.layerConfig ?? []);
        this.syncLayerVisibility();
    }

    /**
     * Walk the config tree and set each ArcGIS layer's .visible based on
     * individual intent AND whether all ancestor groups are visible.
     */
    syncLayerVisibility(): void {
        const walk = (groups: LayerGroupConfig[], ancestorsVisible: boolean) => {
            for (const group of groups) {
                const groupOn = ancestorsVisible && group.visible !== false;
                if (group.layers) {
                    for (const title of group.layers) {
                        const layer = this.resolvedLayers.get(title);
                        if (layer) {
                            const intent = this.layerIntent.get(title) ?? true;
                            layer.visible = groupOn && intent;
                        }
                    }
                }
                if (group.groups) {
                    walk(group.groups, groupOn);
                }
            }
        };
        walk(this.layerConfig ?? [], true);
    }

    /** Toggle a group's own on/off state (does not change individual layer intent). */
    toggleGroupVisible(group: LayerGroupConfig): void {
        group.visible = group.visible === false ? true : false;
        this.syncLayerVisibility();
    }

    /** Toggle an individual layer's intended visibility. */
    toggleLayerIntent(title: string): void {
        const current = this.layerIntent.get(title) ?? true;
        this.layerIntent.set(title, !current);
        this.syncLayerVisibility();
    }

    /** Get the individual intent for a layer (independent of group state). */
    getLayerIntent(title: string): boolean {
        return this.layerIntent.get(title) ?? true;
    }

    collectLayerTitles(group: LayerGroupConfig): string[] {
        const titles: string[] = [];
        if (group.layers) {
            titles.push(...group.layers);
        }
        if (group.groups) {
            for (const sub of group.groups) {
                titles.push(...this.collectLayerTitles(sub));
            }
        }
        return titles;
    }

    getAllWebmapLayerTitles(): string[] {
        if (!this.map) return [];
        return this.map.allLayers.items
            .map((layer: Layer) => layer.title)
            .filter((title: string) => !!title);
    }

    applyLayerConfig(config: LayerGroupConfig[]): void {
        this.assignProperties({ layerConfig: config });
        this.resolveAllLayers();
    }

    async zoomToLayer(layer: Layer): Promise<void> {
        if (!this.view || !layer) return;
        try {
            const fullExtent = (layer as any).fullExtent;
            if (fullExtent) {
                await this.view.goTo(fullExtent);
            }
        } catch (e) {
            console.warn(`[NestedLayerList] Could not zoom to layer "${layer.title}"`, e);
        }
    }

    protected override _getSerializableProperties(): PropertyDefs<NestedLayerListModelProperties> {
        return {
            ...super._getSerializableProperties(),
            layerConfig: {
                serializeModes: ["initial"],
                default: [],
            },
            editorAllowedGroups: {
                serializeModes: ["initial"],
                default: [],
            },
        };
    }

    protected async _onInitialize(): Promise<void> {
        await super._onInitialize();

        // Pre-fetch user groups from portal so canEditConfig works
        try {
            const authService = (this as any)._authService;
            if (authService?.user?.portalUser) {
                const groups = await authService.user.portalUser.fetchGroups();
                this._cachedUserGroups = groups ?? [];
            }
        } catch {
            // User may not be signed in
        }

        this.messages.events.map.initialized.subscribe(async (map) => {
            this.map = map.maps.map;
            this.view = map.maps["view"];
            this.resolveAllLayers();
            this.initialized = true;
        });
    }
}
