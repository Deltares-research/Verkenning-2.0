import ClearIcon from "@mui/icons-material/Clear";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import EditIcon from "@mui/icons-material/Edit";
import FilterIcon from "@mui/icons-material/Filter";
import InsightsIcon from '@mui/icons-material/Insights';
import MapIcon from "@mui/icons-material/Map";
import PlayCircleFilledWhiteIcon from "@mui/icons-material/PlayCircleFilledWhite";
import UploadFileIcon from "@mui/icons-material/UploadFile";

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
import LinearProgress from "@vertigis/web/ui/LinearProgress";
import Divider from "@vertigis/web/ui/Divider";
import FormLabel from "@vertigis/web/ui/FormLabel";

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
    handleExport3dDesign: () => void;
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
    handleExport3dDesign,
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
                <FormLabel>Referentielijn</FormLabel>
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
            <Stack spacing={1.5} sx={stackStyle}>
                <FormLabel>Ontwerpen</FormLabel>
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
                {/* <FormLabel>Grid grootte [m]</FormLabel>
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
                /> */}

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

                {/* <Button
                    disabled={!model.chartData?.length || !model.graphicsLayerLine?.graphics.length || !model.selectedDijkvakField}
                    variant="contained"
                    color="primary"
                    startIcon={<PlayCircleFilledWhiteIcon />}
                    onClick={handleCreateDesign}
                    fullWidth
                    sx={buttonWithIconStyle}
                >
                    Uitrollen over dijkvakken
                </Button> */}
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
                    onClick={handleExport3dDesign}
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

            </Stack>

            <Stack spacing={1.5} sx={stackStyle}>
                    {loading && (
                        <LinearProgress
                            sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                zIndex: 1,
                                borderRadius: "8px 8px 0 0"
                            }}
                        />
                    )}
                    <TableContainer sx={{ marginTop: 0, opacity: loading ? 0.5 : 1 }}>
                        <FormLabel>Volume overzicht</FormLabel>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{border: "none", padding: "4px 8px" }} align="left">
                                        Verschil [m³]
                                    </TableCell>
                                    <TableCell sx={{  border: "none", padding: "4px 8px", fontWeight: "bold" }} align="right">
                                        {model.totalVolumeDifference ?? "-"}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ border: "none", padding: "4px 8px" }} align="left">
                                        Uitgraven [m³]
                                    </TableCell>
                                    <TableCell sx={{ border: "none", padding: "4px 8px", fontWeight: "bold", color: "#d32f2f" }} align="right">
                                        {model.excavationVolume ?? "-"}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ border: "none", padding: "4px 8px" }} align="left">
                                        Opvullen [m³]
                                    </TableCell>
                                    <TableCell sx={{ border: "none", padding: "4px 8px", fontWeight: "bold", color: "#2e7d32" }} align="right">
                                        {model.fillVolume ?? "-"}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
            </Stack>
        </Stack>
    );
};

export default DimensionsPanel;