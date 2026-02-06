import ClearIcon from "@mui/icons-material/Clear";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import EditIcon from "@mui/icons-material/Edit";
import FilterIcon from "@mui/icons-material/Filter";
import InsightsIcon from '@mui/icons-material/Insights';
import MapIcon from "@mui/icons-material/Map";
import PlayCircleFilledWhiteIcon from "@mui/icons-material/PlayCircleFilledWhite";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import SaveIcon from "@mui/icons-material/Save";
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import HistoryIcon from '@mui/icons-material/History';

import Stack from "@vertigis/web/ui/Stack";
import Button from "@vertigis/web/ui/Button";
import FormControl from "@vertigis/web/ui/FormControl";
import InputLabel from "@vertigis/web/ui/FormLabel";
import Select from "@vertigis/web/ui/Select";
import MenuItem from "@vertigis/web/ui/MenuItem";
import TableContainer from "@vertigis/web/ui/Box";
import Table from "@vertigis/web/ui/Table";
import TableBody from "@vertigis/web/ui/TableBody";
import TableRow from "@vertigis/web/ui/TableRow";
import TableCell from "@vertigis/web/ui/TableCell";
import TableHead from "@vertigis/web/ui/TableHead";
import Paper from "@vertigis/web/ui/Paper";
import LinearProgress from "@vertigis/web/ui/LinearProgress";
import Divider from "@vertigis/web/ui/Divider";
import FormLabel from "@vertigis/web/ui/FormLabel";
import Checkbox from "@vertigis/web/ui/Checkbox";
import ListItemText from "@vertigis/web/ui/ListItemText";
import Input from "@vertigis/web/ui/Input";
import Alert from "@vertigis/web/ui/Alert";
import IconButton from "@vertigis/web/ui/IconButton";
import Box from "@vertigis/web/ui/Box";

import React, { useState, useRef, useEffect } from "react";

import { stackStyle } from "../../../styles";
import { useWatchAndRerender } from "@vertigis/web/ui";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";


interface DimensionsPanelProps {
    model: any;
    isLayerListVisible: boolean;
    setSelectedLineLayerId: (id: string) => void;
    handleUploadGeoJSON: () => void;
    handleSelectFromMap: () => void;
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleClearGraphics: () => void;
    handleGridChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleExcelUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleClearExcel: () => void;
    handleOpenOverview: () => void;
    handleCreateCrossSection: () => () => void;
    handleCreateDesign: () => void;
    handleClearDesign: () => void;
    handleSaveWithDialog: () => void;
    handleOpenDownloadDialog: () => void;
    designName: string;
}

const DimensionsPanel: React.FC<DimensionsPanelProps> = ({
    model,
    isLayerListVisible,
    setSelectedLineLayerId,
    handleUploadGeoJSON,
    handleSelectFromMap,
    handleFileChange,
    handleClearGraphics,
    handleGridChange,
    handleExcelUpload,
    handleClearExcel,
    handleOpenOverview,
    handleCreateCrossSection,
    handleCreateDesign,
    handleClearDesign,
    handleSaveWithDialog,
    handleOpenDownloadDialog,
    designName,
}) => {


    const handle3dAreaLayerclear = () => {
        model.view.analyses.removeAll();
    };

    useWatchAndRerender(model, "total2dArea");
    useWatchAndRerender(model, "total3dArea");
    useWatchAndRerender(model, "lineLength");
    useWatchAndRerender(model, "graphicsLayerLine");
    useWatchAndRerender(model, "loading");

    const handleCreateLine = () => {
            model.startDrawingLine(model.graphicsLayerLine);
    };

    // Common button style for consistent icon alignment
    const buttonWithIconStyle = {};

    // Check if reference line exists
    const hasReferenceLine = Boolean(model.graphicsLayerLine?.graphics.length);

    return (
        <Stack spacing={1}>
            <Stack spacing={1.5} sx={stackStyle}>
                <FormLabel>Stap 1: referentielijn bepalen (kies een van de drie)</FormLabel>
                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                    <Button
                        disabled={!model.sketchViewModel}
                        color="primary"
                        onClick={handleCreateLine}
                        startIcon={<EditIcon />}
                        variant="contained"
                        size="medium"
                        sx={{ flex: 1 }}
                    >
                        Teken lijn
                    </Button>
                    <Button
                        color="primary"
                        onClick={handleUploadGeoJSON}
                        startIcon={<UploadFileIcon />}
                        variant="contained"
                        disabled={!model.map}
                        size="medium"
                        sx={{ flex: 1 }}
                    >
                        Upload
                    </Button>
                    <Button
                        color="primary"
                        onClick={handleSelectFromMap}
                        startIcon={<MapIcon />}
                        variant="contained"
                        disabled={!model.map}
                        size="medium"
                        sx={{ flex: 1 }}
                    >
                        Kies uit kaart
                    </Button>
                </Stack>
                
                {isLayerListVisible && (
                    <>
                        {/* Ontwerplijn Dropdown */}
                        <FormControl sx={{ marginTop: 2, fontSize: "11px" }} size="small">
                            <InputLabel
                                id="line-layer-label"
                                sx={{ fontSize: "11px" }}
                            >
                                Ontwerplijn
                            </InputLabel>
                            <Select
                                value={model.selectedLineLayerId}
                                onChange={(e) => setSelectedLineLayerId(e.target.value as string)}
                                displayEmpty
                                fullWidth
                                variant="outlined"
                                sx={{
                                    fontSize: "11px",
                                }}
                            >
                                {model.lineFeatureLayers.map((layer) => (
                                    <MenuItem
                                        key={layer.id}
                                        value={layer.id}
                                        sx={{ fontSize: "11px" }}
                                    >
                                        {layer.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Dijkvak-id Dropdown */}
                        {/* {model.selectedDijkvakLayerFields.length > 0 && (
                            <FormControl sx={{ marginTop: 2, fontSize: "14px" }} size="small">
                                <InputLabel
                                    id="dijkvak-field-label"
                                    sx={{ fontSize: "11px" }}
                                >
                                    Dijkvak-id veld
                                </InputLabel>
                                <Select
                                    value={model.selectedDijkvakField || ""}
                                    onChange={(e) => {
                                        model.selectedDijkvakField = e.target.value;
                                    }}
                                    displayEmpty
                                    fullWidth
                                    variant="outlined"
                                    sx={{
                                        fontSize: "11px",
                                    }}
                                >
                                    {model.selectedDijkvakLayerFields.map((field) => (
                                        <MenuItem
                                            key={field}
                                            value={field}
                                            sx={{ fontSize: "11px" }}
                                        >
                                            {field}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )} */}
                    </>
                )}
                <Button
                    disabled={!model.graphicsLayerLine?.graphics.length}
                    variant="outlined"
                    color="primary"
                    onClick={handleClearGraphics}
                    startIcon={<ClearIcon />}
                    fullWidth
                    sx={buttonWithIconStyle}
                >
                    Verwijder lijn
                </Button>
            </Stack>

            {/* <Stack spacing={1} sx={stackStyle}> */}
                {/* Hidden input for GeoJSON upload */}
                <input
                    id="geojson-upload"
                    type="file"
                    accept=".geojson"
                    hidden
                    onChange={handleFileChange}
                />
            <Stack spacing={1.5}                 
                    sx={{
                    ...stackStyle,
                    opacity: hasReferenceLine ? 1 : 0.5,
                    pointerEvents: hasReferenceLine ? 'auto' : 'none'
                }}>
                <FormLabel>Stap 2: dwarsprofiel bepalen</FormLabel>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<FilterIcon />}
                    onClick={handleOpenOverview}
                    fullWidth
                    disabled={!hasReferenceLine || model.designPanelVisible}
                    sx={buttonWithIconStyle}
                >
                    Open 2D-ontwerpen
                </Button>

                 <Divider />

                <Button
                    disabled={!hasReferenceLine || !model.graphicsLayerTemp?.graphics.length}
                    variant="outlined"
                    color="primary"
                    startIcon={<ClearIcon />}
                    onClick={handleClearDesign}
                    fullWidth
                    sx={buttonWithIconStyle}
                >
                    Verwijder uitrol
                </Button>
            </Stack>

            <Stack 
                spacing={1.5} 
                sx={{
                    ...stackStyle,
                    opacity: hasReferenceLine ? 1 : 0.5,
                    pointerEvents: hasReferenceLine ? 'auto' : 'none'
                }}
            >
                 <FormLabel>Stap 3: controleren dwarsprofiel</FormLabel>
                <Button
                    disabled={!hasReferenceLine}
                    variant="contained"
                    color="primary"
                    startIcon={<InsightsIcon />}
                    onClick={handleCreateCrossSection()}
                    fullWidth
                    sx={buttonWithIconStyle}
                >
                    Controleer dwarsprofiel
                </Button>
            </Stack>

            <Stack 
                spacing={1.5} 
                sx={{
                    ...stackStyle,
                    opacity: hasReferenceLine ? 1 : 0.5,
                    pointerEvents: hasReferenceLine ? 'auto' : 'none'
                }}
            >
                <FormLabel>Ontwerp overzicht</FormLabel>
                <TableContainer component={Paper} sx={{ marginTop: 0, opacity: model.loading ? 0.5 : 1 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px", fontWeight: "bold" }}>Ontwerp element</TableCell>
                                <TableCell align="right" sx={{ fontSize: "11px", fontWeight: "bold" }}>Waarde</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }} align="left">
                                    Lengte traject [m]
                                </TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">
                                    {model.lineLength ?? "-"}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }} align="left">
                                    Verschil [m³]
                                </TableCell>
                                <TableCell sx={{ fontSize: "11px"}} align="right">
                                    {model.totalVolumeDifference ?? "-"}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }} align="left">
                                    Uitgraven [m³]
                                </TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">
                                    {model.excavationVolume ?? "-"}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }} align="left">
                                    Opvullen [m³]
                                </TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">
                                    {model.fillVolume ?? "-"}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }} align="left">
                                    2D Oppervlakte [m²]
                                </TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">
                                    {model.total2dArea ?? "-"}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ fontSize: "11px" }} align="left">
                                    3D Oppervlakte [m²]
                                </TableCell>
                                <TableCell sx={{ fontSize: "11px" }} align="right">
                                    {model.total3dArea ?? "-"}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Stack>
            <Stack 
                spacing={1.5} 
                sx={{
                    ...stackStyle,
                    opacity: hasReferenceLine ? 1 : 0.5,
                    pointerEvents: hasReferenceLine ? 'auto' : 'none'
                }}
            >
                <FormLabel>Stap 4: bestanden downloaden</FormLabel>
                
                <Button
                    disabled={!hasReferenceLine || !designName}
                    variant="contained"
                    color="secondary"
                    startIcon={<CloudDownloadIcon />}
                    onClick={handleOpenDownloadDialog}
                    fullWidth
                    sx={buttonWithIconStyle}
                >
                    Download geselecteerd
                </Button>
            </Stack>
            {/* <Stack 
                spacing={1.5} 
                sx={{
                    ...stackStyle,
                    opacity: hasReferenceLine ? 1 : 0.5,
                    pointerEvents: hasReferenceLine ? 'auto' : 'none'
                }}
            >
                <FormLabel>Stap 5: ontwerpen opslaan</FormLabel>
                <Button
                    disabled={!hasReferenceLine || !model.graphicsLayer3dPolygon?.graphics?.length || !designName}
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveWithDialog}
                    fullWidth
                    sx={buttonWithIconStyle}
                >
                    Ontwerpen opslaan
                </Button>
            </Stack> */}

        </Stack>
    );
};

export default DimensionsPanel;