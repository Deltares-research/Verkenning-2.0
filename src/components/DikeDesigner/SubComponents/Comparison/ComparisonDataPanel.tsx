import React, { useState } from "react";
import Box from "@vertigis/web/ui/Box";
import Typography from "@vertigis/web/ui/Typography";
import Paper from "@vertigis/web/ui/Paper";
import IconButton from "@vertigis/web/ui/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { useWatchAndRerender } from "@vertigis/web/ui";
import type DikeDesignerModel from "../../DikeDesignerModel";

import type { ProjectJSON } from "../../Functions/SaveProjectFunctions";

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
    useWatchAndRerender(model, "comparisonSnapshots");
    const snapshots = model.comparisonSnapshots || [];

    const formatNumber = (value: any): string => {
        if (typeof value === "number") {
            if (value % 1 === 0) return value.toLocaleString("nl-NL");
            return value.toLocaleString("nl-NL", { maximumFractionDigits: 2 });
        }
        return String(value);
    };

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
                <Typography variant="h6" sx={{ fontWeight: 600, margin: 0, fontSize: "12px", color: "white" }}>
                    Vergelijkingstabel
                </Typography>
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

            {/* Content */}
            <Box sx={{ padding: "20px", overflow: "auto", flex: 1 }}>
                <Box style={{ overflowX: "auto" }}>
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        border: "1px solid #ddd",
                    }}
                >
                    <thead>
                        <tr style={{ backgroundColor: "#f5f5f5" }}>
                            <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #ddd", fontWeight: "bold" }}>
                                Criterium
                            </th>
                            {snapshots.map((snapshot) => (
                                <th
                                    key={snapshot.id}
                                    style={{
                                        padding: "12px",
                                        textAlign: "right",
                                        borderBottom: "2px solid #ddd",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {snapshot.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Design Values */}
                        <tr style={{ backgroundColor: "#fafafa" }}>
                            <td colSpan={snapshots.length + 1} style={{ padding: "8px", fontWeight: "bold" }}>
                                Ontwerpwaarden
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Trajectlengte (m)</td>
                            {snapshots.map((s) => (
                                <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                    {formatNumber(s.projectJSON.designValues.trajectLength)}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Volumeverschil (m³)</td>
                            {snapshots.map((s) => (
                                <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                    {formatNumber(s.projectJSON.designValues.volumeDifference)}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Uitgravingsvolume (m³)</td>
                            {snapshots.map((s) => (
                                <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                    {formatNumber(s.projectJSON.designValues.excavationVolume)}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Opvulvolume (m³)</td>
                            {snapshots.map((s) => (
                                <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                    {formatNumber(s.projectJSON.designValues.fillVolume)}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>2D Oppervlakte (m²)</td>
                            {snapshots.map((s) => (
                                <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                    {formatNumber(s.projectJSON.designValues.area2d)}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>3D Oppervlakte (m²)</td>
                            {snapshots.map((s) => (
                                <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                    {formatNumber(s.projectJSON.designValues.area3d)}
                                </td>
                            ))}
                        </tr>

                        {/* Cost Data */}
                        <tr style={{ backgroundColor: "#fafafa" }}>
                            <td colSpan={snapshots.length + 1} style={{ padding: "8px", fontWeight: "bold" }}>
                                Kosten
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Complexiteit</td>
                            {snapshots.map((s) => (
                                <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                    {s.projectJSON.costs.complexity || "-"}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Diepte (m)</td>
                            {snapshots.map((s) => (
                                <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                    {formatNumber(s.projectJSON.costs.depth)}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Totale Directe Kosten (€)</td>
                            {snapshots.map((s) => {
                                const directTotal = (Object.values(s.projectJSON.costs.directCostGroundWork || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number) + (Object.values(s.projectJSON.costs.directCostStructures || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number);
                                return (
                                    <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                        {formatNumber(directTotal)}
                                    </td>
                                );
                            })}
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Totale Indirecte Kosten (€)</td>
                            {snapshots.map((s) => {
                                const indirectTotal = (Object.values(s.projectJSON.costs.indirectConstructionCosts || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number) + (Object.values(s.projectJSON.costs.engineeringCosts || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number) + (Object.values(s.projectJSON.costs.otherCosts || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number);
                                return (
                                    <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                        {formatNumber(indirectTotal)}
                                    </td>
                                );
                            })}
                        </tr>
                        <tr style={{ fontWeight: "bold", backgroundColor: "#f9f9f9" }}>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Totale Kosten (€)</td>
                            {snapshots.map((s) => {
                                const directTotal = (Object.values(s.projectJSON.costs.directCostGroundWork || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number) + (Object.values(s.projectJSON.costs.directCostStructures || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number);
                                const indirectTotal = (Object.values(s.projectJSON.costs.indirectConstructionCosts || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number) + (Object.values(s.projectJSON.costs.engineeringCosts || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number) + (Object.values(s.projectJSON.costs.otherCosts || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number);
                                return (
                                    <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                        {formatNumber(directTotal + indirectTotal)}
                                    </td>
                                );
                            })}
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Risicoreservering (%)</td>
                            {snapshots.map((s) => (
                                <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                    {formatNumber(s.projectJSON.costs.risicoreservering)}
                                </td>
                            ))}
                        </tr>

                        {/* Effects */}
                        <tr style={{ backgroundColor: "#fafafa" }}>
                            <td colSpan={snapshots.length + 1} style={{ padding: "8px", fontWeight: "bold" }}>
                                Effecten
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Panden</td>
                            {snapshots.map((s) => (
                                <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                    {s.projectJSON.effects.intersectingPanden.length}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Bomen</td>
                            {snapshots.map((s) => (
                                <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                    {s.projectJSON.effects.intersectingBomen.length}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Percelen</td>
                            {snapshots.map((s) => (
                                <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                    {s.projectJSON.effects.intersectingPercelen.length}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Percelen Oppervlakte (m²)</td>
                            {snapshots.map((s) => (
                                <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                    {formatNumber(s.projectJSON.effects.intersectingPercelenArea)}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Natura 2000 (m²)</td>
                            {snapshots.map((s) => (
                                <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                    {formatNumber(s.projectJSON.effects.intersectingNatura2000)}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>GNN (m²)</td>
                            {snapshots.map((s) => (
                                <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                    {formatNumber(s.projectJSON.effects.intersectingGNN)}
                                </td>
                            ))}
                        </tr>

                        {/* Geometry */}
                        <tr style={{ backgroundColor: "#fafafa" }}>
                            <td colSpan={snapshots.length + 1} style={{ padding: "8px", fontWeight: "bold" }}>
                                Geometrie
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>2D Ruimtebeslag Punten</td>
                            {snapshots.map((s) => (
                                <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee", fontSize: "12px" }}>
                                    {s.projectJSON.geometries?.ruimtebeslag2d?.length || 0} geom(s)
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>3D Ontwerp Punten</td>
                            {snapshots.map((s) => (
                                <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee", fontSize: "12px" }}>
                                    {s.projectJSON.geometries?.design3d?.length || 0} geom(s)
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
                </Box>
            </Box>
        </Paper>
    );
};

export default ComparisonDataPanel;
