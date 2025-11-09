import ClearIcon from "@mui/icons-material/Clear";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import EditIcon from "@mui/icons-material/Edit";
import FilterIcon from "@mui/icons-material/Filter";
import InsightsIcon from '@mui/icons-material/Insights';
import MapIcon from "@mui/icons-material/Map";
import PlayCircleFilledWhiteIcon from "@mui/icons-material/PlayCircleFilledWhite";
// import TableRowsIcon from "@mui/icons-material/TableRows";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
    // Stack,
    // ButtonGroup,
    // Button,
    // FormControl,
    // InputLabel,
    // Select,
    // MenuItem,
    // TableContainer,
    // Table,
    // TableBody,
    // TableRow,
    // TableCell,
    // LinearProgress,
    // TextField,
    // Divider,
} from "@mui/material";

import Stack from "@vertigis/web/ui/Stack";
import ButtonGroup from "@vertigis/web/ui/ButtonGroup";
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
import LinearProgress from "@vertigis/web/ui/LinearProgress";
import TextField from "@vertigis/web/ui/Input";
import Divider from "@vertigis/web/ui/Divider";

import React from "react";

import { stackStyle } from "../../../styles";


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
    handleExportGraphics: () => void;
    handleExport2D: () => void;
    handleExportRuimtebeslag: () => void;
    handleClearDesign: () => void;
    loading: boolean;
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
    handleExportGraphics,
    handleExport2D,
    handleExportRuimtebeslag,
    handleClearDesign,
    loading,
}) => {

    const handleCreateLine = () => {
            model.startDrawingLine(model.graphicsLayerLine);
    };

    // Common button style for consistent icon alignment
    const buttonWithIconStyle = {
        // justifyContent: 'flex-center',
        // paddingLeft: '12px',
        // '& .MuiButton-startIcon': {
        //     marginRight: '8px',
        //     marginLeft: 0,
        // },
    };

    return (
        <Stack spacing={1}>
            <Stack spacing={2} sx={stackStyle}>
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
                        {model.selectedDijkvakLayerFields.length > 0 && (
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
                        )}
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
                {/* <Button
                    variant="contained"
                    component="label"
                    startIcon={<TableRowsIcon />}
                    color="primary"
                    fullWidth
                >
                    Upload ontwerpen (Excel)
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        hidden
                        onChange={handleExcelUpload}
                    />
                </Button>
                <Button
                    disabled={!model.chartData?.length}
                    variant="outlined"
                    color="secondary"
                    startIcon={<ClearIcon />}
                    onClick={handleClearExcel}
                    fullWidth
                >
                    Verwijder ontwerpen
                </Button> */}
            {/* </Stack> */}
            <Stack spacing={1.5} sx={stackStyle}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<FilterIcon />}
                    onClick={handleOpenOverview}
                    fullWidth
                    disabled={model.designPanelVisible}
                    sx={buttonWithIconStyle}
                >
                    Open 2D-ontwerpen
                </Button>

                 <Divider />
                
        

                {/* Grid-size input */}
                <TextField
                    value={model.gridSize}
              
                    type="number"
                    // variant="outlined"
                    size="medium"
                    onChange={handleGridChange}
                    sx={{ marginTop: 4 }}
                    // InputProps={{
                    //     sx: { fontSize: '12px', lineHeight: '2' },
                    // // }}
                    // InputLabelProps={{
                    //     sx: { fontSize: '12px' }
                    // }}
                />

                <Button
                    disabled={!model.chartData?.length || !model.graphicsLayerLine?.graphics.length}
                    variant="contained"
                    color="primary"
                    startIcon={<PlayCircleFilledWhiteIcon />}
                    onClick={handleCreateDesign}
                    fullWidth
                    sx={buttonWithIconStyle}
                >
                    Uitrollen in 3D
                </Button>

                <Button
                    disabled={!model.chartData?.length || !model.graphicsLayerLine?.graphics.length || !model.selectedDijkvakField}
                    variant="contained"
                    color="primary"
                    startIcon={<PlayCircleFilledWhiteIcon />}
                    onClick={handleCreateDesign}
                    fullWidth
                    sx={buttonWithIconStyle}
                >
                    Uitrollen over dijkvakken
                </Button>
                {/* <Button
                    disabled={!model.chartData?.length || !model.graphicsLayerLine?.graphics.length || !model.selectedDijkvakField}
                    variant="contained"
                    color="primary"
                    startIcon={<TravelExploreIcon />}
                    onClick={handle2DAnalysis}
                    fullWidth
                >
                    Ruimtebeslag analyse (2D)
                </Button> */}
                <Button
                    disabled={!model.graphicsLayerTemp?.graphics.length}
                    variant="contained"
                    color="secondary"
                    startIcon={<CloudDownloadIcon />}
                    onClick={handleExportGraphics}
                    fullWidth
                    sx={buttonWithIconStyle}
                >
                    Download 3D ontwerpdata (GeoJSON)
                </Button>
                <Button
                    disabled={!model.graphicsLayerTemp?.graphics.length}
                    variant="contained"
                    color="secondary"
                    startIcon={<CloudDownloadIcon />}
                    onClick={handleExport2D}
                    fullWidth
                    sx={buttonWithIconStyle}
                >
                    Download 2D ontwerpdata (GeoJSON)
                </Button>
                <Button
                    disabled={!model.graphicsLayerTemp?.graphics.length}
                    variant="contained"
                    color="secondary"
                    startIcon={<CloudDownloadIcon />}
                    onClick={handleExportRuimtebeslag}
                    fullWidth
                    sx={buttonWithIconStyle}
                >
                    Download 2D ruimtebeslag (GeoJSON)
                </Button>

                <Button
                    disabled={!model.graphicsLayerTemp?.graphics.length}
                    variant="outlined"
                    color="primary"
                    startIcon={<ClearIcon />}
                    onClick={handleClearDesign}
                    fullWidth
                    sx={buttonWithIconStyle}
                >
                    Verwijder uitrol
                </Button>

                {/* Volume table with loader */}
                <div style={{ position: "relative" }}>
                    {loading && (
                        <LinearProgress
                            sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                zIndex: 1,
                            }}
                        />
                    )}
                    <TableContainer sx={{ marginTop: 2, opacity: loading ? 0.5 : 1 }}>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{ fontSize: 11 }} align="left">
                                        Totaal volume verschil [m³]
                                    </TableCell>
                                    <TableCell sx={{ fontSize: 11 }} align="right">
                                        {model.totalVolumeDifference ?? "-"}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontSize: 11 }} align="left">
                                        Uitgravingsvolume [m³]
                                    </TableCell>
                                    <TableCell sx={{ fontSize: 11 }} align="right">
                                        {model.excavationVolume ?? "-"}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontSize: 11 }} align="left">
                                        Opvulvolume [m³]
                                    </TableCell>
                                    <TableCell sx={{ fontSize: 11 }} align="right">
                                        {model.fillVolume ?? "-"}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            </Stack>

            <Stack spacing={1.5} sx={stackStyle}>
                <Button
                    // disabled={!model.chartData?.length}
                    variant="contained"
                    color="primary"
                    startIcon={<InsightsIcon />}
                    onClick={handleCreateCrossSection()}
                    fullWidth
                    sx={buttonWithIconStyle}
                >
                    Controleer dwarsprofiel
                </Button>
                {/* <Button
                    // disabled={!model.chartData?.length}
                    variant="contained"
                    color="primary"
                    startIcon={<ClearIcon />}
                    onClick={handleRemoveTalud()}
                    fullWidth
                >
                    Verwijder taludlijn
                </Button> */}
            </Stack>
        </Stack>
    );
};

export default DimensionsPanel;