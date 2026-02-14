import { LayoutElement } from "@vertigis/web/components";
import type { LayoutElementProperties } from "@vertigis/web/components";
import { useWatchAndRerender } from "@vertigis/web/ui";
import Checkbox from "@vertigis/web/ui/Checkbox";
import Collapse from "@vertigis/web/ui/Collapse";
import Slider from "@vertigis/web/ui/Slider/Slider";
import type Layer from "@arcgis/core/layers/Layer";
import { type ReactElement, useState, useCallback, useEffect, useMemo, useRef } from "react";

import type NestedLayerListModel from "./NestedLayerListModel";
import type { LayerGroupConfig } from "./NestedLayerListModel";
import LayerConfigEditor from "./LayerConfigEditor";
import "./NestedLayerList.css";

function groupMatchesFilter(group: LayerGroupConfig, filter: string): boolean {
    const lowerFilter = filter.toLowerCase();
    if (group.label.toLowerCase().includes(lowerFilter)) return true;
    if (group.layers?.some((t) => t.toLowerCase().includes(lowerFilter))) return true;
    if (group.groups?.some((g) => groupMatchesFilter(g, lowerFilter))) return true;
    return false;
}

function layerMatchesFilter(title: string, filter: string): boolean {
    return title.toLowerCase().includes(filter.toLowerCase());
}

// ── Layer options menu (popover) ──────────────────────────

interface LayerMenuProps {
    layer: Layer;
    model: NestedLayerListModel;
    anchorEl: HTMLElement;
    onClose: () => void;
    onUpdate: () => void;
}

const LayerMenu = ({ layer, model, anchorEl, onClose, onUpdate }: LayerMenuProps): ReactElement => {
    const menuRef = useRef<HTMLDivElement>(null);
    const opacity = (layer as any).opacity ?? 1;
    const transparencyPercent = Math.round((1 - opacity) * 100);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node) &&
                !anchorEl.contains(e.target as Node)
            ) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [anchorEl, onClose]);

    // Position below the anchor
    const rect = anchorEl.getBoundingClientRect();

    return (
        <div
            ref={menuRef}
            className="nested-layer-list-popover"
            style={{ top: rect.bottom + 4, right: window.innerWidth - rect.right }}
        >
            {/* Transparency slider */}
            <div className="nested-layer-list-popover-section">
                <div className="nested-layer-list-popover-header">Layer Transparency</div>
                <div className="nested-layer-list-popover-slider-row">
                    <Slider
                        value={transparencyPercent}
                        onChange={(_e, value) => {
                            (layer as any).opacity = 1 - (value as number) / 100;
                            onUpdate();
                        }}
                        min={0}
                        max={100}
                        step={1}
                        size="small"
                    />
                    <input
                        className="nested-layer-list-popover-input"
                        type="number"
                        min={0}
                        max={100}
                        value={transparencyPercent}
                        onChange={(e) => {
                            const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                            (layer as any).opacity = 1 - val / 100;
                            onUpdate();
                        }}
                    />
                </div>
            </div>

            <div className="nested-layer-list-popover-divider" />

            {/* Zoom to layer */}
            <button
                className="nested-layer-list-popover-action"
                onClick={() => {
                    model.zoomToLayer(layer);
                    onClose();
                }}
            >
                <svg className="nested-layer-list-popover-icon" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                <div>
                    <div className="nested-layer-list-popover-action-title">Zoomen naar kaartlaag</div>
                    <div className="nested-layer-list-popover-action-desc">Zoomt naar het gehele gebied van de kaartlaag.</div>
                </div>
            </button>
        </div>
    );
};

// ── Layer row ──────────────────────────────────────────────

interface LayerItemProps {
    title: string;
    layer: Layer | undefined;
    depth: number;
    model: NestedLayerListModel;
    onVisibilityChange: () => void;
}

const LayerItem = ({ title, layer, depth, model, onVisibilityChange }: LayerItemProps): ReactElement => {
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

    return (
        <div className="nested-layer-list-row" style={{ paddingLeft: depth * 24 }}>
            <div className="nested-layer-list-expand-spacer" />
            <Checkbox
                checked={layer?.visible ?? false}
                disabled={!layer}
                onChange={() => {
                    if (layer) {
                        layer.visible = !layer.visible;
                        onVisibilityChange();
                    }
                }}
                size="small"
            />
            <span
                className="nested-layer-list-label"
                style={{ opacity: layer ? 1 : 0.5 }}
            >
                {title}
            </span>
            {layer && (
                <>
                    <button
                        className="nested-layer-list-menu-btn"
                        title="Options"
                        onClick={(e) => setMenuAnchor(menuAnchor ? null : e.currentTarget)}
                    >
                        &#8942;
                    </button>
                    {menuAnchor && (
                        <LayerMenu
                            layer={layer}
                            model={model}
                            anchorEl={menuAnchor}
                            onClose={() => setMenuAnchor(null)}
                            onUpdate={onVisibilityChange}
                        />
                    )}
                </>
            )}
        </div>
    );
};

// ── Group row ──────────────────────────────────────────────

interface GroupItemProps {
    group: LayerGroupConfig;
    model: NestedLayerListModel;
    depth: number;
    filter: string;
    onVisibilityChange: () => void;
}

const GroupItem = ({ group, model, depth, filter, onVisibilityChange }: GroupItemProps): ReactElement => {
    const [expanded, setExpanded] = useState(group.expanded !== false);
    const groupState = model.getGroupVisibility(group);

    const isExpanded = filter ? true : expanded;

    const handleToggleGroup = useCallback(() => {
        model.toggleGroupVisibility(group);
        onVisibilityChange();
    }, [model, group, onVisibilityChange]);

    return (
        <>
            <div className="nested-layer-list-row" style={{ paddingLeft: depth * 24 }}>
                <button
                    className="nested-layer-list-expand-btn"
                    onClick={() => setExpanded(!expanded)}
                    title={isExpanded ? "Collapse" : "Expand"}
                >
                    <span className={`nested-layer-list-arrow ${isExpanded ? "expanded" : ""}`}>
                        &#9654;
                    </span>
                </button>
                <Checkbox
                    checked={groupState === "all"}
                    indeterminate={groupState === "some"}
                    onChange={handleToggleGroup}
                    size="small"
                />
                <span className="nested-layer-list-label nested-layer-list-label-group">
                    {group.label}
                </span>
                <button className="nested-layer-list-menu-btn nested-layer-list-menu-btn-hidden" disabled>
                    &#8942;
                </button>
            </div>
            <Collapse in={isExpanded}>
                <LayerGroupList
                    groups={group.groups}
                    layers={group.layers}
                    model={model}
                    depth={depth + 1}
                    filter={filter}
                    onVisibilityChange={onVisibilityChange}
                />
            </Collapse>
        </>
    );
};

// ── Recursive group+layer list ─────────────────────────────

interface LayerGroupListProps {
    groups?: LayerGroupConfig[];
    layers?: string[];
    model: NestedLayerListModel;
    depth: number;
    filter: string;
    onVisibilityChange: () => void;
}

const LayerGroupList = ({ groups, layers, model, depth, filter, onVisibilityChange }: LayerGroupListProps): ReactElement => {
    const filteredGroups = useMemo(
        () => (filter ? groups?.filter((g) => groupMatchesFilter(g, filter)) : groups),
        [groups, filter]
    );
    const filteredLayers = useMemo(
        () => (filter ? layers?.filter((t) => layerMatchesFilter(t, filter)) : layers),
        [layers, filter]
    );

    return (
        <>
            {filteredGroups?.map((group, i) => (
                <GroupItem
                    key={`group-${depth}-${i}`}
                    group={group}
                    model={model}
                    depth={depth}
                    filter={filter}
                    onVisibilityChange={onVisibilityChange}
                />
            ))}
            {filteredLayers?.map((title) => (
                <LayerItem
                    key={`layer-${title}`}
                    title={title}
                    layer={model.resolvedLayers.get(title)}
                    depth={depth}
                    model={model}
                    onVisibilityChange={onVisibilityChange}
                />
            ))}
        </>
    );
};

// ── Main component ─────────────────────────────────────────

const NestedLayerList = (
    props: LayoutElementProperties<NestedLayerListModel>
): ReactElement => {
    const { model } = props;
    const [, setRenderCount] = useState(0);
    const [filter, setFilter] = useState("");
    const [editorOpen, setEditorOpen] = useState(false);

    useWatchAndRerender(model, "initialized");
    useWatchAndRerender(model, "layerConfig");

    const forceUpdate = useCallback(() => {
        setRenderCount((c) => c + 1);
    }, []);

    useEffect(() => {
        if (!model.initialized) return;

        const handles: any[] = [];
        model.resolvedLayers.forEach((layer) => {
            const handle = layer.watch("visible", () => {
                forceUpdate();
            });
            handles.push(handle);
        });

        return () => {
            handles.forEach((h) => h.remove());
        };
    }, [model.initialized, model.resolvedLayers.size, forceUpdate]);

    const hasResults = useMemo(() => {
        if (!filter) return true;
        return model.layerConfig.some((g) => groupMatchesFilter(g, filter));
    }, [filter, model.layerConfig]);

    const handleEditorSave = useCallback((config: LayerGroupConfig[]) => {
        model.applyLayerConfig(config);
        setEditorOpen(false);
        forceUpdate();
    }, [model, forceUpdate]);

    if (!model.initialized) {
        return (
            <LayoutElement {...props} style={{ width: "100%" }}>
                <div className="nested-layer-list-root">
                    <div className="nested-layer-list-empty">Loading layers...</div>
                </div>
            </LayoutElement>
        );
    }

    if (editorOpen) {
        return (
            <LayoutElement {...props} style={{ width: "100%" }}>
                <LayerConfigEditor
                    model={model}
                    onSave={handleEditorSave}
                    onCancel={() => setEditorOpen(false)}
                />
            </LayoutElement>
        );
    }

    return (
        <LayoutElement {...props} style={{ width: "100%" }}>
            <div className="nested-layer-list-root">
                <div className="nested-layer-list-filter">
                    <input
                        className="nested-layer-list-filter-input"
                        type="text"
                        placeholder="Filter layers by title ..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                    {filter && (
                        <button
                            className="nested-layer-list-clear-btn"
                            onClick={() => setFilter("")}
                            title="Clear filter"
                        >
                            &#10005;
                        </button>
                    )}
                    <button
                        className="nested-layer-list-gear-btn"
                        onClick={() => setEditorOpen(true)}
                        title="Configure layer list"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/>
                        </svg>
                    </button>
                </div>

                <div className="nested-layer-list-content">
                    {hasResults ? (
                        <LayerGroupList
                            groups={model.layerConfig}
                            model={model}
                            depth={0}
                            filter={filter}
                            onVisibilityChange={forceUpdate}
                        />
                    ) : (
                        <div className="nested-layer-list-empty">
                            No layers match &quot;{filter}&quot;
                        </div>
                    )}
                </div>
            </div>
        </LayoutElement>
    );
};

export default NestedLayerList;
