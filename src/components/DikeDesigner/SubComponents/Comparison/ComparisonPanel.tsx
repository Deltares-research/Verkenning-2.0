import React, { useRef } from "react";
import Stack from "@vertigis/web/ui/Stack";
import Button from "@vertigis/web/ui/Button";
import Paper from "@vertigis/web/ui/Paper";
import Typography from "@vertigis/web/ui/Typography";
import Box from "@vertigis/web/ui/Box";
import { useWatchAndRerender } from "@vertigis/web/ui";
import { Delete as DeleteIcon, Download as DownloadIcon, Clear as ClearIcon, Add as AddIcon, Visibility as VisibilityIcon } from "@mui/icons-material";
import type DikeDesignerModel from "../../DikeDesignerModel";
import { type ProjectJSON, buildProjectJSON } from "../../Functions/SaveProjectFunctions";
import Graphic from "@arcgis/core/Graphic";

interface DesignSnapshot {
    id: string;
    name: string;
    timestamp: string;
    data: {
        designValues: {
            trajectLength: number | null;
            volumeDifference: number | null;
            excavationVolume: number | null;
            fillVolume: number | null;
            area2d: number | null;
            area3d: number | null;
        };
        costs: {
            complexity: string | null;
            depth: number | null;
            totalDirectCost?: number;
            totalIndirectCost?: number;
            risicoreservering: number | null;
        };
        effects: {
            intersectingPanden: number;
            intersectingBomen: number;
            intersectingPercelen: number;
            intersectingPercelenArea: number | null;
            intersectingNatura2000: number | null;
            intersectingGNN: number | null;
        };
        constructions: {
            structureType: string;
            depth: number;
            structureCount: number;
        };
        geometry: {
            design2d: any[];
            design3d: any[];
            inputLine: any[];
        };
    };
}

interface ComparisonPanelProps {
    model: DikeDesignerModel;
}

const ComparisonPanel: React.FC<ComparisonPanelProps> = ({ model }) => {
    const designFileInputRef = useRef<HTMLInputElement>(null);
    
    // Use model property for persistent storage across tab switches
    useWatchAndRerender(model, "comparisonSnapshots");
    const snapshots = model.comparisonSnapshots || [];
    console.log("ComparisonPanel rendering, snapshots.length:", snapshots.length);

    const projectJsonToSnapshot = (projectData: ProjectJSON): DesignSnapshot => {
        // Calculate costs from the saved cost data
        const costData = projectData.costs;
        const groundWork = Object.values(costData.directCostGroundWork || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number;
        const structures = Object.values(costData.directCostStructures || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number;
        const indirect = Object.values(costData.indirectConstructionCosts || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number;
        const engineering = Object.values(costData.engineeringCosts || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number;
        const other = Object.values(costData.otherCosts || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number;
        const realEstate = Object.values(costData.realEstateCosts || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number;

        const designName = projectData.metadata.vak && projectData.metadata.alternatief
            ? `${projectData.metadata.vak} - ${projectData.metadata.alternatief}`
            : `Design ${Date.now()}`;

        return {
            id: Date.now().toString(),
            name: designName,
            timestamp: new Date().toLocaleString("nl-NL"),
            data: {
                designValues: {
                    trajectLength: projectData.designValues.trajectLength || null,
                    volumeDifference: projectData.designValues.volumeDifference || null,
                    excavationVolume: projectData.designValues.excavationVolume || null,
                    fillVolume: projectData.designValues.fillVolume || null,
                    area2d: projectData.designValues.area2d || null,
                    area3d: projectData.designValues.area3d || null,
                },
                costs: {
                    complexity: costData.complexity || null,
                    depth: costData.depth || null,
                    totalDirectCost: groundWork + structures,
                    totalIndirectCost: indirect + engineering + other + realEstate,
                    risicoreservering: costData.risicoreservering || null,
                },
                effects: {
                    intersectingPanden: Array.isArray(projectData.effects.intersectingPanden) ? projectData.effects.intersectingPanden.length : 0,
                    intersectingBomen: Array.isArray(projectData.effects.intersectingBomen) ? projectData.effects.intersectingBomen.length : 0,
                    intersectingPercelen: Array.isArray(projectData.effects.intersectingPercelen) ? projectData.effects.intersectingPercelen.length : 0,
                    intersectingPercelenArea: projectData.effects.intersectingPercelenArea || null,
                    intersectingNatura2000: projectData.effects.intersectingNatura2000 || null,
                    intersectingGNN: projectData.effects.intersectingGNN || null,
                },
                constructions: {
                    structureType: projectData.constructions?.structureType || "Geen",
                    depth: projectData.constructions?.depth || 0,
                    structureCount: projectData.constructions?.structures?.length || 0,
                },
                geometry: {
                    design2d: projectData.geometries?.design2d || [],
                    design3d: projectData.geometries?.design3d || [],
                    inputLine: projectData.geometries?.inputLine || [],
                },
            },
        };
    };

    const addCurrentDesign = () => {
        console.log("addCurrentDesign called");
        try {
            console.log("Building project JSON...");
            const projectData = buildProjectJSON(model);
            console.log("Project data built:", projectData);
            
            console.log("Converting to snapshot...");
            const snapshot = projectJsonToSnapshot(projectData);
            console.log("Snapshot created:", snapshot);
            
            console.log("Adding snapshot to model...");
            model.comparisonSnapshots = [...model.comparisonSnapshots, snapshot];
            console.log("New snapshots array:", model.comparisonSnapshots);

            console.log("Showing success notification");
            model.messages.commands.ui.displayNotification.execute({
                id: "currentDesignAdded",
                message: `Huidig ontwerp "${snapshot.name}" is toegevoegd aan de vergelijking.`,
            });
            
            // Also show an alert to make sure user sees it
            model.messages.commands.ui.alert.execute({
                title: "Succes",
                message: `Huidig ontwerp "${snapshot.name}" is toegevoegd aan de vergelijking.`,
            });
        } catch (error) {
            console.error("Error capturing current design:", error);
            console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
            model.messages.commands.ui.alert.execute({
                title: "Error",
                message: `Kon het huidige ontwerp niet vastleggen: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
    };

    const handleFileInputClick = () => {
        if (designFileInputRef.current) {
            designFileInputRef.current.click();
        }
    };

    const handleImportDesignFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const projectData: ProjectJSON = JSON.parse(content);

                // Validate that this is a valid project JSON
                if (!projectData.metadata || !projectData.designValues || !projectData.costs) {
                    model.messages.commands.ui.alert.execute({
                        title: "Import Error",
                        message: "Het geselecteerde bestand is geen geldig ontwerp bestand.",
                    });
                    return;
                }

                const snapshot = projectJsonToSnapshot(projectData);
                model.comparisonSnapshots = [...model.comparisonSnapshots, snapshot];

                model.messages.commands.ui.displayNotification.execute({
                    id: "importSuccess",
                    message: `Ontwerp "${snapshot.name}" is toegevoegd aan de vergelijking.`,
                });
            } catch (error) {
                console.error("Error parsing design file:", error);
                model.messages.commands.ui.alert.execute({
                    title: "Import Error",
                    message: "Kon het ontwerp bestand niet lezen. Controleer of het bestand geldig is.",
                });
            }
        };
        reader.readAsText(file);
        
        // Reset input value so same file can be uploaded again
        event.target.value = "";
    };

    const removeSnapshot = (id: string) => {
        model.comparisonSnapshots = model.comparisonSnapshots.filter((s) => s.id !== id);
    };

    const clearAll = () => {
        model.comparisonSnapshots = [];
    };

    const loadSnapshotOnMap = (snapshot: DesignSnapshot) => {
        try {
            // Clear existing graphics to show only the selected alternative
            model.graphicsLayerTemp.removeAll();
            model.graphicsLayer3dPolygon.removeAll();
            model.graphicsLayerLine.removeAll();
            
            // Load 2D geometries
            if (snapshot.data.geometry.design2d && snapshot.data.geometry.design2d.length > 0) {
                snapshot.data.geometry.design2d.forEach((geomData: any) => {
                    try {
                        if (geomData && geomData.geometry) {
                            const graphic = Graphic.fromJSON(geomData);
                            model.graphicsLayerTemp.add(graphic);
                        }
                    } catch (e) {
                        console.warn("Could not load 2D geometry:", e);
                    }
                });
            }
            
            // Load 3D geometries
            if (snapshot.data.geometry.design3d && snapshot.data.geometry.design3d.length > 0) {
                snapshot.data.geometry.design3d.forEach((geomData: any) => {
                    try {
                        if (geomData && geomData.geometry) {
                            const graphic = Graphic.fromJSON(geomData);
                            model.graphicsLayer3dPolygon.add(graphic);
                        }
                    } catch (e) {
                        console.warn("Could not load 3D geometry:", e);
                    }
                });
            }
            
            // Load input line
            if (snapshot.data.geometry.inputLine && snapshot.data.geometry.inputLine.length > 0) {
                snapshot.data.geometry.inputLine.forEach((geomData: any) => {
                    try {
                        if (geomData && geomData.geometry) {
                            const graphic = Graphic.fromJSON(geomData);
                            model.graphicsLayerLine.add(graphic);
                        }
                    } catch (e) {
                        console.warn("Could not load input line:", e);
                    }
                });
            }
            
            model.messages.commands.ui.displayNotification.execute({
                id: "mapLoaded",
                message: `Ontwerp "${snapshot.name}" is geladen op de kaart.`,
            });
        } catch (error) {
            console.error("Error loading snapshot on map:", error);
            model.messages.commands.ui.alert.execute({
                title: "Error",
                message: `Kon ontwerp niet laden op de kaart: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
    };

    const clearMap = () => {
        try {
            model.graphicsLayerTemp.removeAll();
            model.graphicsLayer3dPolygon.removeAll();
            model.graphicsLayerLine.removeAll();
            model.messages.commands.ui.displayNotification.execute({
                id: "mapCleared",
                message: "Kaart is gewist.",
            });
        } catch (error) {
            console.error("Error clearing map:", error);
        }
    };

    const exportComparison = () => {
        const dataStr = JSON.stringify(snapshots, null, 2);
        const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
        const exportFileDefaultName = `vergelijking_${new Date().toISOString().split("T")[0]}.json`;

        const linkElement = document.createElement("a");
        linkElement.setAttribute("href", dataUri);
        linkElement.setAttribute("download", exportFileDefaultName);
        linkElement.click();
    };

    const formatNumber = (value: any): string => {
        if (typeof value === "number") {
            if (value % 1 === 0) return value.toLocaleString("nl-NL");
            return value.toLocaleString("nl-NL", { maximumFractionDigits: 2 });
        }
        return String(value);
    };

    return (
        <Box style={{ padding: "20px", height: "100%", overflow: "auto" }}>
            <Stack spacing={3}>
                {/* Header */}
                <Box>
                    <Typography variant="h5" style={{ marginBottom: "10px", fontWeight: "bold" }}>
                        Alternatiefen Vergelijken
                    </Typography>
                    <Typography variant="body2" style={{ color: "#666" }}>
                        Importeer meerdere opgeslagen ontwerpen om ze naast elkaar te vergelijken.
                    </Typography>
                </Box>

                {/* Action Buttons */}
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={addCurrentDesign}
                    >
                        Voeg Huidig Ontwerp Toe
                    </Button>
                    <input
                        type="file"
                        accept=".json"
                        ref={designFileInputRef}
                        onChange={handleImportDesignFile}
                        style={{ display: "none" }}
                    />
                    <Button
                        variant="outlined"
                        onClick={handleFileInputClick}
                    >
                        Upload Opgeslagen Alternatief
                    </Button>
                    {snapshots.length > 0 && (
                        <>
                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={exportComparison}
                            >
                                Exporteer Vergelijking
                            </Button>
                            <Button
                                variant="outlined"
                                color="warning"
                                startIcon={<ClearIcon />}
                                onClick={clearMap}
                            >
                                Wis Kaart
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<ClearIcon />}
                                onClick={clearAll}
                            >
                                Wis Alles
                            </Button>
                        </>
                    )}
                </Stack>

                {/* Snapshot Cards */}
                {snapshots.length > 0 && (
                    <Box>
                        <Typography variant="h6" style={{ marginBottom: "15px" }}>
                            Geïmporteerde Alternatieven ({snapshots.length})
                        </Typography>
                        <Stack spacing={2}>
                            {snapshots.map((snapshot) => (
                                <Paper
                                    key={snapshot.id}
                                    style={{
                                        padding: "15px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                    }}
                                >
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="h6">{snapshot.name}</Typography>
                                            <Typography variant="body2" style={{ color: "#666" }}>
                                                Geïmporteerd: {snapshot.timestamp}
                                            </Typography>
                                        </Box>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                color="primary"
                                                size="small"
                                                startIcon={<VisibilityIcon />}
                                                onClick={() => loadSnapshotOnMap(snapshot)}
                                            >
                                                Toon op Kaart
                                            </Button>
                                            <Button
                                                color="error"
                                                size="small"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => removeSnapshot(snapshot.id)}
                                            >
                                                Verwijder
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    </Box>
                )}

                {/* Comparison Table */}
                {snapshots.length > 1 && (
                    <Box>
                        <Typography variant="h6" style={{ marginBottom: "15px" }}>
                            Vergelijkingstabel
                        </Typography>
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
                                                {formatNumber(s.data.designValues.trajectLength)}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Volumeverschil (m³)</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                                {formatNumber(s.data.designValues.volumeDifference)}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Uitgravingsvolume (m³)</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                                {formatNumber(s.data.designValues.excavationVolume)}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Opvulvolume (m³)</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                                {formatNumber(s.data.designValues.fillVolume)}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>2D Oppervlakte (m²)</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                                {formatNumber(s.data.designValues.area2d)}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>3D Oppervlakte (m²)</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                                {formatNumber(s.data.designValues.area3d)}
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
                                                {s.data.costs.complexity || "-"}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Diepte (m)</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                                {formatNumber(s.data.costs.depth)}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Totale Directe Kosten (€)</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                                {formatNumber(s.data.costs.totalDirectCost)}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Totale Indirecte Kosten (€)</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                                {formatNumber(s.data.costs.totalIndirectCost)}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr style={{ fontWeight: "bold", backgroundColor: "#f9f9f9" }}>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Totale Kosten (€)</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                                {formatNumber((s.data.costs.totalDirectCost || 0) + (s.data.costs.totalIndirectCost || 0))}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Risicoreservering (%)</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                                {formatNumber(s.data.costs.risicoreservering)}
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
                                                {s.data.effects.intersectingPanden}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Bomen</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                                {s.data.effects.intersectingBomen}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Percelen</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                                {s.data.effects.intersectingPercelen}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Percelen Oppervlakte (m²)</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                                {formatNumber(s.data.effects.intersectingPercelenArea)}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Natura 2000 (m²)</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                                {formatNumber(s.data.effects.intersectingNatura2000)}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>GNN (m²)</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee" }}>
                                                {formatNumber(s.data.effects.intersectingGNN)}
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
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>2D Geometrie Punten</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee", fontSize: "12px" }}>
                                                {s.data.geometry.design2d?.length || 0} geometrie(ën)
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>3D Geometrie Punten</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee", fontSize: "12px" }}>
                                                {s.data.geometry.design3d?.length || 0} geometrie(ën)
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>Input Lijn Punten</td>
                                        {snapshots.map((s) => (
                                            <td key={s.id} style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #eee", fontSize: "12px" }}>
                                                {s.data.geometry.inputLine?.length || 0} punt(en)
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </Box>
                    </Box>
                )}

                {/* Geometry Viewer */}
                {snapshots.length > 0 && (
                    <Box>
                        <Typography variant="h6" style={{ marginBottom: "15px" }}>
                            Geometriegegevens
                        </Typography>
                        <Stack spacing={2}>
                            {snapshots.map((snapshot) => (
                                <Paper
                                    key={`geom-${snapshot.id}`}
                                    style={{
                                        padding: "15px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                        backgroundColor: "#f9f9f9",
                                    }}
                                >
                                    <Typography variant="h6" style={{ marginBottom: "10px", fontWeight: "bold" }}>
                                        {snapshot.name}
                                    </Typography>
                                    <Stack spacing={1}>
                                        <Typography variant="body2" style={{ fontSize: "12px" }}>
                                            <strong>2D Geometrie:</strong> {snapshot.data.geometry.design2d?.length || 0} object(en)
                                            {snapshot.data.geometry.design2d?.length > 0 && (
                                                <details style={{ marginTop: "5px", cursor: "pointer" }}>
                                                    <summary style={{ fontSize: "11px", color: "#0066cc" }}>Details weergeven</summary>
                                                    <pre style={{ fontSize: "10px", overflow: "auto", maxHeight: "200px", backgroundColor: "#fff", border: "1px solid #ddd", padding: "5px", marginTop: "5px" }}>
                                                        {JSON.stringify(snapshot.data.geometry.design2d, null, 2).substring(0, 500)}...
                                                    </pre>
                                                </details>
                                            )}
                                        </Typography>
                                        <Typography variant="body2" style={{ fontSize: "12px" }}>
                                            <strong>3D Geometrie:</strong> {snapshot.data.geometry.design3d?.length || 0} object(en)
                                            {snapshot.data.geometry.design3d?.length > 0 && (
                                                <details style={{ marginTop: "5px", cursor: "pointer" }}>
                                                    <summary style={{ fontSize: "11px", color: "#0066cc" }}>Details weergeven</summary>
                                                    <pre style={{ fontSize: "10px", overflow: "auto", maxHeight: "200px", backgroundColor: "#fff", border: "1px solid #ddd", padding: "5px", marginTop: "5px" }}>
                                                        {JSON.stringify(snapshot.data.geometry.design3d, null, 2).substring(0, 500)}...
                                                    </pre>
                                                </details>
                                            )}
                                        </Typography>
                                        <Typography variant="body2" style={{ fontSize: "12px" }}>
                                            <strong>Input Lijn:</strong> {snapshot.data.geometry.inputLine?.length || 0} punt(en)
                                            {snapshot.data.geometry.inputLine?.length > 0 && (
                                                <details style={{ marginTop: "5px", cursor: "pointer" }}>
                                                    <summary style={{ fontSize: "11px", color: "#0066cc" }}>Details weergeven</summary>
                                                    <pre style={{ fontSize: "10px", overflow: "auto", maxHeight: "200px", backgroundColor: "#fff", border: "1px solid #ddd", padding: "5px", marginTop: "5px" }}>
                                                        {JSON.stringify(snapshot.data.geometry.inputLine, null, 2).substring(0, 500)}...
                                                    </pre>
                                                </details>
                                            )}
                                        </Typography>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    </Box>
                )}

                {/* Empty State */}
                {snapshots.length === 0 && (
                    <Paper style={{ padding: "40px", textAlign: "center", backgroundColor: "#f9f9f9" }}>
                        <Typography variant="h6" style={{ marginBottom: "10px", color: "#666" }}>
                            Geen Alternatieven Geïmporteerd
                        </Typography>
                        <Typography variant="body2" style={{ color: "#999" }}>
                            Klik op "Upload Nieuw Alternatief" om een opgeslagen ontwerp te importeren.
                        </Typography>
                    </Paper>
                )}
            </Stack>
        </Box>
    );
};

export default ComparisonPanel;
