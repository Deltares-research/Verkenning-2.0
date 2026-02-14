import type {
    ApplyDesignerSettingsCallback,
    ComponentModelDesignerSettings,
    DesignerSettings,
    GetDesignerSettingsCallback,
    GetDesignerSettingsSchemaCallback,
    Setting,
    SettingsSchema,
} from "@vertigis/web/designer";
import {
    applyComponentModelDesignerSettings,
    getComponentModelDesignerSettings,
    getComponentModelDesignerSettingsSchema,
} from "@vertigis/web/designer";

import type { NestedLayerListModelProperties } from "./NestedLayerListModel";
import type NestedLayerListModel from "./NestedLayerListModel";

export interface NestedLayerListSettings extends ComponentModelDesignerSettings {
    layerConfigJson?: string;
}

export type SettingsMap = DesignerSettings<NestedLayerListSettings>;

export const applySettings: ApplyDesignerSettingsCallback<NestedLayerListModel, SettingsMap> = async (args) => {
    const { model, settings } = args;
    const { layerConfigJson, ...otherSettings } = settings;
    await applyComponentModelDesignerSettings(args);

    const applyProps: Partial<NestedLayerListModelProperties> = otherSettings;

    if (layerConfigJson !== undefined) {
        try {
            applyProps.layerConfig = JSON.parse(layerConfigJson);
        } catch (e) {
            console.warn("[NestedLayerList] Invalid layerConfig JSON in designer settings", e);
        }
    }

    model.assignProperties(applyProps);
    model.resolveAllLayers();
};

export const getSettings: GetDesignerSettingsCallback<NestedLayerListModel, SettingsMap> = async (args) => {
    const { model } = args;
    return {
        ...await getComponentModelDesignerSettings(args),
        layerConfigJson: JSON.stringify(model.layerConfig, null, 2),
    };
};

export const getSettingsSchema: GetDesignerSettingsSchemaCallback<NestedLayerListModel, SettingsMap> = async (args) => {
    const baseSchema = await getComponentModelDesignerSettingsSchema(args);
    (baseSchema.settings[0].settings as Setting<NestedLayerListSettings>[]) = (
        baseSchema.settings[0].settings as Setting<NestedLayerListSettings>[]
    ).concat([
        {
            id: "layerConfigJson",
            type: "text",
            description: "Layer configuration as JSON. Use the in-component editor (gear icon) to build this visually.",
            displayName: "Layer Config (JSON)",
        },
    ]);

    const schema: SettingsSchema<NestedLayerListSettings> = {
        ...baseSchema,
        settings: [...baseSchema.settings],
    };
    return schema;
};
