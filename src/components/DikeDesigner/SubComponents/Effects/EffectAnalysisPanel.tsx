import AssessmentIcon from "@mui/icons-material/Assessment";
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import ClearIcon from '@mui/icons-material/Clear';
import Stack from "@vertigis/web/ui/Stack"
import Button from "@vertigis/web/ui/Button";
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
import React, { useMemo } from "react";

import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";

import type DikeDesignerModel from "../../DikeDesignerModel";
import { getIntersectingFeatures, calculate3dAreas, calculate2dAreas, getIntersectingArea2dRuimtebeslag } from "../../Functions/EffectFunctions";

interface EffectAnalysisPanelProps {
    model: DikeDesignerModel;
}

const EffectAnalysisPanel: React.FC<EffectAnalysisPanelProps> = ({
    model,

}) => {

    const handleEffectAnalysis = async () => {
        model.messages.commands.ui.displayBusyState.execute({}).catch((error) => {
            console.error("Error displaying busy state:", error);
        });
        await getIntersectingFeatures(model, "BAG 2D").then((result) => {
            model.intersectingPanden = result;
            console.log("Intersecting panden:", result);
        }).catch((error) => {
            console.error("Error fetching intersecting features:", error);
        });

        await getIntersectingFeatures(model, "Bomenregister 2015").then((result) => {
            model.intersectingBomen = result;
            console.log("Intersecting bomen:", result);
        }).catch((error) => {
            console.error("Error fetching intersecting features:", error);
        });

        await getIntersectingFeatures(model, "DKK - perceel").then((result) => {
            model.intersectingPercelen = result;
            console.log("Intersecting percelen:", result);
        }).catch((error) => {
            console.error("Error fetching intersecting features:", error);
        });

        await getIntersectingArea2dRuimtebeslag(model, "BGT - wegdeel").then((result) => {
            model.intersectingWegdelen2dRuimtebeslag = result;
            console.log("Total 2D intersecting area:", result);
        }).catch((error) => {
            console.error("Error fetching intersecting area:", error);
        });




        model.messages.commands.ui.hideBusyState.execute().catch((error) => {
            console.error("Error displaying busy state:", error);
        });

    };

    const handleDesignCalculations = async () => {
        const total2dArea = await calculate2dAreas(model);
        model.total2dArea = total2dArea;
        const total3dArea = await calculate3dAreas(model);
        model.total3dArea = total3dArea;

        if (model.graphicsLayerLine?.graphics?.length > 0) {
            console.log("Calculating line length...");
            const firstGraphic = model.graphicsLayerLine.graphics.getItemAt(0);
            if (firstGraphic?.geometry) {
                console.log("Calculating line length...");
                const length = geometryEngine.geodesicLength(firstGraphic.geometry, "meters");
                console.log("Calculated line length:", length);
                model.lineLength = length;
            } else {
                console.log("No geometry found in the first graphic of graphicsLayerLine.");
            }
        }
    };

    const handle3dAreaLayerclear = () => {
        model.view.analyses.removeAll();
    }

    useWatchAndRerender(model, "intersectingPanden")
    useWatchAndRerender(model, "intersectingBomen")
    useWatchAndRerender(model, "intersectingPercelen")
    useWatchAndRerender(model, "intersectingWegdelen2dRuimtebeslag")
    useWatchAndRerender(model, "total3dArea")
    useWatchAndRerender(model, "lineLength")
    useWatchAndRerender(model, "graphicsLayerLine")


    return (
        <Stack spacing={1}>
            <Stack spacing={2} sx={stackStyle}>
                <FormLabel>Ontwerp maten</FormLabel>

                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<ViewInArIcon />}
                    onClick={handleDesignCalculations}
                    fullWidth
                    disabled={!model.mergedMesh}
                >
                    Bereken ontwerp maten
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<ClearIcon />}
                    onClick={handle3dAreaLayerclear}
                    fullWidth
                    disabled={!model.mergedMesh}
                >
                    Verwijder 3D Oppervlakte lagen
                </Button>

                {/* Detailed Results Table */}
                <TableContainer component={Paper} sx={{}}>
                    <Table >
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px", fontWeight: "bold" }}>Ontwerp element</TableCell>
                                <TableCell align="right" sx={{ fontSize: "11px", fontWeight: "bold" }}>Afmeting</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>3D Oppervlakte [m²]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.total3dArea?.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>2D Oppervlakte [m²]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.total2dArea?.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>Lengte traject [m]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.lineLength?.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Stack>
            <Stack spacing={2} sx={stackStyle}>
                <FormLabel>Effectenanalyse</FormLabel>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AssessmentIcon />}
                    onClick={handleEffectAnalysis}
                    fullWidth
                    disabled={!model.graphicsLayerTemp?.graphics.length}
                >
                    Voer effectenanalyse uit
                </Button>

                {/* Summary Table */}
                <TableContainer component={Paper} sx={{}}>
                    <Table >
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px", fontWeight: "bold" }}>Onderdeel</TableCell>
                                <TableCell align="right" sx={{ fontSize: "11px", fontWeight: "bold" }}>Waarde</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>BAG panden [aantal]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingPanden?.length}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>Bomen [aantal]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingBomen?.length}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>Percelen [aantal]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingPercelen?.length}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }}>BGT wegdelen overlappend [m²]</TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">{model.intersectingWegdelen2dRuimtebeslag?.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Stack>
        </Stack>
    );
};

export default EffectAnalysisPanel;