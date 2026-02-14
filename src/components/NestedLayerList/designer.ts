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
    editorAllowedGroups?: string[];
}

export type SettingsMap = DesignerSettings<NestedLayerListSettings>;

export const applySettings: ApplyDesignerSettingsCallback<NestedLayerListModel, SettingsMap> = async (args) => {
    const { model, settings } = args;
    const { layerConfigJson, editorAllowedGroups, ...otherSettings } = settings;
    await applyComponentModelDesignerSettings(args);

    const applyProps: Partial<NestedLayerListModelProperties> = otherSettings;

    if (layerConfigJson !== undefined) {
        try {
            applyProps.layerConfig = JSON.parse(layerConfigJson);
        } catch (e) {
            console.warn("[NestedLayerList] Invalid layerConfig JSON in designer settings", e);
        }
    }

    if (editorAllowedGroups !== undefined) {
        applyProps.editorAllowedGroups = editorAllowedGroups;
    }

    model.assignProperties(applyProps);
    model.resolveAllLayers();
};

export const getSettings: GetDesignerSettingsCallback<NestedLayerListModel, SettingsMap> = async (args) => {
    const { model } = args;
    return {
        ...await getComponentModelDesignerSettings(args),
        layerConfigJson: JSON.stringify(model.layerConfig ?? [], null, 2),
        editorAllowedGroups: model.editorAllowedGroups ?? [],
    };
};

export const getSettingsSchema: GetDesignerSettingsSchemaCallback<NestedLayerListModel, SettingsMap> = async (args) => {
    const baseSchema = await getComponentModelDesignerSettingsSchema(args);

    const portalGroups = await getPortalGroupOptions(args.model);

    (baseSchema.settings[0].settings as Setting<NestedLayerListSettings>[]) = (
        baseSchema.settings[0].settings as Setting<NestedLayerListSettings>[]
    ).concat([
        {
            id: "layerConfigJson",
            type: "text",
            description: "Layer configuration as JSON. Use the in-component editor (gear icon) to build this visually.",
            displayName: "Layer Config (JSON)",
        },
        {
            id: "editorAllowedGroups",
            type: "tags",
            description: "Portal groups that can access the config editor (gear icon). Leave empty to allow all users.",
            displayName: "Editor Allowed Groups",
            options: portalGroups,
        } as any,
    ]);

    const schema: SettingsSchema<NestedLayerListSettings> = {
        ...baseSchema,
        settings: [...baseSchema.settings],
    };
    return schema;
};

async function getPortalGroupOptions(model: NestedLayerListModel): Promise<{ displayName: string; value: string }[]> {
    try {
        const authService = (model as any)._authService;
        // First try the cached userGroups from the auth service
        let groups = authService?.userGroups;
        // If empty, try fetching directly from the portal user
        if ((!groups || groups.length === 0) && authService?.user?.portalUser) {
            groups = await authService.user.portalUser.fetchGroups();
        }
        return (groups ?? []).map((g: any) => ({
            displayName: g.title ?? g.id ?? "Unknown",
            value: g.title ?? g.id ?? "",
        }));
    } catch {
        return [];
    }
}
