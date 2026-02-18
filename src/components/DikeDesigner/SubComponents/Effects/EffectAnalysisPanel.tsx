import AssessmentIcon from "@mui/icons-material/Assessment";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@vertigis/web/ui/Stack"
import Button from "@vertigis/web/ui/Button";
import Alert from "@vertigis/web/ui/Alert";
import Table from "@vertigis/web/ui/Table";
import TableBody from "@vertigis/web/ui/TableBody";
import TableCell from "@vertigis/web/ui/TableCell";
import TableContainer from "@vertigis/web/ui/Box";
import TableHead from "@vertigis/web/ui/TableHead";
import TableRow from "@vertigis/web/ui/TableRow";
import Paper from "@vertigis/web/ui/Paper";
import FormLabel from "@vertigis/web/ui/FormLabel";
import { stackStyle } from "../../../styles";

import { useWatchAndRerender } from "@vertigis/web/ui";
import React, { useState, useEffect, useRef, useCallback } from "react";

import type DikeDesignerModel from "../../DikeDesignerModel";
import { handleEffectAnalysis, downloadEffectsTableExcel } from "../../Functions/EffectFunctions";

interface EffectAnalysisPanelProps {
    model: DikeDesignerModel;
}

const EffectAnalysisPanel: React.FC<EffectAnalysisPanelProps> = ({
    model
}) => {
    // State for layer visibility
    const [layerVisibility, setLayerVisibility] = useState<{ [key: string]: boolean }>({});

    // Helper function to toggle layer visibility
    const toggleLayerVisibility = (layerTitle: string) => {
        console.log("Toggle clicked for layer:", layerTitle);
        const layer = model.map.allLayers.items.find((layer: any) => layer.title === layerTitle);
        console.log("Layer found:", layer);
        console.log("All layers in map:", model.map.allLayers.items.map((l: any) => l.title));
        
        if (layer) {
            const newVisibility = !layer.visible;
            console.log("Setting layer visibility to:", newVisibility);
            layer.visible = newVisibility;
            setLayerVisibility(prev => ({ ...prev, [layerTitle]: newVisibility }));
        } else {
            console.warn(`Layer "${layerTitle}" not found in map!`);
        }
    };

    // Helper function to get display layer from mapping
    const getDisplayLayer = (mappingKey: string, fallback: string): string => {
        const mapping = (model.effectLayerMappings as any)?.[mappingKey];
        if (typeof mapping === 'object' && mapping?.display) {
            return mapping.display;
        }
        return fallback;
    };

    // Helper component to display layer label only
    const LayerLabel: React.FC<{ label: string }> = ({ label }) => {
        return <span style={{ fontSize: "12px" }}>{label}</span>;
    };

    // Layer popover menu (position: fixed, same pattern as NestedLayerList)
    interface LayerPopoverProps {
        layerTitle: string;
        anchorEl: HTMLElement;
        onClose: () => void;
    }

    const LayerPopover: React.FC<LayerPopoverProps> = ({ layerTitle, anchorEl, onClose }) => {
        const menuRef = useRef<HTMLDivElement>(null);
        const layer = model.map.allLayers.items.find((l: any) => l.title === layerTitle);
        const isVisible = layer?.visible ?? false;

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
                    onClick={() => {
                        toggleLayerVisibility(layerTitle);
                        onClose();
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "8px 16px",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 13,
                        color: "inherit",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                    {isVisible
                        ? <VisibilityOffIcon sx={{ fontSize: 18, opacity: 0.7 }} />
                        : <VisibilityIcon sx={{ fontSize: 18, opacity: 0.7 }} />
                    }
                    {isVisible ? "Laag verbergen" : "Laag tonen"}
                </button>
            </div>
        );
    };

    // Three-dot menu button per row
    const LayerMenuButton: React.FC<{ layerTitle: string }> = ({ layerTitle }) => {
        const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

        return (
            <>
                <Tooltip title="Opties" placement="left" slotProps={{ tooltip: { sx: { fontSize: '13px' } } }}>
                    <button
                        onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)}
                        style={{
                            width: 26,
                            height: 26,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid #1976d2",
                            background: "none",
                            cursor: "pointer",
                            borderRadius: "50%",
                            fontSize: 16,
                            color: "#1976d2",
                            padding: 0,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(25,118,210,0.08)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                    >
                        &#8942;
                    </button>
                </Tooltip>
                {anchorEl && (
                    <LayerPopover
                        layerTitle={layerTitle}
                        anchorEl={anchorEl}
                        onClose={() => setAnchorEl(null)}
                    />
                )}
            </>
        );
    };
    useWatchAndRerender(model, "effectsCalculated")
    useWatchAndRerender(model, "intersectingPanden")
    useWatchAndRerender(model, "intersectingPandenArea")
    useWatchAndRerender(model, "intersectingPandenBuffer")
    useWatchAndRerender(model, "intersectingPandenBufferArea")
    useWatchAndRerender(model, "intersectingBomen")
    useWatchAndRerender(model, "intersectingPercelen")
    useWatchAndRerender(model, "intersectingPercelenArea")
    useWatchAndRerender(model, "intersectingWegdelen2dRuimtebeslag")
    useWatchAndRerender(model, "intersectingInritten2dRuimtebeslag")
    useWatchAndRerender(model, "intersectingInritten2dRuimtebeslagCount")
    useWatchAndRerender(model, "intersectingNatura2000")
    useWatchAndRerender(model, "intersectingGNN")
    useWatchAndRerender(model, "intersectingBeheertypen")
    useWatchAndRerender(model, "intersectingBeheertypeArea")
    useWatchAndRerender(model, "intersectingPandenBuffer")
    useWatchAndRerender(model, "intersectingPandenBufferArea")
    useWatchAndRerender(model, "intersectingErven")
    useWatchAndRerender(model, "intersectingErvenArea")
    useWatchAndRerender(model, "loading");
    
    // Execution zone (uitvoeringszone) watches
    useWatchAndRerender(model, "uitvoeringszoneWegoppervlak")
    useWatchAndRerender(model, "uitvoeringszonePanden")
    useWatchAndRerender(model, "uitvoeringszonePandenArea")
    useWatchAndRerender(model, "uitvoeringszonePercelen")
    useWatchAndRerender(model, "uitvoeringszonePercelenArea")
    useWatchAndRerender(model, "uitvoeringszoneNatura2000")
    useWatchAndRerender(model, "uitvoeringszoneGNN")
    useWatchAndRerender(model, "uitvoeringszoneBeheertypeArea")




    return (
        <Stack spacing={1}>
            <Stack spacing={2} sx={stackStyle}>
                <FormLabel>Effectenanalyse</FormLabel>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AssessmentIcon />}
                    onClick={() => handleEffectAnalysis(model)}
                    fullWidth
                    disabled={!model.graphicsLayerRuimtebeslag?.graphics.length}
                >
                    Voer effectenanalyse uit
                </Button>

                <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<CloudDownloadIcon />}
                    onClick={() => downloadEffectsTableExcel(model)}
                    fullWidth
                    sx={{ mt: 1 }}
                    disabled={!model.effectsCalculated || model.loading}
                >
                    Download effectenoverzicht (Excel)
                </Button>

                {!model.effectsCalculated && (
                    <Alert severity="warning" sx={{ fontSize: "13px" }}>
                        Effecten zijn nog niet berekend. Voer alstublieft de effectenanalyse uit om de resultaten weer te geven.
                    </Alert>
                )}

                {/* Summary Table */}
                <TableContainer component={Paper} sx={{ boxShadow: "none", backgroundColor: "#fafafa" }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ borderBottom: '1px solid #e0e0e0' }}>
                                <TableCell sx={{ fontSize: "12px", fontWeight: 500, backgroundColor: "#fafafa", border: 0, whiteSpace: "nowrap" }}>1. Wonen en leefomgeving</TableCell>
                                <TableCell align="right" sx={{ fontSize: "12px", fontWeight: 500, backgroundColor: "#fafafa", border: 0, whiteSpace: "nowrap", width: "80px" }}>Aantal</TableCell>
                                <TableCell align="right" sx={{ fontSize: "12px", fontWeight: 500, backgroundColor: "#fafafa", border: 0, whiteSpace: "nowrap", width: "120px" }}>Oppervlakte [m²]</TableCell>
                                <TableCell sx={{ fontSize: "12px", fontWeight: 500, width: "40px", textAlign: "center", backgroundColor: "#fafafa", border: 0 }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="BAG panden" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingPanden?.length}</TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{Math.round(model.intersectingPandenArea).toLocaleString("nl-NL")}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerMenuButton layerTitle={getDisplayLayer("bag_panden", "BAG 3D")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label={`Invloedzone BAG panden (${model.pandenBufferDistance} m)`} />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingPandenBuffer?.length}</TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{Math.round(model.intersectingPandenBufferArea).toLocaleString("nl-NL")}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerMenuButton layerTitle={getDisplayLayer("bag_panden", "BAG 3D")} />
                                </TableCell>
                            </TableRow>
                            {/* <TableRow>
                                <TableCell sx={{ fontSize: "12px" }}>Bomen [aantal]</TableCell>
                                <TableCell sx={{ fontSize: "12px" }} align="right">{model.intersectingBomen?.length}</TableCell>
                            </TableRow> */}
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="Percelen geen eigendom Waterschap [aantal]" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingPercelen?.length}</TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{Math.round(model.intersectingPercelenArea).toLocaleString("nl-NL")}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerMenuButton layerTitle={getDisplayLayer("kadastrale_percelen", "DKK - perceel")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="Erven [aantal]" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingErven?.length}</TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{Math.round(model.intersectingErvenArea).toLocaleString("nl-NL")}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerMenuButton layerTitle="BGT - onbegroeid terreindeel" />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                
                {/* Natuur Table */}
                <TableContainer component={Paper} sx={{ boxShadow: "none", backgroundColor: "#fafafa" }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ borderBottom: '1px solid #e0e0e0' }}>
                                <TableCell sx={{ fontSize: "12px", fontWeight: 500, backgroundColor: "#fafafa", border: 0, whiteSpace: "nowrap" }}>2. Natuur</TableCell>
                                <TableCell align="right" sx={{ fontSize: "12px", fontWeight: 500, backgroundColor: "#fafafa", border: 0, whiteSpace: "nowrap", width: "120px" }}>Oppervlakte [m²]</TableCell>
                                <TableCell sx={{ fontSize: "12px", fontWeight: 500, width: "40px", textAlign: "center", backgroundColor: "#fafafa", border: 0 }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="Natura 2000 [m²]" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingNatura2000 != null ? Math.round(model.intersectingNatura2000).toLocaleString("nl-NL") : ""}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerMenuButton layerTitle={getDisplayLayer("natura2000", "Natura 2000")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="GNN [m²]" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingGNN != null ? Math.round(model.intersectingGNN).toLocaleString("nl-NL") : ""}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerMenuButton layerTitle={getDisplayLayer("gnn", "Groene Ontwikkelingszone en Gelders NatuurNetwerk")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="NBP beheertype [m²]" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingBeheertypeArea != null ? Math.round(model.intersectingBeheertypeArea).toLocaleString("nl-NL") : ""}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerMenuButton layerTitle={getDisplayLayer("nbp_beheertype", model.natuurbeheerplanLayerName)} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="Beheertypen [naam]" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingBeheertypen?.map((item) => item).join(", ")}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerMenuButton layerTitle={getDisplayLayer("nbp_beheertype", model.natuurbeheerplanLayerName)} />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Verkeer Table */}
                <TableContainer component={Paper} sx={{ boxShadow: "none", backgroundColor: "#fafafa" }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ borderBottom: '1px solid #e0e0e0' }}>
                                <TableCell sx={{ fontSize: "12px", fontWeight: 500, backgroundColor: "#fafafa", border: 0, whiteSpace: "nowrap" }}>3. Verkeer</TableCell>
                                <TableCell align="right" sx={{ fontSize: "12px", fontWeight: 500, backgroundColor: "#fafafa", border: 0, whiteSpace: "nowrap", width: "120px" }}>Oppervlakte [m²]</TableCell>
                                <TableCell sx={{ fontSize: "12px", fontWeight: 500, width: "40px", textAlign: "center", backgroundColor: "#fafafa", border: 0 }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="BGT wegdelen [m²]" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingWegdelen2dRuimtebeslag != null ? Math.round(model.intersectingWegdelen2dRuimtebeslag).toLocaleString("nl-NL") : ""}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerMenuButton layerTitle={getDisplayLayer("bgt_wegdeel", "BGT - wegdeel")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="BGT afritten [m²]" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingInritten2dRuimtebeslag != null ? Math.round(model.intersectingInritten2dRuimtebeslag).toLocaleString("nl-NL") : ""}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerMenuButton layerTitle={getDisplayLayer("bgt_afritten", "BGT - wegdeel")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="BGT afritten [aantal]" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingInritten2dRuimtebeslagCount?.length}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerMenuButton layerTitle={getDisplayLayer("bgt_afritten", "BGT - wegdeel")} />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Execution Zone (Uitvoeringszone) Table */}
                <TableContainer component={Paper} sx={{ boxShadow: "none", backgroundColor: "#fafafa" }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ borderBottom: '1px solid #e0e0e0' }}>
                                <TableCell sx={{ fontSize: "12px", fontWeight: 500, backgroundColor: "#fafafa", border: 0, whiteSpace: "nowrap" }}>4. Uitvoering (buffer: {model.uitvoeringszoneBufferDistance || 10}m)</TableCell>
                                <TableCell align="right" sx={{ fontSize: "12px", fontWeight: 500, backgroundColor: "#fafafa", border: 0, whiteSpace: "nowrap", width: "80px" }}>Aantal</TableCell>
                                <TableCell align="right" sx={{ fontSize: "12px", fontWeight: 500, backgroundColor: "#fafafa", border: 0, whiteSpace: "nowrap", width: "120px" }}>Oppervlakte [m²]</TableCell>
                                <TableCell sx={{ fontSize: "12px", fontWeight: 500, width: "40px", textAlign: "center", backgroundColor: "#fafafa", border: 0 }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="Wegoppervlak in uitvoeringszone" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">-</TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.uitvoeringszoneWegoppervlak != null ? Math.round(model.uitvoeringszoneWegoppervlak).toLocaleString("nl-NL") : ""}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerMenuButton layerTitle={getDisplayLayer("bgt_wegdeel", "BGT - wegdeel")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="Panden binnen invloedscontour" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.uitvoeringszonePanden?.length}</TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.uitvoeringszonePandenArea != null ? Math.round(model.uitvoeringszonePandenArea).toLocaleString("nl-NL") : ""}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerMenuButton layerTitle={getDisplayLayer("bag_panden", "BAG 3D")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="Percelen binnen invloedscontour" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.uitvoeringszonePercelen?.length}</TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.uitvoeringszonePercelenArea != null ? Math.round(model.uitvoeringszonePercelenArea).toLocaleString("nl-NL") : ""}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerMenuButton layerTitle={getDisplayLayer("kadastrale_percelen", "DKK - perceel")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="Natura 2000 binnen invloedscontour" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">-</TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.uitvoeringszoneNatura2000 != null ? Math.round(model.uitvoeringszoneNatura2000).toLocaleString("nl-NL") : ""}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerMenuButton layerTitle={getDisplayLayer("natura2000", "Natura 2000")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="GNN binnen invloedscontour" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">-</TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.uitvoeringszoneGNN != null ? Math.round(model.uitvoeringszoneGNN).toLocaleString("nl-NL") : ""}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerMenuButton layerTitle={getDisplayLayer("gnn", "Groene Ontwikkelingszone en Gelders NatuurNetwerk")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="NBP beheertype binnen invloedscontour" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">-</TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.uitvoeringszoneBeheertypeArea != null ? Math.round(model.uitvoeringszoneBeheertypeArea).toLocaleString("nl-NL") : ""}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerMenuButton layerTitle={getDisplayLayer("nbp_beheertype", model.natuurbeheerplanLayerName)} />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Stack>
        </Stack>
    );
};

export default EffectAnalysisPanel;