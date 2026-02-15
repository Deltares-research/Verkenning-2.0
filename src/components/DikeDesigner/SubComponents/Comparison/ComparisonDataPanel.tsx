import type React from "react";
import { useState, useEffect, useRef } from "react";
import Box from "@vertigis/web/ui/Box";
import Typography from "@vertigis/web/ui/Typography";
import Paper from "@vertigis/web/ui/Paper";
import IconButton from "@vertigis/web/ui/IconButton";
import Tab from "@vertigis/web/ui/Tab";
import Tabs from "@vertigis/web/ui/Tabs";
import Table from "@vertigis/web/ui/Table";
import TableBody from "@vertigis/web/ui/TableBody";
import TableCell from "@vertigis/web/ui/TableCell";
import TableContainer from "@vertigis/web/ui/TableContainer";
import TableHead from "@vertigis/web/ui/TableHead";
import TableRow from "@vertigis/web/ui/TableRow";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Tooltip from "@mui/material/Tooltip";
import { useWatchAndRerender } from "@vertigis/web/ui";
import type DikeDesignerModel from "../../DikeDesignerModel";

import type { ProjectJSON } from "../../Functions/SaveProjectFunctions";
import ComparisonCharts from "./ComparisonCharts";

interface DesignSnapshot {
    id: string;
    name: string;
    timestamp: string;
    projectJSON: ProjectJSON;
}

interface ComparisonDataPanelProps {
    model: DikeDesignerModel;
    setPanelVisible: (visible: boolean) => void;
    mapLeftBorder: number;
    mapRightBorder: number;
}

const ComparisonDataPanel: React.FC<ComparisonDataPanelProps> = ({ model, setPanelVisible, mapLeftBorder, mapRightBorder }) => {
    const [isMaximized, setIsMaximized] = useState(false);
    const [currentTab, setCurrentTab] = useState(0);
    useWatchAndRerender(model, "comparisonSnapshots");
    useWatchAndRerender(model, "designName");
    const snapshots = model.comparisonSnapshots || [];
    const activeDesign = model.designName || "";

    const formatNumber = (value: any): string => {
        if (value == null) return "";
        const n = Number(value);
        if (!isNaN(n)) {
            if (n === 0) return "";
            return Math.round(n).toLocaleString("nl-NL");
        }
        return String(value);
    };

    const [layerVisibility, setLayerVisibility] = useState<{ [key: string]: boolean }>({});

    const toggleLayerVisibility = (layerTitle: string) => {
        const layer = model.map.allLayers.items.find((l: any) => l.title === layerTitle);
        if (layer) {
            const newVisibility = !layer.visible;
            layer.visible = newVisibility;
            setLayerVisibility(prev => ({ ...prev, [layerTitle]: newVisibility }));
        }
    };

    const getDisplayLayer = (mappingKey: string, fallback: string): string => {
        const mapping = (model.effectLayerMappings as any)?.[mappingKey];
        if (typeof mapping === 'object' && mapping?.display) {
            return mapping.display;
        }
        return fallback;
    };

    // Layer popover menu (position: fixed, same pattern as NestedLayerList)
    const LayerPopover: React.FC<{ layerTitle: string; anchorEl: HTMLElement; onClose: () => void }> = ({ layerTitle, anchorEl, onClose }) => {
        const menuRef = useRef<HTMLDivElement>(null);
        const layer = model.map.allLayers.items.find((l: any) => l.title === layerTitle);
        const isVisible = layer?.visible ?? false;

        useEffect(() => {
            const handler = (e: MouseEvent) => {
                if (menuRef.current && !menuRef.current.contains(e.target as Node) && !anchorEl.contains(e.target as Node)) {
                    onClose();
                }
            };
            document.addEventListener("mousedown", handler);
            return () => document.removeEventListener("mousedown", handler);
        }, [anchorEl, onClose]);

        const rect = anchorEl.getBoundingClientRect();

        return (
            <div
                ref={menuRef}
                style={{
                    position: "fixed",
                    top: rect.bottom + 4,
                    right: window.innerWidth - rect.right,
                    zIndex: 1300,
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)",
                    minWidth: 180,
                    padding: "4px 0",
                }}
            >
                <button
                    onClick={() => { toggleLayerVisibility(layerTitle); onClose(); }}
                    style={{
                        display: "flex", alignItems: "center", gap: 10, width: "100%",
                        padding: "8px 16px", border: "none", background: "none",
                        cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "inherit",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                    {isVisible ? <VisibilityOffIcon sx={{ fontSize: 18, opacity: 0.7 }} /> : <VisibilityIcon sx={{ fontSize: 18, opacity: 0.7 }} />}
                    {isVisible ? "Laag verbergen" : "Laag tonen"}
                </button>
            </div>
        );
    };

    const LayerMenuButton: React.FC<{ layerTitle: string }> = ({ layerTitle }) => {
        const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
        return (
            <>
                <Tooltip title="Opties" placement="left" slotProps={{ tooltip: { sx: { fontSize: '13px' } } }}>
                    <button
                        onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)}
                        style={{
                            width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                            border: "1px solid #1976d2", background: "none", cursor: "pointer",
                            borderRadius: "50%", fontSize: 14, color: "#1976d2", padding: 0,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(25,118,210,0.08)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                    >
                        &#8942;
                    </button>
                </Tooltip>
                {anchorEl && <LayerPopover layerTitle={layerTitle} anchorEl={anchorEl} onClose={() => setAnchorEl(null)} />}
            </>
        );
    };

    const btnCellSx = { border: 0, padding: "0 4px", width: 36 } as const;
    const emptyCellSx = { border: 0, width: 36, padding: 0 } as const;

    if (snapshots.length < 2) {
        return (
            <Paper
                elevation={3}
                sx={{
                    position: "fixed",
                    bottom: 0,
                    left: mapLeftBorder,
                    width: mapRightBorder - mapLeftBorder,
                    height: "50%",
                    zIndex: 15,
                    p: 0,
                    borderRadius: "5px",
                    backgroundColor: "#ffffff",
                    boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.15)",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Box
                    sx={{
                        backgroundColor: "#1565C0",
                        color: "white",
                        px: 2,
                        py: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTopLeftRadius: "4px",
                        borderTopRightRadius: "4px",
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: "bold", margin: 0, fontSize: "12px", color: "white" }}>
                        Vergelijkingstabel
                    </Typography>
                    <IconButton
                        onClick={() => setPanelVisible(false)}
                        sx={{ color: "white" }}
                        size="small"
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Box sx={{ padding: "40px", textAlign: "center", backgroundColor: "#f9f9f9", flex: 1 }}>
                    <Typography variant="h6" style={{ marginBottom: "10px", color: "#666" }}>
                        Vergelijking Niet Beschikbaar
                    </Typography>
                    <Typography variant="body2" style={{ color: "#999" }}>
                        Voeg minstens 2 alternatieven toe om ze te vergelijken.
                    </Typography>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper
            elevation={3}
            sx={{
                position: "fixed",
                bottom: 0,
                left: mapLeftBorder,
                width: mapRightBorder - mapLeftBorder,
                height: isMaximized ? "100vh" : "50%",
                zIndex: 15,
                p: 0,
                borderRadius: "5px",
                backgroundColor: "#ffffff",
                boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.15)",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    backgroundColor: "#1565C0",
                    color: "white",
                    px: 2,
                    py: 1.5,
                    fontSize: "14px",
                    borderTopLeftRadius: "4px",
                    borderTopRightRadius: "4px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexShrink: 0,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, margin: 0, fontSize: "12px", color: "white" }}>
                        Vergelijkingstabel
                    </Typography>
                    {activeDesign && (
                        <Typography sx={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", fontStyle: "italic" }}>
                            Actief ontwerp: {activeDesign}
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <IconButton
                        aria-label="maximize"
                        onClick={() => setIsMaximized(!isMaximized)}
                        size="medium"
                        sx={{ color: "#ffffff", marginRight: 1 }}
                    >
                        {isMaximized ? <FullscreenExitIcon /> : <FullscreenIcon />}
                    </IconButton>
                    <IconButton
                        aria-label="close"
                        onClick={() => setPanelVisible(false)}
                        size="medium"
                        sx={{ color: "#ffffff" }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: '#ffffff', flexShrink: 0 }}>
                <Tabs value={currentTab} onChange={(_e, v) => setCurrentTab(v)} aria-label="comparison view tabs">
                    <Tab label="Tabel" sx={{ fontSize: '12px' }} />
                    <Tab label="Grafieken" sx={{ fontSize: '12px' }} />
                </Tabs>
            </Box>

            {/* Tab 0: Table */}
            {currentTab === 0 && (
                <Box sx={{ padding: "20px", overflow: "auto", flex: 1 }}>
                    <TableContainer component={Paper} sx={{ boxShadow: "none", backgroundColor: "#fafafa" }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ borderBottom: '1px solid #e0e0e0' }}>
                                <TableCell sx={{ fontSize: "12px", fontWeight: 500, backgroundColor: "#fafafa", border: 0 }}>
                                    Ontwerp
                                </TableCell>
                                {snapshots.map((snapshot) => {
                                    const isActive = snapshot.name === activeDesign;
                                    return (
                                        <TableCell
                                            key={snapshot.id}
                                            align="right"
                                            sx={{
                                                fontSize: "12px",
                                                fontWeight: isActive ? 700 : 500,
                                                backgroundColor: isActive ? "#e3f2fd" : "#fafafa",
                                                border: 0,
                                                color: isActive ? "#1565C0" : "inherit",
                                            }}
                                        >
                                            {snapshot.name}{isActive ? " (actief)" : ""}
                                        </TableCell>
                                    );
                                })}
                                <TableCell sx={{ width: 36, border: 0, backgroundColor: "#fafafa", padding: 0 }} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {/* Design Values */}
                            <TableRow>
                                <TableCell colSpan={snapshots.length + 2} sx={{ fontSize: "13px", fontWeight: 600, padding: "12px 8px", backgroundColor: "#f5f5f5", border: 0 }}>
                                    Ontwerpwaarden
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Trajectlengte (m)</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.designValues.trajectLength)}
                                    </TableCell>
                                ))}
                                <TableCell sx={emptyCellSx} />
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Volumeverschil (m³)</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.designValues.volumeDifference)}
                                    </TableCell>
                                ))}
                                <TableCell sx={emptyCellSx} />
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Uitgravingsvolume (m³)</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.designValues.excavationVolume)}
                                    </TableCell>
                                ))}
                                <TableCell sx={emptyCellSx} />
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Opvulvolume (m³)</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.designValues.fillVolume)}
                                    </TableCell>
                                ))}
                                <TableCell sx={emptyCellSx} />
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>2D Oppervlakte (m²)</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.designValues.area2d)}
                                    </TableCell>
                                ))}
                                <TableCell sx={emptyCellSx} />
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>3D Oppervlakte (m²)</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.designValues.area3d)}
                                    </TableCell>
                                ))}
                                <TableCell sx={emptyCellSx} />
                            </TableRow>

                            {/* Constructie */}
                            <TableRow>
                                <TableCell colSpan={snapshots.length + 2} sx={{ fontSize: "13px", fontWeight: 600, padding: "12px 8px", backgroundColor: "#f5f5f5", border: 0 }}>
                                    Constructie
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Type constructie</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {s.projectJSON.constructions?.structureType || "-"}
                                    </TableCell>
                                ))}
                                <TableCell sx={emptyCellSx} />
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Onderkant constructie t.o.v. NAP (m)</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.constructions?.depth)}
                                    </TableCell>
                                ))}
                                <TableCell sx={emptyCellSx} />
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Offset gebruikt</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {s.projectJSON.constructions?.useOffset ? "Ja" : "Nee"}
                                    </TableCell>
                                ))}
                                <TableCell sx={emptyCellSx} />
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Offset afstand (m)</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {s.projectJSON.constructions?.useOffset ? formatNumber(s.projectJSON.constructions?.offsetDistance) : "-"}
                                    </TableCell>
                                ))}
                                <TableCell sx={emptyCellSx} />
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Offset zijde</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {s.projectJSON.constructions?.useOffset ? (s.projectJSON.constructions?.offsetSide === 'left' ? 'Links' : 'Rechts') : "-"}
                                    </TableCell>
                                ))}
                                <TableCell sx={emptyCellSx} />
                            </TableRow>

                            {/* Cost Data */}
                            <TableRow>
                                <TableCell colSpan={snapshots.length + 2} sx={{ fontSize: "13px", fontWeight: 600, padding: "12px 8px", backgroundColor: "#f5f5f5", border: 0 }}>
                                    Kosten
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Complexiteit</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {s.projectJSON.costs.complexity || "-"}
                                    </TableCell>
                                ))}
                                <TableCell sx={emptyCellSx} />
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Totale Directe Kosten (€)</TableCell>
                                {snapshots.map((s) => {
                                    const directTotal = (Object.values(s.projectJSON.costs.directCostGroundWork || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number) + (Object.values(s.projectJSON.costs.directCostStructures || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number);
                                    return (
                                        <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                            {formatNumber(directTotal)}
                                        </TableCell>
                                    );
                                })}
                                <TableCell sx={emptyCellSx} />
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Totale Indirecte Kosten (€)</TableCell>
                                {snapshots.map((s) => {
                                    const indirectTotal = (Object.values(s.projectJSON.costs.indirectConstructionCosts || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number) + (Object.values(s.projectJSON.costs.engineeringCosts || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number) + (Object.values(s.projectJSON.costs.otherCosts || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number);
                                    return (
                                        <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                            {formatNumber(indirectTotal)}
                                        </TableCell>
                                    );
                                })}
                                <TableCell sx={emptyCellSx} />
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9', backgroundColor: "#f9f9f9" }}>
                                <TableCell sx={{ fontSize: "12px", fontWeight: 600, border: 0 }}>Totale Kosten (€)</TableCell>
                                {snapshots.map((s) => {
                                    const directTotal = (Object.values(s.projectJSON.costs.directCostGroundWork || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number) + (Object.values(s.projectJSON.costs.directCostStructures || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number);
                                    const indirectTotal = (Object.values(s.projectJSON.costs.indirectConstructionCosts || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number) + (Object.values(s.projectJSON.costs.engineeringCosts || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number) + (Object.values(s.projectJSON.costs.otherCosts || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number);
                                    return (
                                        <TableCell key={s.id} align="right" sx={{ fontSize: "12px", fontWeight: 600, border: 0 }}>
                                            {formatNumber(directTotal + indirectTotal)}
                                        </TableCell>
                                    );
                                })}
                                <TableCell sx={emptyCellSx} />
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Risicoreservering (%)</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.costs.risicoreservering)}
                                    </TableCell>
                                ))}
                                <TableCell sx={emptyCellSx} />
                            </TableRow>

                            {/* 1. Wonen en leefomgeving */}
                            <TableRow>
                                <TableCell colSpan={snapshots.length + 2} sx={{ fontSize: "13px", fontWeight: 600, padding: "12px 8px", backgroundColor: "#f5f5f5", border: 0 }}>
                                    1. Wonen en leefomgeving
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>BAG panden [aantal]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {s.projectJSON.effects.intersectingPanden?.length || ""}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("bag_panden", "BAG 3D")} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>BAG panden [m²]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.effects.intersectingPandenArea)}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("bag_panden", "BAG 3D")} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Invloedzone BAG panden [aantal]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {s.projectJSON.effects.intersectingPandenBuffer?.length || ""}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("bag_panden", "BAG 3D")} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Invloedzone BAG panden [m²]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.effects.intersectingPandenBufferArea)}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("bag_panden", "BAG 3D")} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Percelen [aantal]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {s.projectJSON.effects.intersectingPercelen?.length || ""}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("kadastrale_percelen", "DKK - perceel")} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Percelen [m²]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.effects.intersectingPercelenArea)}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("kadastrale_percelen", "DKK - perceel")} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Erven [aantal]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {s.projectJSON.effects.intersectingErven?.length || ""}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle="BGT - onbegroeid terreindeel" /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Erven [m²]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.effects.intersectingErvenArea)}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle="BGT - onbegroeid terreindeel" /></TableCell>
                            </TableRow>

                            {/* 2. Natuur */}
                            <TableRow>
                                <TableCell colSpan={snapshots.length + 2} sx={{ fontSize: "13px", fontWeight: 600, padding: "12px 8px", backgroundColor: "#f5f5f5", border: 0 }}>
                                    2. Natuur
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Natura 2000 [m²]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.effects.intersectingNatura2000)}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("natura2000", "Natura 2000")} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>GNN [m²]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.effects.intersectingGNN)}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("gnn", "Groene Ontwikkelingszone en Gelders NatuurNetwerk")} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>NBP beheertype [m²]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.effects.intersectingBeheertypeArea)}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("nbp_beheertype", model.natuurbeheerplanLayerName)} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Beheertypen [naam]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {s.projectJSON.effects.intersectingBeheertypen?.join(", ") || "-"}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("nbp_beheertype", model.natuurbeheerplanLayerName)} /></TableCell>
                            </TableRow>

                            {/* 3. Verkeer */}
                            <TableRow>
                                <TableCell colSpan={snapshots.length + 2} sx={{ fontSize: "13px", fontWeight: 600, padding: "12px 8px", backgroundColor: "#f5f5f5", border: 0 }}>
                                    3. Verkeer
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>BGT wegdelen [m²]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.effects.intersectingWegdelen2dRuimtebeslag)}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("bgt_wegdeel", "BGT - wegdeel")} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>BGT afritten [m²]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.effects.intersectingInritten2dRuimtebeslag)}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("bgt_afritten", "BGT - wegdeel")} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>BGT afritten [aantal]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {s.projectJSON.effects.intersectingInritten2dRuimtebeslagCount?.length || ""}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("bgt_afritten", "BGT - wegdeel")} /></TableCell>
                            </TableRow>

                            {/* 4. Uitvoering */}
                            <TableRow>
                                <TableCell colSpan={snapshots.length + 2} sx={{ fontSize: "13px", fontWeight: 600, padding: "12px 8px", backgroundColor: "#f5f5f5", border: 0 }}>
                                    4. Uitvoering
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Wegoppervlak in uitvoeringszone [m²]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.effects.uitvoeringszoneWegoppervlak)}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("bgt_wegdeel", "BGT - wegdeel")} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Panden in uitvoeringszone [aantal]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {s.projectJSON.effects.uitvoeringszonePanden?.length || ""}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("bag_panden", "BAG 3D")} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Panden in uitvoeringszone [m²]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.effects.uitvoeringszonePandenArea)}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("bag_panden", "BAG 3D")} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Percelen in uitvoeringszone [aantal]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {s.projectJSON.effects.uitvoeringszonePercelen?.length || ""}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("kadastrale_percelen", "DKK - perceel")} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Percelen in uitvoeringszone [m²]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.effects.uitvoeringszonePercelenArea)}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("kadastrale_percelen", "DKK - perceel")} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>Natura 2000 in uitvoeringszone [m²]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.effects.uitvoeringszoneNatura2000)}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("natura2000", "Natura 2000")} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>GNN in uitvoeringszone [m²]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.effects.uitvoeringszoneGNN)}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("gnn", "Groene Ontwikkelingszone en Gelders NatuurNetwerk")} /></TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>NBP beheertype in uitvoeringszone [m²]</TableCell>
                                {snapshots.map((s) => (
                                    <TableCell key={s.id} align="right" sx={{ fontSize: "12px", border: 0 }}>
                                        {formatNumber(s.projectJSON.effects.uitvoeringszoneBeheertypeArea)}
                                    </TableCell>
                                ))}
                                <TableCell sx={btnCellSx}><LayerMenuButton layerTitle={getDisplayLayer("nbp_beheertype", model.natuurbeheerplanLayerName)} /></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    </TableContainer>
                </Box>
            )}

            {/* Tab 1: Charts */}
            {currentTab === 1 && (
                <Box sx={{ overflow: "auto", flex: 1 }}>
                    <ComparisonCharts snapshots={snapshots} />
                </Box>
            )}
        </Paper>
    );
};

export default ComparisonDataPanel;
