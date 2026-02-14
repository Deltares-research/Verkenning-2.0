import { type ReactElement, useState, useCallback, useRef, useMemo } from "react";
import type NestedLayerListModel from "./NestedLayerListModel";
import type { LayerGroupConfig } from "./NestedLayerListModel";
import "./LayerConfigEditor.css";

// ── Internal tree node model ──────────────────────────────

interface TreeNode {
    id: string;
    type: "group" | "layer";
    label: string;
    children: TreeNode[];
    expanded: boolean;
}

let nextId = 1;
function uid(): string {
    return `node-${nextId++}`;
}

// ── Conversion helpers ────────────────────────────────────

function configToTree(groups: LayerGroupConfig[]): TreeNode[] {
    return groups.map((g) => ({
        id: uid(),
        type: "group" as const,
        label: g.label,
        expanded: true,
        children: [
            ...(g.groups ? configToTree(g.groups) : []),
            ...(g.layers
                ? g.layers.map((title) => ({
                      id: uid(),
                      type: "layer" as const,
                      label: title,
                      children: [],
                      expanded: false,
                  }))
                : []),
        ],
    }));
}

function treeToConfig(nodes: TreeNode[]): LayerGroupConfig[] {
    return nodes
        .filter((n) => n.type === "group")
        .map((g) => {
            const layers = g.children.filter((c) => c.type === "layer").map((c) => c.label);
            const groups = treeToConfig(g.children);
            const config: LayerGroupConfig = { label: g.label };
            if (groups.length > 0) config.groups = groups;
            if (layers.length > 0) config.layers = layers;
            return config;
        });
}

function collectTreeLayerTitles(nodes: TreeNode[]): Set<string> {
    const titles = new Set<string>();
    for (const node of nodes) {
        if (node.type === "layer") {
            titles.add(node.label);
        }
        if (node.children.length > 0) {
            for (const t of collectTreeLayerTitles(node.children)) {
                titles.add(t);
            }
        }
    }
    return titles;
}

// ── Tree mutation helpers (immutable) ─────────────────────

function removeNode(nodes: TreeNode[], id: string): TreeNode[] {
    return nodes
        .filter((n) => n.id !== id)
        .map((n) => ({
            ...n,
            children: removeNode(n.children, id),
        }));
}

function findNode(nodes: TreeNode[], id: string): TreeNode | undefined {
    for (const n of nodes) {
        if (n.id === id) return n;
        const found = findNode(n.children, id);
        if (found) return found;
    }
    return undefined;
}

function insertIntoGroup(nodes: TreeNode[], groupId: string, item: TreeNode): TreeNode[] {
    return nodes.map((n) => {
        if (n.id === groupId && n.type === "group") {
            return { ...n, children: [...n.children, item], expanded: true };
        }
        return { ...n, children: insertIntoGroup(n.children, groupId, item) };
    });
}

function insertAtIndex(nodes: TreeNode[], index: number, item: TreeNode): TreeNode[] {
    const copy = [...nodes];
    copy.splice(index, 0, item);
    return copy;
}

function insertBeforeNode(
    nodes: TreeNode[],
    targetId: string,
    item: TreeNode
): { result: TreeNode[]; inserted: boolean } {
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === targetId) {
            return { result: insertAtIndex(nodes, i, item), inserted: true };
        }
        const sub = insertBeforeNode(nodes[i].children, targetId, item);
        if (sub.inserted) {
            const copy = [...nodes];
            copy[i] = { ...copy[i], children: sub.result };
            return { result: copy, inserted: true };
        }
    }
    return { result: nodes, inserted: false };
}

function toggleExpanded(nodes: TreeNode[], id: string): TreeNode[] {
    return nodes.map((n) => {
        if (n.id === id) return { ...n, expanded: !n.expanded };
        return { ...n, children: toggleExpanded(n.children, id) };
    });
}

function renameNode(nodes: TreeNode[], id: string, label: string): TreeNode[] {
    return nodes.map((n) => {
        if (n.id === id) return { ...n, label };
        return { ...n, children: renameNode(n.children, id, label) };
    });
}

// ── Draggable tree node ───────────────────────────────────

interface EditorTreeNodeProps {
    node: TreeNode;
    depth: number;
    dragId: string | null;
    dropTarget: { id: string; position: "before" | "inside" } | null;
    onDragStart: (id: string) => void;
    onDragEnd: () => void;
    onDropTarget: (id: string, position: "before" | "inside") => void;
    onClearDropTarget: () => void;
    onToggleExpand: (id: string) => void;
    onRename: (id: string, label: string) => void;
    onRemove: (id: string) => void;
}

const EditorTreeNode = ({
    node,
    depth,
    dragId,
    dropTarget,
    onDragStart,
    onDragEnd,
    onDropTarget,
    onClearDropTarget,
    onToggleExpand,
    onRename,
    onRemove,
}: EditorTreeNodeProps): ReactElement => {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(node.label);
    const inputRef = useRef<HTMLInputElement>(null);

    const isDropBefore =
        dropTarget?.id === node.id && dropTarget.position === "before";
    const isDropInside =
        dropTarget?.id === node.id && dropTarget.position === "inside" && node.type === "group";
    const isDragging = dragId === node.id;

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const y = e.clientY - rect.top;
            if (node.type === "group" && y > rect.height * 0.3 && y < rect.height * 0.7) {
                onDropTarget(node.id, "inside");
            } else if (y <= rect.height * 0.5) {
                onDropTarget(node.id, "before");
            } else {
                onDropTarget(node.id, "before");
            }
        },
        [node.id, node.type, onDropTarget]
    );

    const commitRename = useCallback(() => {
        setEditing(false);
        if (editValue.trim() && editValue !== node.label) {
            onRename(node.id, editValue.trim());
        } else {
            setEditValue(node.label);
        }
    }, [editValue, node.id, node.label, onRename]);

    return (
        <>
            {isDropBefore && <div className="lce-drop-indicator" style={{ marginLeft: depth * 24 + 8 }} />}
            <div
                className={`lce-tree-row ${isDragging ? "lce-dragging" : ""} ${isDropInside ? "lce-drop-inside" : ""}`}
                style={{ paddingLeft: depth * 24 + 8 }}
                draggable
                onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.effectAllowed = "move";
                    onDragStart(node.id);
                }}
                onDragEnd={onDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={onClearDropTarget}
            >
                {/* Drag handle */}
                <span className="lce-drag-handle" title="Drag to reorder">&#9776;</span>

                {node.type === "group" ? (
                    <>
                        <button
                            className="lce-expand-btn"
                            onClick={() => onToggleExpand(node.id)}
                        >
                            <span className={`lce-arrow ${node.expanded ? "expanded" : ""}`}>&#9654;</span>
                        </button>
                        <span className="lce-folder-icon">&#128193;</span>
                        {editing ? (
                            <input
                                ref={inputRef}
                                className="lce-rename-input"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={commitRename}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") commitRename();
                                    if (e.key === "Escape") {
                                        setEditValue(node.label);
                                        setEditing(false);
                                    }
                                }}
                                autoFocus
                            />
                        ) : (
                            <span
                                className="lce-label lce-label-group"
                                onDoubleClick={() => {
                                    setEditValue(node.label);
                                    setEditing(true);
                                }}
                                title="Double-click to rename"
                            >
                                {node.label}
                            </span>
                        )}
                    </>
                ) : (
                    <>
                        <div style={{ width: 24 }} />
                        <span className="lce-label">{node.label}</span>
                    </>
                )}

                <button className="lce-remove-btn" onClick={() => onRemove(node.id)} title="Remove">
                    &#10005;
                </button>
            </div>

            {/* Children */}
            {node.type === "group" && node.expanded && (
                <div>
                    {node.children.map((child) => (
                        <EditorTreeNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            dragId={dragId}
                            dropTarget={dropTarget}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            onDropTarget={onDropTarget}
                            onClearDropTarget={onClearDropTarget}
                            onToggleExpand={onToggleExpand}
                            onRename={onRename}
                            onRemove={onRemove}
                        />
                    ))}
                    {node.children.length === 0 && (
                        <div
                            className="lce-empty-group"
                            style={{ paddingLeft: (depth + 1) * 24 + 8 }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                onDropTarget(node.id, "inside");
                            }}
                            onDragLeave={onClearDropTarget}
                        >
                            Drop layers here
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

// ── Main editor component ─────────────────────────────────

interface LayerConfigEditorProps {
    model: NestedLayerListModel;
    onSave: (config: LayerGroupConfig[]) => void;
    onCancel: () => void;
}

const LayerConfigEditor = ({ model, onSave, onCancel }: LayerConfigEditorProps): ReactElement => {
    const [tree, setTree] = useState<TreeNode[]>(() => configToTree(model.layerConfig));
    const [dragId, setDragId] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<{ id: string; position: "before" | "inside" } | null>(null);
    const [availFilter, setAvailFilter] = useState("");
    const [copied, setCopied] = useState(false);

    // Available layers = all webmap layers minus those already in tree
    const allTitles = useMemo(() => model.getAllWebmapLayerTitles(), [model]);
    const usedTitles = useMemo(() => collectTreeLayerTitles(tree), [tree]);
    const availableLayers = useMemo(() => {
        const filtered = allTitles.filter((t) => !usedTitles.has(t));
        if (availFilter) {
            return filtered.filter((t) => t.toLowerCase().includes(availFilter.toLowerCase()));
        }
        return filtered;
    }, [allTitles, usedTitles, availFilter]);

    // ── DnD handlers ──────────────────────────────────────

    const handleDragEnd = useCallback(() => {
        if (dragId && dropTarget) {
            const dragged = findNode(tree, dragId);
            if (dragged && dragged.id !== dropTarget.id) {
                let newTree = removeNode(tree, dragId);
                if (dropTarget.position === "inside") {
                    newTree = insertIntoGroup(newTree, dropTarget.id, dragged);
                } else {
                    const res = insertBeforeNode(newTree, dropTarget.id, dragged);
                    newTree = res.result;
                }
                setTree(newTree);
            }
        }
        setDragId(null);
        setDropTarget(null);
    }, [dragId, dropTarget, tree]);

    // ── Tree actions ──────────────────────────────────────

    const addGroup = useCallback(() => {
        setTree((prev) => [
            ...prev,
            {
                id: uid(),
                type: "group",
                label: "New Group",
                children: [],
                expanded: true,
            },
        ]);
    }, []);

    const addLayerToRoot = useCallback((title: string) => {
        setTree((prev) => [
            ...prev,
            {
                id: uid(),
                type: "layer",
                label: title,
                children: [],
                expanded: false,
            },
        ]);
    }, []);

    const handleRemove = useCallback((id: string) => {
        setTree((prev) => removeNode(prev, id));
    }, []);

    const handleToggleExpand = useCallback((id: string) => {
        setTree((prev) => toggleExpanded(prev, id));
    }, []);

    const handleRename = useCallback((id: string, label: string) => {
        setTree((prev) => renameNode(prev, id, label));
    }, []);

    const handleSave = useCallback(() => {
        onSave(treeToConfig(tree));
    }, [onSave, tree]);

    const handleCopyJson = useCallback(() => {
        const config = treeToConfig(tree);
        const json = JSON.stringify(config, null, 2);
        navigator.clipboard.writeText(json).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [tree]);

    // ── Root drop zone (for dropping at end of tree) ──────

    const rootDropRef = useRef<HTMLDivElement>(null);

    return (
        <div className="lce-root">
            {/* Header */}
            <div className="lce-header">
                <span className="lce-header-title">Configure Layer List</span>
                <div className="lce-header-actions">
                    <button className="lce-btn" onClick={handleCopyJson} title="Copy layerConfig JSON to clipboard">
                        {copied ? "Copied!" : "Copy JSON"}
                    </button>
                    <button className="lce-btn lce-btn-primary" onClick={handleSave}>Save</button>
                    <button className="lce-btn" onClick={onCancel}>Cancel</button>
                </div>
            </div>

            <div className="lce-body">
                {/* Available layers */}
                <div className="lce-section">
                    <div className="lce-section-title">Available Layers</div>
                    <div className="lce-avail-filter">
                        <input
                            className="lce-avail-filter-input"
                            type="text"
                            placeholder="Search layers..."
                            value={availFilter}
                            onChange={(e) => setAvailFilter(e.target.value)}
                        />
                        {availFilter && (
                            <button className="lce-avail-filter-clear" onClick={() => setAvailFilter("")}>&#10005;</button>
                        )}
                    </div>
                    <div className="lce-avail-list">
                        {availableLayers.length === 0 && (
                            <div className="lce-avail-empty">
                                {availFilter ? "No matching layers" : "All layers are in the tree"}
                            </div>
                        )}
                        {availableLayers.map((title) => (
                            <button
                                key={title}
                                className="lce-avail-item"
                                onClick={() => addLayerToRoot(title)}
                                title="Click to add to tree"
                            >
                                <span className="lce-avail-plus">+</span>
                                {title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Add group button */}
                <button className="lce-add-group-btn" onClick={addGroup}>
                    + Add Group
                </button>

                {/* Tree editor */}
                <div className="lce-section">
                    <div className="lce-section-title">Layer Tree</div>
                    <div
                        ref={rootDropRef}
                        className="lce-tree"
                        onDragOver={(e) => {
                            e.preventDefault();
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            handleDragEnd();
                        }}
                    >
                        {tree.length === 0 && (
                            <div className="lce-tree-empty">
                                Add groups and layers above to build your layer tree.
                            </div>
                        )}
                        {tree.map((node) => (
                            <EditorTreeNode
                                key={node.id}
                                node={node}
                                depth={0}
                                dragId={dragId}
                                dropTarget={dropTarget}
                                onDragStart={setDragId}
                                onDragEnd={handleDragEnd}
                                onDropTarget={(id, pos) => setDropTarget({ id, position: pos })}
                                onClearDropTarget={() => setDropTarget(null)}
                                onToggleExpand={handleToggleExpand}
                                onRename={handleRename}
                                onRemove={handleRemove}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LayerConfigEditor;
