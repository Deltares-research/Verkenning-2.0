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
    layers?: string[];
    groups?: LayerGroupConfig[];
}

export interface NestedLayerListModelProperties extends ComponentModelProperties {
    layerConfig?: LayerGroupConfig[];
}

@serializable
export default class NestedLayerListModel extends ComponentModelBase<NestedLayerListModelProperties> {
    map: any;
    view: any;

    layerConfig: NestedLayerListModelProperties["layerConfig"];
    resolvedLayers: Map<string, Layer> = new Map();
    initialized = false;

    findLayerByTitle(title: string): Layer | undefined {
        if (!this.map) return undefined;
        return this.map.allLayers.items.find(
            (layer: Layer) => layer.title === title
        );
    }

    resolveAllLayers(): void {
        this.resolvedLayers.clear();
        const resolve = (groups: LayerGroupConfig[]) => {
            for (const group of groups) {
                if (group.layers) {
                    for (const title of group.layers) {
                        if (!this.resolvedLayers.has(title)) {
                            const layer = this.findLayerByTitle(title);
                            if (layer) {
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

    getGroupVisibility(group: LayerGroupConfig): "all" | "none" | "some" {
        const titles = this.collectLayerTitles(group);
        let visibleCount = 0;
        let totalCount = 0;
        for (const title of titles) {
            const layer = this.resolvedLayers.get(title);
            if (layer) {
                totalCount++;
                if (layer.visible) visibleCount++;
            }
        }
        if (totalCount === 0) return "none";
        if (visibleCount === totalCount) return "all";
        if (visibleCount === 0) return "none";
        return "some";
    }

    toggleGroupVisibility(group: LayerGroupConfig): void {
        const state = this.getGroupVisibility(group);
        const newVisible = state !== "all";
        const titles = this.collectLayerTitles(group);
        for (const title of titles) {
            const layer = this.resolvedLayers.get(title);
            if (layer) {
                layer.visible = newVisible;
            }
        }
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
        };
    }

    protected async _onInitialize(): Promise<void> {
        await super._onInitialize();

        this.messages.events.map.initialized.subscribe(async (map) => {
            this.map = map.maps.map;
            this.view = map.maps["view"];
            this.resolveAllLayers();
            this.initialized = true;
        });
    }
}
