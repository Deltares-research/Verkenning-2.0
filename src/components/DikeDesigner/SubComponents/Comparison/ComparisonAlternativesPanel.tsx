import React, { useRef, useState, useEffect, useCallback } from "react";
import Stack from "@vertigis/web/ui/Stack";
import Button from "@vertigis/web/ui/Button";
import Paper from "@vertigis/web/ui/Paper";
import Typography from "@vertigis/web/ui/Typography";
import Box from "@vertigis/web/ui/Box";
import Tooltip from "@mui/material/Tooltip";
import { useWatchAndRerender } from "@vertigis/web/ui";
import { Assessment as AssessmentIcon, Upload as UploadIcon, Autorenew as AutorenewIcon, CheckCircle as CheckCircleIcon, FileDownload as FileDownloadIcon, ZoomInMap as ZoomInMapIcon } from "@mui/icons-material";
import * as XLSX from "xlsx";
import type DikeDesignerModel from "../../DikeDesignerModel";
import type { ProjectJSON } from "../../Functions/SaveProjectFunctions";
import LoadOptionDialog from "../Dimensions/LoadOptionDialog";
import {
    formatDateTime,
    toggleSnapshotLayerVisibility,
    handleLoadFull,
    handleLoadAndRecalculate,
    handleRecalculateSnapshot,
    handleImportDesignFile,
    removeSnapshot,
    loadSnapshot,
    initializeComparison,
    syncVisibilityState,
    ensureSnapshotLayer,
} from "./ComparisonFunctions";

interface ComparisonAlternativesPanelProps {
    model: DikeDesignerModel;
}

const ComparisonAlternativesPanel: React.FC<ComparisonAlternativesPanelProps> = ({ model }) => {
    const designFileInputRef = useRef<HTMLInputElement>(null);
    const [loadOptionDialogOpen, setLoadOptionDialogOpen] = useState(false);
    const [pendingProjectData, setPendingProjectData] = useState<ProjectJSON | null>(null);

    const [, forceUpdate] = useState(0);

    // Use model property for persistent storage across tab switches
    useWatchAndRerender(model, "comparisonSnapshots");
    useWatchAndRerender(model, "activeSnapshotId");
    const snapshots = model.comparisonSnapshots || [];
    const layerVisibility = model.comparisonModel.layerVisibility;
    const activeSnapshotId = model.activeSnapshotId || "";

    const handleToggleVisibility = (snapshot: any, type: "ruimtebeslag2d" | "design3d" | "constructionLine" | "mesh") => {
        toggleSnapshotLayerVisibility(model, snapshot, type);
        forceUpdate(n => n + 1);
    };

    // Sync visibility state with actual layer visibility
    useEffect(() => {
        syncVisibilityState(model);
    });

    // Initialize with current design as first alternative
    useEffect(() => {
        initializeComparison(model);
    }, []); // Run only once on mount

    const handleFileInputClick = () => {
        if (designFileInputRef.current) {
            designFileInputRef.current.click();
        }
    };

    const handleLoadOptionDialogClose = () => {
        setLoadOptionDialogOpen(false);
        setPendingProjectData(null);
    };

    const onLoadFull = () => {
        if (!pendingProjectData) return;
        handleLoadFull(model, pendingProjectData);
        handleLoadOptionDialogClose();
    };

    const onLoadAndRecalculate = async () => {
        if (!pendingProjectData) return;
        await handleLoadAndRecalculate(model, pendingProjectData);
        handleLoadOptionDialogClose();
    };

    const onImportDesignFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        handleImportDesignFile(model, file, (projectData) => {
            setPendingProjectData(projectData);
            setLoadOptionDialogOpen(true);
        });
        event.target.value = "";
    };

    const handleZoomToSnapshot = (snapshot: any) => {
        const layer = ensureSnapshotLayer(model, snapshot, "design3d");
        if (!layer || !layer.graphics.length || !model.view) return;

        let unionExtent: __esri.Extent | null = null;
        layer.graphics.forEach((graphic: any) => {
            if (graphic.geometry?.extent) {
                unionExtent = unionExtent ? unionExtent.union(graphic.geometry.extent) : graphic.geometry.extent;
            }
        });
        if (unionExtent) {
            model.view.goTo(unionExtent.expand(1.3));
        }
    };

    const exportToExcel = useCallback(() => {
        const rows: any[][] = [];
        const sectionRowIndices: number[] = [];
        const colCount = snapshots.length + 1;

        // Title row
        rows.push(["Vergelijkingstabel", ...snapshots.map(() => "")]);
        const titleRowIdx = 0;

        // Empty separator row
        rows.push([]);

        // Header row
        rows.push(["Criterium", ...snapshots.map((s) => s.name)]);
        const headerRowIdx = rows.length - 1;

        const addSection = (title: string) => {
            rows.push([]);  // empty row before section
            sectionRowIndices.push(rows.length);
            rows.push([title, ...snapshots.map(() => "")]);
        };
        const addRow = (label: string, values: (string | number)[]) => rows.push([label, ...values]);
        const num = (v: any): number | string => { if (v == null) return ""; const n = Number(v); return isNaN(n) ? "" : Math.round(n); };
        const count = (v: any[] | null | undefined): number | string => (v != null ? v.length : "");
        const sumValues = (obj: any): number => Object.values(obj || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number;

        addSection("Ontwerpwaarden");
        addRow("Trajectlengte (m)", snapshots.map((s) => num(s.projectJSON.designValues.trajectLength)));
        addRow("Volumeverschil (m\u00B3)", snapshots.map((s) => num(s.projectJSON.designValues.volumeDifference)));
        addRow("Uitgravingsvolume (m\u00B3)", snapshots.map((s) => num(s.projectJSON.designValues.excavationVolume)));
        addRow("Opvulvolume (m\u00B3)", snapshots.map((s) => num(s.projectJSON.designValues.fillVolume)));
        addRow("2D Oppervlakte (m\u00B2)", snapshots.map((s) => num(s.projectJSON.designValues.area2d)));
        addRow("3D Oppervlakte (m\u00B2)", snapshots.map((s) => num(s.projectJSON.designValues.area3d)));

        addSection("Constructie");
        addRow("Type constructie", snapshots.map((s) => s.projectJSON.constructions?.structureType || ""));
        addRow("Onderkant constructie t.o.v. NAP (m)", snapshots.map((s) => num(s.projectJSON.constructions?.depth)));
        addRow("Offset gebruikt", snapshots.map((s) => s.projectJSON.constructions?.useOffset ? "Ja" : "Nee"));
        addRow("Offset afstand (m)", snapshots.map((s) => s.projectJSON.constructions?.useOffset ? num(s.projectJSON.constructions?.offsetDistance) : ""));
        addRow("Offset zijde", snapshots.map((s) => s.projectJSON.constructions?.useOffset ? (s.projectJSON.constructions?.offsetSide === 'left' ? 'Links' : 'Rechts') : ""));

        addSection("Kosten");
        addRow("Complexiteit", snapshots.map((s) => s.projectJSON.costs.complexity || ""));
        addRow("Totale Directe Kosten (\u20AC)", snapshots.map((s) => Math.round(sumValues(s.projectJSON.costs.directCostGroundWork) + sumValues(s.projectJSON.costs.directCostStructures))));
        addRow("Totale Indirecte Kosten (\u20AC)", snapshots.map((s) => Math.round(sumValues(s.projectJSON.costs.indirectConstructionCosts) + sumValues(s.projectJSON.costs.engineeringCosts) + sumValues(s.projectJSON.costs.otherCosts))));
        addRow("Totale Kosten (\u20AC)", snapshots.map((s) => Math.round(sumValues(s.projectJSON.costs.directCostGroundWork) + sumValues(s.projectJSON.costs.directCostStructures) + sumValues(s.projectJSON.costs.indirectConstructionCosts) + sumValues(s.projectJSON.costs.engineeringCosts) + sumValues(s.projectJSON.costs.otherCosts))));
        addRow("Risicoreservering (%)", snapshots.map((s) => num(s.projectJSON.costs.risicoreservering)));

        addSection("1. Wonen en leefomgeving");
        addRow("BAG panden [aantal]", snapshots.map((s) => count(s.projectJSON.effects.intersectingPanden)));
        addRow("BAG panden [m\u00B2]", snapshots.map((s) => num(s.projectJSON.effects.intersectingPandenArea)));
        addRow("Invloedzone BAG panden [aantal]", snapshots.map((s) => count(s.projectJSON.effects.intersectingPandenBuffer)));
        addRow("Invloedzone BAG panden [m\u00B2]", snapshots.map((s) => num(s.projectJSON.effects.intersectingPandenBufferArea)));
        addRow("Percelen [aantal]", snapshots.map((s) => count(s.projectJSON.effects.intersectingPercelen)));
        addRow("Percelen [m\u00B2]", snapshots.map((s) => num(s.projectJSON.effects.intersectingPercelenArea)));
        addRow("Erven [aantal]", snapshots.map((s) => count(s.projectJSON.effects.intersectingErven)));
        addRow("Erven [m\u00B2]", snapshots.map((s) => num(s.projectJSON.effects.intersectingErvenArea)));

        addSection("2. Natuur");
        addRow("Natura 2000 [m\u00B2]", snapshots.map((s) => num(s.projectJSON.effects.intersectingNatura2000)));
        addRow("GNN [m\u00B2]", snapshots.map((s) => num(s.projectJSON.effects.intersectingGNN)));
        addRow("NBP beheertype [m\u00B2]", snapshots.map((s) => num(s.projectJSON.effects.intersectingBeheertypeArea)));
        addRow("Beheertypen [naam]", snapshots.map((s) => s.projectJSON.effects.intersectingBeheertypen?.join(", ") || ""));

        addSection("3. Verkeer");
        addRow("BGT wegdelen [m\u00B2]", snapshots.map((s) => num(s.projectJSON.effects.intersectingWegdelen2dRuimtebeslag)));
        addRow("BGT afritten [m\u00B2]", snapshots.map((s) => num(s.projectJSON.effects.intersectingInritten2dRuimtebeslag)));
        addRow("BGT afritten [aantal]", snapshots.map((s) => count(s.projectJSON.effects.intersectingInritten2dRuimtebeslagCount)));

        addSection("4. Uitvoering");
        addRow("Wegoppervlak in uitvoeringszone [m\u00B2]", snapshots.map((s) => num(s.projectJSON.effects.uitvoeringszoneWegoppervlak)));
        addRow("Panden in uitvoeringszone [aantal]", snapshots.map((s) => count(s.projectJSON.effects.uitvoeringszonePanden)));
        addRow("Panden in uitvoeringszone [m\u00B2]", snapshots.map((s) => num(s.projectJSON.effects.uitvoeringszonePandenArea)));
        addRow("Percelen in uitvoeringszone [aantal]", snapshots.map((s) => count(s.projectJSON.effects.uitvoeringszonePercelen)));
        addRow("Percelen in uitvoeringszone [m\u00B2]", snapshots.map((s) => num(s.projectJSON.effects.uitvoeringszonePercelenArea)));
        addRow("Natura 2000 in uitvoeringszone [m\u00B2]", snapshots.map((s) => num(s.projectJSON.effects.uitvoeringszoneNatura2000)));
        addRow("GNN in uitvoeringszone [m\u00B2]", snapshots.map((s) => num(s.projectJSON.effects.uitvoeringszoneGNN)));
        addRow("NBP beheertype in uitvoeringszone [m\u00B2]", snapshots.map((s) => num(s.projectJSON.effects.uitvoeringszoneBeheertypeArea)));

        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Set column widths: first column wide for labels, rest for data
        ws["!cols"] = [
            { wch: 42 },
            ...snapshots.map(() => ({ wch: 22 })),
        ];

        // Merge title row across all columns
        ws["!merges"] = [
            { s: { r: titleRowIdx, c: 0 }, e: { r: titleRowIdx, c: colCount - 1 } },
            // Merge section header rows across all columns
            ...sectionRowIndices.map((rowIdx) => ({
                s: { r: rowIdx, c: 0 },
                e: { r: rowIdx, c: colCount - 1 },
            })),
        ];

        // Apply number format to numeric data cells
        const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
        for (let r = range.s.r; r <= range.e.r; r++) {
            for (let c = 1; c <= range.e.c; c++) {
                const addr = XLSX.utils.encode_cell({ r, c });
                const cell = ws[addr];
                if (cell && typeof cell.v === "number") {
                    cell.z = "#,##0";
                }
            }
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Vergelijking");
        XLSX.writeFile(wb, `vergelijkingstabel_${new Date().toISOString().split("T")[0]}.xlsx`);
    }, [snapshots]);

    return (
        <Box style={{ padding: "20px", height: "100%", overflow: "auto", display: "flex", flexDirection: "column" }}>
            <Stack spacing={3}>
                {/* Header */}
                <Box>
                    <Typography variant="h5" style={{ marginBottom: "8px", fontWeight: "bold" }}>
                        Alternatieven Beheren
                    </Typography>
                    <Typography variant="body2" style={{ color: "#666" }}>
                        Voeg ontwerpen toe en beheer welke je wilt vergelijken.
                    </Typography>
                </Box>

                {/* Action Buttons */}
                <Paper style={{ padding: "16px", backgroundColor: "#f8f9fa" }}>
                    <Stack spacing={2}>
                        {/* Primary Actions */}
                        <Stack spacing={1.5}>
                            <input
                                type="file"
                                accept=".json"
                                ref={designFileInputRef}
                                onChange={onImportDesignFile}
                                style={{ display: "none" }}
                            />
                            <Button
                                variant="contained"
                                startIcon={<UploadIcon />}
                                onClick={handleFileInputClick}
                                size="medium"
                                fullWidth
                                sx={{
                                    backgroundColor: "#0078d4",
                                    color: "#fff",
                                    textTransform: "none",
                                    boxShadow: "none",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        backgroundColor: "#106ebe",
                                        boxShadow: "none",
                                    },
                                }}
                            >
                                Upload Alternatief
                            </Button>
                            <LoadOptionDialog
                                open={loadOptionDialogOpen}
                                onClose={handleLoadOptionDialogClose}
                                onLoadFull={onLoadFull}
                                onLoadAndRecalculate={onLoadAndRecalculate}
                                isLoading={model.loading}
                            />
                        </Stack>

                        {/* Comparison Table Button - Prominent */}
                        {snapshots.length > 0 && (
                            <Button
                                variant="contained"
                                color="success"
                                fullWidth
                                size="medium"
                                startIcon={<AssessmentIcon />}
                                onClick={() => {
                                    if (snapshots.length < 2) {
                                        model.messages.commands.ui.alert.execute({
                                            title: "Meer alternatieven nodig",
                                            message: "Voeg minstens 2 alternatieven toe om ze te kunnen vergelijken.",
                                        });
                                    } else {
                                        model.comparisonPanelVisible = true;
                                    }
                                }}
                                disabled={snapshots.length < 2}
                                style={{
                                    padding: "8px 16px",
                                    fontWeight: 600,
                                }}
                            >
                                Vergelijkingstabel ({snapshots.length} alternatieven)
                            </Button>
                        )}
                    </Stack>
                </Paper>

                {/* Snapshot Cards */}
                {snapshots.length > 0 && (
                    <Box>
                        <Typography variant="h6" style={{ marginBottom: "12px", fontWeight: "600" }}>
                            Geïmporteerde Alternatieven ({snapshots.length})
                        </Typography>
                        <Stack spacing={2}>
                            {snapshots.map((snapshot) => {
                                const isActive = snapshot.id === activeSnapshotId;
                                return (
                                <Paper
                                    key={snapshot.id}
                                    elevation={isActive ? 3 : 1}
                                    style={{
                                        padding: "14px 16px",
                                        border: isActive ? "2px solid #1565C0" : "1px solid #e5e7eb",
                                        borderRadius: "10px",
                                        background: isActive
                                            ? "linear-gradient(180deg, #e3f2fd 0%, #f0f7ff 100%)"
                                            : "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
                                        boxShadow: isActive ? "0 2px 8px rgba(21,101,192,0.15)" : "0 1px 2px rgba(0,0,0,0.04)",
                                    }}
                                >
                                    <Stack spacing={1.5}>
                                        <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                                            <Box style={{ flex: 1, minWidth: 0 }}>
                                                <Box style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                                    <Typography variant="subtitle1" style={{ fontWeight: 600 }}>
                                                        {snapshot.name}
                                                    </Typography>
                                                    {isActive && (
                                                        <Typography
                                                            variant="caption"
                                                            style={{
                                                                backgroundColor: "#1565C0",
                                                                color: "#fff",
                                                                padding: "1px 8px",
                                                                borderRadius: "10px",
                                                                fontSize: "10px",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            Actief
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Box style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <Typography variant="caption" style={{ color: "#888", fontSize: "12px" }}>
                                                        Berekend: {formatDateTime(snapshot.projectJSON.metadata?.lastModified || snapshot.projectJSON.metadata?.createdAt)}
                                                    </Typography>
                                                    {snapshot.recalculated && (
                                                        <Tooltip title="Volledig herberekend in deze sessie" placement="top">
                                                            <CheckCircleIcon 
                                                                style={{ 
                                                                    fontSize: "16px", 
                                                                    color: "#10b981",
                                                                    verticalAlign: "middle"
                                                                }} 
                                                            />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </Box>
                                            <Box style={{ display: "flex", gap: "6px", alignSelf: "flex-start" }}>
                                                <Tooltip title="Zoom naar alternatief" placement="top">
                                                    <Button
                                                        variant="outlined"
                                                        color="primary"
                                                        size="small"
                                                        onClick={() => handleZoomToSnapshot(snapshot)}
                                                        disabled={!snapshot.projectJSON.geometries?.design3d?.length}
                                                        sx={{ minWidth: "36px", padding: "4px 8px" }}
                                                    >
                                                        <ZoomInMapIcon style={{ fontSize: "18px" }} />
                                                    </Button>
                                                </Tooltip>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => removeSnapshot(model, snapshot.id)}
                                                >
                                                    Verwijder
                                                </Button>
                                            </Box>
                                        </Box>
                                        <Stack spacing={1}>
                                            <Box style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                                                <Typography variant="caption" style={{ color: "#666", fontWeight: 600, marginRight: "4px" }}>
                                                    Kaartlagen
                                                </Typography>
                                                <Box style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                                    <Button
                                                        variant={layerVisibility[snapshot.id]?.ruimtebeslag2d ? "contained" : "outlined"}
                                                        color="primary"
                                                        size="small"
                                                        onClick={() => handleToggleVisibility(snapshot, "ruimtebeslag2d")}
                                                        sx={{
                                                            minWidth: "70px",
                                                            textTransform: "none",
                                                            fontWeight: 500,
                                                            borderRadius: "6px",
                                                            boxShadow: "none",
                                                            "&:hover": {
                                                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                            }
                                                        }}
                                                    >
                                                        2D
                                                    </Button>
                                                    <Button
                                                        variant={layerVisibility[snapshot.id]?.design3d ? "contained" : "outlined"}
                                                        color="primary"
                                                        size="small"
                                                        onClick={() => handleToggleVisibility(snapshot, "design3d")}
                                                        sx={{
                                                            minWidth: "70px",
                                                            textTransform: "none",
                                                            fontWeight: 500,
                                                            borderRadius: "6px",
                                                            boxShadow: "none",
                                                            "&:hover": {
                                                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                            }
                                                        }}
                                                    >
                                                        3D
                                                    </Button>
                                                    <Button
                                                        variant={layerVisibility[snapshot.id]?.constructionLine ? "contained" : "outlined"}
                                                        color="primary"
                                                        size="small"
                                                        disabled={isActive
                                                            ? !model.constructionModel?.graphicsLayerConstructionLine?.graphics?.length
                                                            : !snapshot.projectJSON.constructions?.drawnConstructionLine && !snapshot.projectJSON.constructions?.structures?.length
                                                        }
                                                        onClick={() => handleToggleVisibility(snapshot, "constructionLine")}
                                                        sx={{
                                                            minWidth: "90px",
                                                            textTransform: "none",
                                                            fontWeight: 500,
                                                            borderRadius: "6px",
                                                            boxShadow: "none",
                                                            "&:hover": {
                                                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                            }
                                                        }}
                                                    >
                                                        Constr.
                                                    </Button>
                                                    <Button
                                                        variant={layerVisibility[snapshot.id]?.mesh ? "contained" : "outlined"}
                                                        color="primary"
                                                        size="small"
                                                        onClick={() => handleToggleVisibility(snapshot, "mesh")}
                                                        sx={{
                                                            minWidth: "85px",
                                                            textTransform: "none",
                                                            fontWeight: 500,
                                                            borderRadius: "6px",
                                                            boxShadow: "none",
                                                            "&:hover": {
                                                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                            }
                                                        }}
                                                    >
                                                        3D Mesh
                                                    </Button>
                                                </Box>
                                            </Box>

                                            <Stack spacing={0.75}>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                    startIcon={<UploadIcon />}
                                                    onClick={() => loadSnapshot(model, snapshot)}
                                                    disabled={isActive}
                                                    fullWidth
                                                    sx={{
                                                        justifyContent: "center",
                                                        textTransform: "none",
                                                        fontWeight: 500,
                                                        borderRadius: "6px",
                                                        boxShadow: "none",
                                                        "&:hover": {
                                                            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                                                        }
                                                    }}
                                                >
                                                    {isActive ? "Geladen" : "Laden"}
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    size="small"
                                                    startIcon={<AutorenewIcon />}
                                                    onClick={() => handleRecalculateSnapshot(model, snapshot)}
                                                    fullWidth
                                                    sx={{
                                                        justifyContent: "center",
                                                        textTransform: "none",
                                                        fontWeight: 500,
                                                        borderRadius: "6px",
                                                        boxShadow: "none",
                                                        "&:hover": {
                                                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                                        }
                                                    }}
                                                >
                                                    Herbereken volledig
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    </Stack>
                                </Paper>
                                );
                            })}
                        </Stack>
                    </Box>
                )}

                {/* Empty State */}
                {snapshots.length === 0 && (
                    <Paper elevation={0} style={{ padding: "40px", textAlign: "center", backgroundColor: "#f5f7fa", border: "2px dashed #cbd5e0", borderRadius: "8px" }}>
                        <Typography variant="h6" style={{ marginBottom: "8px", color: "#718096", fontWeight: 600 }}>
                            Geen Alternatieven
                        </Typography>
                        <Typography variant="body2" style={{ color: "#a0aec0" }}>
                            Voeg het huidige ontwerp toe of upload een opgeslagen alternatief om te beginnen.
                        </Typography>
                    </Paper>
                )}
            </Stack>

            {/* Export button - always at the bottom */}
            <Box style={{ marginTop: "auto", paddingTop: "16px" }}>
                <Button
                    variant="outlined"
                    startIcon={<FileDownloadIcon />}
                    onClick={exportToExcel}
                    fullWidth
                    disabled={snapshots.length < 2}
                    sx={{
                        textTransform: "none",
                        fontWeight: 500,
                        borderRadius: "6px",
                    }}
                >
                    Exporteer naar Excel
                </Button>
            </Box>
        </Box>
    );
};

export default ComparisonAlternativesPanel;
