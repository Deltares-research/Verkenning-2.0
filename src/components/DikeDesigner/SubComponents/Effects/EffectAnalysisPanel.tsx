import AssessmentIcon from "@mui/icons-material/Assessment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
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
import React, { useState } from "react";

import type DikeDesignerModel from "../../DikeDesignerModel";
import { handleEffectAnalysis } from "../../Functions/EffectFunctions";

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

    // Helper component to display just the toggle button
    const LayerToggleButton: React.FC<{ layerTitle: string }> = ({ layerTitle }) => {
        const layer = model.map.allLayers.items.find((layer: any) => layer.title === layerTitle);
        const isVisible = layer?.visible ?? false;
        
        return (
            <Button
                size="small"
                onClick={() => toggleLayerVisibility(layerTitle)}
                sx={{ padding: "4px", minWidth: "32px", height: "24px" }}
                title={isVisible ? "Laag verbergen" : "Laag tonen"}
            >
                {isVisible ? (
                    <VisibilityIcon sx={{ fontSize: "16px" }} />
                ) : (
                    <VisibilityOffIcon sx={{ fontSize: "16px" }} />
                )}
            </Button>
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
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingPandenArea.toFixed(2)}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerToggleButton layerTitle={getDisplayLayer("bag_panden", "BAG 3D")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label={`Invloedzone BAG panden (${model.pandenBufferDistance} m)`} />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingPandenBuffer?.length}</TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingPandenBufferArea.toFixed(2)}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerToggleButton layerTitle={getDisplayLayer("bag_panden", "BAG 3D")} />
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
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingPercelenArea.toFixed(2)}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerToggleButton layerTitle={getDisplayLayer("kadastrale_percelen", "DKK - perceel")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="Erven [aantal]" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingErven?.length}</TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingErvenArea.toFixed(2)}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerToggleButton layerTitle="BGT - onbegroeid terreindeel" />
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
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingNatura2000?.toFixed(2)}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerToggleButton layerTitle={getDisplayLayer("natura2000", "Natura 2000")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="GNN [m²]" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingGNN?.toFixed(2)}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerToggleButton layerTitle={getDisplayLayer("gnn", "Groene Ontwikkelingszone en Gelders NatuurNetwerk")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="NBP beheertype [m²]" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingBeheertypeArea?.toFixed(2)}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerToggleButton layerTitle={getDisplayLayer("nbp_beheertype", model.natuurbeheerplanLayerName)} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="Beheertypen [naam]" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingBeheertypen?.map((item) => item).join(", ")}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerToggleButton layerTitle={getDisplayLayer("nbp_beheertype", model.natuurbeheerplanLayerName)} />
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
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingWegdelen2dRuimtebeslag?.toFixed(2)}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerToggleButton layerTitle={getDisplayLayer("bgt_wegdeel", "BGT - wegdeel")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="BGT afritten [m²]" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingInritten2dRuimtebeslag?.toFixed(2)}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerToggleButton layerTitle={getDisplayLayer("bgt_afritten", "BGT - wegdeel")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="BGT afritten [aantal]" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.intersectingInritten2dRuimtebeslagCount?.length}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerToggleButton layerTitle={getDisplayLayer("bgt_afritten", "BGT - wegdeel")} />
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
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.uitvoeringszoneWegoppervlak?.toFixed(2)}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerToggleButton layerTitle={getDisplayLayer("bgt_wegdeel", "BGT - wegdeel")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="Panden binnen invloedscontour" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.uitvoeringszonePanden?.length}</TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.uitvoeringszonePandenArea?.toFixed(2)}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerToggleButton layerTitle={getDisplayLayer("bag_panden", "BAG 3D")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="Percelen binnen invloedscontour" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.uitvoeringszonePercelen?.length}</TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.uitvoeringszonePercelenArea?.toFixed(2)}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerToggleButton layerTitle={getDisplayLayer("kadastrale_percelen", "DKK - perceel")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="Natura 2000 binnen invloedscontour" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">-</TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.uitvoeringszoneNatura2000?.toFixed(2)}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerToggleButton layerTitle={getDisplayLayer("natura2000", "Natura 2000")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="GNN binnen invloedscontour" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">-</TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.uitvoeringszoneGNN?.toFixed(2)}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerToggleButton layerTitle={getDisplayLayer("gnn", "Groene Ontwikkelingszone en Gelders NatuurNetwerk")} />
                                </TableCell>
                            </TableRow>
                            <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                <TableCell sx={{ fontSize: "12px", border: 0 }}>
                                    <LayerLabel label="NBP beheertype binnen invloedscontour" />
                                </TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">-</TableCell>
                                <TableCell sx={{ fontSize: "12px", border: 0 }} align="right">{model.uitvoeringszoneBeheertypeArea?.toFixed(2)}</TableCell>
                                <TableCell sx={{ fontSize: "12px", textAlign: "center", border: 0 }}>
                                    <LayerToggleButton layerTitle={getDisplayLayer("nbp_beheertype", model.natuurbeheerplanLayerName)} />
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