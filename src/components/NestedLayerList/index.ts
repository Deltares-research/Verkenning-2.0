import type { LibraryRegistry } from "@vertigis/web/config";
import type { GetDesignerSettingsSchemaArgs } from "@vertigis/web/designer";

import NestedLayerList from "./NestedLayerList";
import NestedLayerListModel from "./NestedLayerListModel";

export { default } from "./NestedLayerList";
export { NestedLayerListModel };
export { applySettings, getSettings, getSettingsSchema } from "./designer";

const getDesigner = () => import("./designer");

export function registerNestedLayerListComponent(registry: LibraryRegistry) {
    registry.registerComponent({
        category: "map",
        iconId: "station-locator",
        name: "nested-layer-list",
        namespace: "vertigis-wsrl",
        getComponentType: () => NestedLayerList,
        itemType: "nested-layer-list-model",
        title: "Nested Layer List",
        getDesignerSettings: async (
            args: GetDesignerSettingsSchemaArgs<NestedLayerListModel, "">
        ) => (await getDesigner()).getSettings(args),
        applyDesignerSettings: async (args) =>
            (await getDesigner()).applySettings(args),
        getDesignerSettingsSchema: async (
            args: GetDesignerSettingsSchemaArgs<NestedLayerListModel, "">
        ) => (await getDesigner()).getSettingsSchema(args),
    });

    registry.registerModel({
        getModel: (config) => new NestedLayerListModel(config),
        itemType: "nested-layer-list-model",
    });
}
