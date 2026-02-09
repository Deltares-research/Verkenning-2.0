import React, { useRef, useState, useEffect } from "react";
import Stack from "@vertigis/web/ui/Stack";
import Button from "@vertigis/web/ui/Button";
import Paper from "@vertigis/web/ui/Paper";
import Typography from "@vertigis/web/ui/Typography";
import Box from "@vertigis/web/ui/Box";
import Tooltip from "@mui/material/Tooltip";
import { useWatchAndRerender } from "@vertigis/web/ui";
import { Assessment as AssessmentIcon, Upload as UploadIcon, Autorenew as AutorenewIcon, CheckCircle as CheckCircleIcon } from "@mui/icons-material";
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
} from "./ComparisonFunctions";

interface ComparisonAlternativesPanelProps {
    model: DikeDesignerModel;
    onLoadDesign?: () => void;
}

const ComparisonAlternativesPanel: React.FC<ComparisonAlternativesPanelProps> = ({ model, onLoadDesign }) => {
    const designFileInputRef = useRef<HTMLInputElement>(null);
    const [loadOptionDialogOpen, setLoadOptionDialogOpen] = useState(false);
    const [pendingProjectData, setPendingProjectData] = useState<ProjectJSON | null>(null);

    // Use model property for persistent storage across tab switches
    useWatchAndRerender(model, "comparisonSnapshots");
    const snapshots = model.comparisonSnapshots || [];
    const layerVisibility = model.comparisonModel.layerVisibility;

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

    return (
        <Box style={{ padding: "20px", height: "100%", overflow: "auto" }}>
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
                            {snapshots.map((snapshot) => (
                                <Paper
                                    key={snapshot.id}
                                    elevation={1}
                                    style={{
                                        padding: "14px 16px",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "10px",
                                        background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                                    }}
                                >
                                    <Stack spacing={1.5}>
                                        <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                                            <Box style={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: "4px" }}>
                                                    {snapshot.name}
                                                </Typography>
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
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                onClick={() => removeSnapshot(model, snapshot.id)}
                                                style={{ alignSelf: "flex-start" }}
                                            >
                                                Verwijder
                                            </Button>
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
                                                        onClick={() => toggleSnapshotLayerVisibility(model, snapshot, "ruimtebeslag2d")}
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
                                                        onClick={() => toggleSnapshotLayerVisibility(model, snapshot, "design3d")}
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
                                                        onClick={() => toggleSnapshotLayerVisibility(model, snapshot, "constructionLine")}
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
                                                        onClick={() => toggleSnapshotLayerVisibility(model, snapshot, "mesh")}
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
                                                    onClick={() => loadSnapshot(model, snapshot, onLoadDesign)}
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
                                                    Laden
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
                            ))}
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
        </Box>
    );
};

export default ComparisonAlternativesPanel;
