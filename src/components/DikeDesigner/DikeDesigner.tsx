import type am5xy from "@amcharts/amcharts5/xy";
import ArchitectureIcon from "@mui/icons-material/Architecture";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import BuildIcon from "@mui/icons-material/Build";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HomeIcon from "@mui/icons-material/Home";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SaveIcon from "@mui/icons-material/Save";
import UploadIcon from "@mui/icons-material/Upload";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

import Box from "@vertigis/web/ui/Box";
import Button from "@vertigis/web/ui/Button";
import Tab from "@vertigis/web/ui/Tab"
import Tabs from "@vertigis/web/ui/Tabs"
import Stack from "@vertigis/web/ui/Stack";
import FormLabel from "@vertigis/web/ui/FormLabel";
import Input from "@vertigis/web/ui/Input";
import Alert from "@vertigis/web/ui/Alert"
import LinearProgress from "@vertigis/web/ui/LinearProgress";
import Typography from "@vertigis/web/ui/Typography";
import Menu from "@vertigis/web/ui/Menu";
import MenuItem from "@vertigis/web/ui/MenuItem";
import IconButton from "@vertigis/web/ui/IconButton";

import { LayoutElement } from "@vertigis/web/components";
import type { LayoutElementProperties } from "@vertigis/web/components";
import { useWatchAndRerender } from "@vertigis/web/ui";
import React, { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";

import type DikeDesignerModel from "./DikeDesignerModel";
import {
    calculateVolume,
    calculateDesignValues,
    cleanFeatureLayer,
    createDesigns,
    setInputLineFromFeatureLayer,
    createCrossSection,
    setMapDwpLocation,
} from "./Functions/DesignFunctions";

import {
    export3dGraphicsLayerAsGeoJSON,
    exportDesignLayer2DAsGeoJSON,
    exportRuimteslagLayerAsGeoJSON,
    exportInputLinesAsGeoJSON,
} from "./Functions/ExportFunctions";

import { initializeChart, initializeCrossSectionChart } from "./Functions/ChartFunctions";


import { save2dRuimtebeslagToFeatureLayer, save3dDesignToFeatureLayer, loadGeometriesFromDesign } from "./Functions/SaveFunctions";
import { saveProjectAsJSON, loadProjectFromJSON, type ProjectJSON } from "./Functions/SaveProjectFunctions";
import ChartAndTablePanel from "./SubComponents/Dimensions/ChartAndTablePanel";
import CrossSectionChartPanel from "./SubComponents/Dimensions/CrossSectionChartPanel";
import DimensionsPanel from "./SubComponents/Dimensions/DimensionsPanel";
import EffectAnalysisPanel from "./SubComponents/Effects/EffectAnalysisPanel";
import CostCalculationPanel from "./SubComponents/Cost/CostPanel";
import CostChartAndTablePanel from "./SubComponents/Cost/CostChartAndTablePanel";
import ConstructionPanel from "./SubComponents/Construction/ConstructionPanel";
import HomePanel from "./SubComponents/Home/HomePanel";
import { ComparisonChartAndTablePanel } from "./SubComponents/Comparison";
import ComparisonDataPanel from "./SubComponents/Comparison/ComparisonDataPanel";
import LoadDesignsDialog from "./SubComponents/Dimensions/LoadDesignsDialog";
import SaveDesignsDialog from "./SubComponents/Dimensions/SaveDesignsDialog";
import DownloadDialog from "./SubComponents/Dimensions/DownloadDialog";
import DesignNameDialog from "./SubComponents/Dimensions/DesignNameDialog";


// import { SimpleWorker } from "./Workers/SimpleWorker"; // adjust path as needed
const DikeDesigner = (
    props: LayoutElementProperties<DikeDesignerModel>
): ReactElement => {
    const { model } = props;

    const prevDeps = useRef<any>({});

    const chartContainerRef = useRef<HTMLDivElement | null>(null);
    const crossSectionChartContainerRef = useRef<HTMLDivElement | null>(null);

    const [mapLeftBorder, setMapLeftBorder] = useState(0);
    const [mapRightBorder, setMapRightBorder] = useState(window.innerWidth);
    const [activeTab, setActiveTab] = useState(0);
    const [value, setValue] = React.useState(0);
    const [isLayerListVisible, setIsLayerListVisible] = useState(false);
    const [showNameWarning, setShowNameWarning] = useState(false);
    const [selectedDownloads, setSelectedDownloads] = useState<string[]>([]);
    const [loadDesignsDialogOpen, setLoadDesignsDialogOpen] = useState(false);
    const [saveDesignsDialogOpen, setSaveDesignsDialogOpen] = useState(false);
    const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
    const [designNameDialogOpen, setDesignNameDialogOpen] = useState(false);
    const [designNameDialogMode, setDesignNameDialogMode] = useState<"create" | "edit">("edit");
    const [fileMenuAnchor, setFileMenuAnchor] = useState<null | HTMLElement>(null);
    const fileMenuOpen = Boolean(fileMenuAnchor);
    const [sidebarExpanded, setSidebarExpanded] = useState(false);

    const splitDesignName = (name: string) => {
        const trimmed = name?.trim() || "";
        if (!trimmed) {
            return { vak: "", alternatief: "" };
        }
        const parts = trimmed.split(" - ");
        if (parts.length >= 2) {
            return {
                vak: parts[0].trim(),
                alternatief: parts.slice(1).join(" - ").trim(),
            };
        }
        return { vak: trimmed, alternatief: "" };
    };

    const buildDesignName = (vak: string, alternatief: string) =>
        [vak.trim(), alternatief.trim()].filter(Boolean).join(" - ");

    const designName = model.designName || "";
    const designNameParts = splitDesignName(designName);

    function setcrossSectionPanelVisible(value: boolean) {
        model.crossSectionPanelVisible = value;
        if (value) {
            model.costPanelVisible = false;
        }
        if (!value) {
            model.userLinePoints = [];
        }
    }

    function setdesignPanelVisible(value: boolean) {
        model.designPanelVisible = value;
        model.crossSectionPanelVisible = false;
        model.costPanelVisible = false;
    }

    function setCostPanelVisible(value: boolean) {
        model.costPanelVisible = value;
        if (value) {
            model.designPanelVisible = false;
            model.crossSectionPanelVisible = false;
            model.comparisonPanelVisible = false;
        }
    }

    function setComparisonPanelVisible(value: boolean) {
        model.comparisonPanelVisible = value;
        if (value) {
            model.designPanelVisible = false;
            model.crossSectionPanelVisible = false;
            model.costPanelVisible = false;
        }
    }

    const handleCreateNewDesign = () => {
        setDesignNameDialogMode("create");
        setDesignNameDialogOpen(true);
    };

    const handleLoadDesign = () => {
        setLoadDesignsDialogOpen(true);
    };

    const handleLoadDesignGeometries = async (objectId: number) => {
        await loadGeometriesFromDesign(model);
        setValue(1);
    };

    const handleLoadProjectLocal = () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".json";
        fileInput.onchange = (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const jsonContent = JSON.parse(event.target?.result as string) as ProjectJSON;
                        loadProjectFromJSON(model, jsonContent);
                        setValue(1);
                    } catch (error) {
                        console.error("Error parsing JSON file:", error);
                        model.messages.commands.ui.alert.execute({
                            title: "Fout bij laden",
                            message: "Het gekozen bestand is geen geldig project bestand.",
                        });
                    }
                };
                reader.readAsText(file);
            }
        };
        fileInput.click();
    };

    const handleSaveProjectLocal = () => {
        saveProjectAsJSON(model);
    };

    const handleFileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setFileMenuAnchor(event.currentTarget);
    };

    const handleFileMenuClose = () => {
        setFileMenuAnchor(null);
    };

    const handleFileMenuLoad = () => {
        handleLoadProjectLocal();
        handleFileMenuClose();
    };

    const handleFileMenuSave = () => {
        handleSaveProjectLocal();
        handleFileMenuClose();
    };

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const handleSaveWithDialog = () => {
        setSaveDesignsDialogOpen(true);
    };

    const handleSaveDesignWithName = async (name: string) => {
        model.designName = name;
        await handleSaveDesign();
    };

    const handleOpenDownloadDialog = () => {
        setDownloadDialogOpen(true);
    };

    const handleDownload = (downloads: string[], newDesignName: string) => {
        // Update design name if it changed
        if (newDesignName !== designName) {
            model.designName = newDesignName;
        }
        
        downloads.forEach(download => {
            switch (download) {
                case 'inputline':
                    handleExportInputLine();
                    break;
                case '3d':
                    handleExport3dDesign();
                    break;
                case '2d':
                    handleExport2D();
                    break;
                case 'ruimtebeslag':
                    handleExportRuimtebeslag();
                    break;
            }
        });
    };

    const downloadOptions = [
        { value: 'inputline', label: 'Invoerlijn', disabled: !model.graphicsLayerLine?.graphics.length },
        { value: '3d', label: '3D ontwerpdata', disabled: !model.graphicsLayerTemp?.graphics.length },
        { value: '2d', label: '2D ontwerpdata', disabled: !model.graphicsLayerTemp?.graphics.length },
        { value: 'ruimtebeslag', label: '2D ruimtebeslag', disabled: !model.graphicsLayerTemp?.graphics.length },
    ];

    const seriesRef = useRef<am5xy.LineSeries | null>(null);
    const elevationSeriesRef = useRef<am5xy.LineSeries | null>(null);
    const chartSeriesRef = useRef<am5xy.LineSeries | null>(null);
    const meshSeriesRef = useRef<am5xy.LineSeries | null>(null);
    const userSeriesRef = useRef<am5xy.LineSeries | null>(null);

    const mapResizeObserver = () => {
        const mapElement = model.mapElement;
        if (mapElement) {
            const observer = new ResizeObserver((entries) => {
                for (const item of entries) {
                    if (item.contentRect) {
                        const positionLeft = mapElement.getBoundingClientRect().left;
                        const positionRight = mapElement.getBoundingClientRect().right;
                        setMapLeftBorder(positionLeft);
                        setMapRightBorder(positionRight);
                    }
                }
            });
            observer.observe(mapElement);
            return () => observer.disconnect();
        }
    };

    useEffect(() => {
        const disconnectObserver = mapResizeObserver();
        return () => {
            if (disconnectObserver) disconnectObserver();
        };
    }, ); 

    useEffect(() => {
        initializeChart(model, activeTab, { chartContainerRef, seriesRef, elevationSeriesRef, userSeriesRef });
        return () => {
            if (model.chartRoot) {
                model.chartRoot.dispose();
                console.log("Chart disposed");
            }
        }
    }, [model.overviewVisible, model, activeTab, chartContainerRef, model.chartData, model.crossSectionChartData, model.chartDataElevation]);

    useEffect(() => {
        // Compare and log changes
        if (prevDeps.current.model !== model) {
            console.log("model changed");
        }
        if (prevDeps.current.crossSectionChartRoot !== model.crossSectionChartRoot) {
            console.log("model.crossSectionChartRoot changed");
        }
        if (prevDeps.current.crossSectionChartContainerRef !== crossSectionChartContainerRef) {
            console.log("crossSectionChartContainerRef changed");
        }
        if (prevDeps.current.crossSectionChartData !== model.crossSectionChartData) {
            console.log("model.crossSectionChartData changed");
        }
        if (prevDeps.current.meshSeriesData !== model.meshSeriesData) {
            console.log("model.meshSeriesData changed");
        }

        // Update previous values
        prevDeps.current = {
            model,
            crossSectionChartRoot: model.crossSectionChartRoot,
            crossSectionChartContainerRef,
            crossSectionChartData: model.crossSectionChartData,
            meshSeriesData: model.meshSeriesData,
        };

        // ...your effect logic...
        initializeCrossSectionChart(model, crossSectionChartContainerRef, {
            chartSeriesRef,
            meshSeriesRef,
            userSeriesRef
        });
        return () => {
            if (model.crossSectionChartRoot) {
                model.crossSectionChartRoot.dispose();
                console.log("Cross-section chart disposed");
            }
        };
    }, [model, crossSectionChartContainerRef, model.crossSectionChartData, model.meshSeriesData]);



    const handleUploadGeoJSON = () => {
        document.getElementById("geojson-upload")?.click();
    };

    const handleSelectFromMap = () => {
        if (model.lineFeatureLayers?.length > 0) {
            setIsLayerListVisible(true);
        } else {
            console.warn("No line feature layers available.");
        }
    };


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            model.handleGeoJSONUpload(file);
        }
    };

    const handleClearGraphics = () => {
        model.graphicsLayerLine.removeAll();
        model.graphicsLayerCrossSection.removeAll();
        model.graphicsLayerPoint.removeAll();
        model.graphicsLayerProfile.removeAll();
        model.crossSectionChartData = [];
        model.selectedLineLayerId = null;
        model.selectedDijkvakField = null;
        model.lineLength = null;
        model.view.analyses.removeAll()
    };

    const handleGridChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        model.gridSize = parseFloat(event.target.value);
    }

    const setSelectedLineLayerId = (lineLayerId: string) => {
        model.selectedLineLayerId = lineLayerId;
        model.graphicsLayerLine.removeAll();
        setInputLineFromFeatureLayer(model)

        // Find the selected feature layer
        const selectedLayer = model.lineFeatureLayers.find((layer) => layer.id === lineLayerId);
        if (selectedLayer) {
            // Extract field names from the selected layer
            const fields = selectedLayer.fields.map((field: { name: string }) => field.name);
            model.selectedDijkvakLayerFields = fields;
        }
    };

    // const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    //     setActiveTab(newValue);
    // };

    const handleCellChange = (rowIndex: number, colKey: string, value: string) => {

        const updatedData = [...model.chartData];
        const parsedValue = ["afstand", "hoogte"].includes(colKey)
            ? parseFloat(value)
            : value;

        updatedData[rowIndex] = {
            ...updatedData[rowIndex],
            [colKey]: parsedValue,
        };

        model.chartData = updatedData;
        model.allChartData[model.activeSheet] = updatedData; // Update the active sheet data

        // 🔁 Update chart with new data
        seriesRef.current?.data.setAll(updatedData);

        setMapDwpLocation(model, updatedData[rowIndex]);

    };

    const handleOpenOverview = () => {
        setdesignPanelVisible(true);
        setcrossSectionPanelVisible(false);
        const updatedData = [...model.chartData];
        model.chartData = updatedData
        seriesRef.current?.data.setAll(model.chartData);
    };

    const handleClearExcel = () => {
        model.chartData = [];
    };
    const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        setdesignPanelVisible(true); // Close the overview when uploading a new Excel file
        model.handleExcelUpload(event, model);
        console.log("Excel uploaded and design panel opened");

    }

    const handleCreateDesign = async () => {

        model.graphicsLayerMesh.removeAll();
        model.mergedMesh = null;
        model.graphicsLayerTemp.removeAll();
        model.graphicsLayer3dPolygon.removeAll();
        model.graphicsLayerRuimtebeslag.removeAll();
        model.graphicsLayerRuimtebeslag3d.removeAll();
        model.view.analyses.removeAll()
        model.total2dArea = null;
        model.total3dArea = null;
        model.lineLength = null;
        cleanFeatureLayer(model.designLayer2D);

        model.loading = true; // Show loader
        try {

            model.messages.commands.ui.displayNotification.execute({
                message: `Ontwerp wordt gemaakt...`,
                title: "Ontwerp Maken",
                disableTimeouts: true,
                id: "designCreation"
            });
            await createDesigns(model);
            console.log("Designs created");
            
            await calculateVolume(model);
            console.log("Volume calculated");
            
            await calculateDesignValues(model);
            console.log("Design values calculated");
            model.loading = false; // Hide loader
        } catch (error) {
            console.error("Error during design creation:", error);
        } finally {
            model.loading = false; // Hide loader
            model.messages.commands.ui.hideNotification.execute({ id: "designCreation" });
        }
    };


    const handleCreateCrossSection = () => async () => {
        setdesignPanelVisible(false);
        await createCrossSection(model);
    }

    const handleClearDesign = () => {
        model.meshes = []
        model.offsetGeometries = []
        model.graphicsLayerTemp.removeAll();
        model.graphicsLayer3dPolygon.removeAll();
        model.graphicsLayerMesh.removeAll();
        model.graphicsLayerRuimtebeslag.removeAll();
        model.graphicsLayerRuimtebeslag3d.removeAll();
        model.mergedMesh = null;
        model.totalVolumeDifference = null;
        model.excavationVolume = null;
        model.fillVolume = null;

        model.userLinePoints = [];
        model.view.analyses.removeAll()
        model.total2dArea = null;
        model.total3dArea = null;
        model.lineLength = null;

        // intersection resets
        model.intersectingPanden = [];
        model.intersectingBomen = [];
        model.intersectingPercelen = [];
        model.intersectingPercelenArea = 0;
        model.intersectingNatura2000 = 0;
        model.intersectingGNN = 0;
        model.intersectingBeheertypen = [];
        model.intersectingWegdelen2dRuimtebeslag = 0;
        model.intersectingInritten2dRuimtebeslag = 0;
        model.intersectingInritten2dRuimtebeslagCount = [];
        model.intersectingPandenArea = 0;
        model.intersectingPandenBuffer = [];
        model.intersectingPandenBufferArea = 0;
        model.intersectingErven = [];
        model.intersectingErvenArea = 0;
        
        cleanFeatureLayer(model.designLayer2D);

    };

    const handleExport3dDesign = () => {
        export3dGraphicsLayerAsGeoJSON(model)
    };

    const handleExport2D = () => {
        exportDesignLayer2DAsGeoJSON(model)
    }

    const handleExportRuimtebeslag = () => {
        exportRuimteslagLayerAsGeoJSON(model)
    }

    const handleExportInputLine = () => {
        exportInputLinesAsGeoJSON(model)
    }

    const handleSaveDesign = async () => {
        try {
            await save3dDesignToFeatureLayer(model);
            await save2dRuimtebeslagToFeatureLayer(model);

            console.log("Design saved successfully.");
    
        } catch (error) {
            // Optionally show error message to user
            console.error("Failed to save design:", error);
        }
    }


    useWatchAndRerender(model, "excavationVolume");
    useWatchAndRerender(model, "fillVolume");
    useWatchAndRerender(model, "totalVolumeDifference");
    useWatchAndRerender(model, "graphicsLayerLine.graphics.length");
    useWatchAndRerender(model, "graphicsLayerTemp.graphics.length");
    useWatchAndRerender(model, "graphicsLayer3dPolygon.graphics.length");
    useWatchAndRerender(model, "chartData.length");
    useWatchAndRerender(model, "overviewVisible");
    useWatchAndRerender(model, "selectedLineLayerId");
    useWatchAndRerender(model, "gridSize");
    useWatchAndRerender(model, "activeSheet");
    useWatchAndRerender(model, "activeTab");
    useWatchAndRerender(model, "selectedDijkvakField");
    useWatchAndRerender(model, "chartData");
    useWatchAndRerender(model, "allChartData");
    useWatchAndRerender(model, "crossSectionChartData");
    useWatchAndRerender(model, "chartDataElevation");
    useWatchAndRerender(model, "crossSectionChartData.length");
    useWatchAndRerender(model, "crossSectionPanelVisible");
    useWatchAndRerender(model, "designPanelVisible");
    useWatchAndRerender(model, "costPanelVisible");
    useWatchAndRerender(model, "mapElement");
    useWatchAndRerender(model, "isPlacingDwpProfile");
    useWatchAndRerender(model, "rivierzijde");
    useWatchAndRerender(model, "selectedDwpLocation");
    useWatchAndRerender(model, "selectedPointIndex");
    useWatchAndRerender(model, "selectingDwpLocation");
    useWatchAndRerender(model, "crossSectionLength");
    useWatchAndRerender(model, "loading");
    useWatchAndRerender(model, "comparisonPanelVisible");

    // useWatchAndRerender(model, "meshSeriesData");
    // useWatchAndRerender(model, "meshSeriesData.length");


    interface TabPanelProps {
        children?: React.ReactNode;
        index: number;
        value: number;
    }

    function a11yProps(index: number) {
        return {
            id: `simple-tab-${index}`,
            'aria-controls': `simple-tabpanel-${index}`,
        };
    }

    function CustomTabPanel(props: TabPanelProps) {
        const { children, value, index, ...other } = props;

        return (
            <div
                role="tabpanel"
                hidden={value !== index}
                id={`simple-tabpanel-${index}`}
                aria-labelledby={`simple-tab-${index}`}
                {...other}
            >
                {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
            </div>
        );
    }


    const handleSaveDesignName = (vak: string, alternatief: string) => {
        const fullName = buildDesignName(vak, alternatief);
        model.designName = fullName;
        setDesignNameDialogOpen(false);
        if (designNameDialogMode === "create") {
            setValue(1);
        }
    };

    return (
        <LayoutElement {...props} style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            {model.loading && (
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
            <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Left Sidebar - Collapsible */}
                {model.mapInitialized && (
                <Box sx={{
                    width: sidebarExpanded ? "220px" : "70px",
                    backgroundColor: "#fafbfc",
                    borderRight: "1px solid #e5e7eb",
                    p: sidebarExpanded ? 2 : 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: sidebarExpanded ? 2 : 1,
                    minHeight: "100%",
                    transition: "all 0.3s ease",
                    position: "relative",
                }}>
                    {/* Collapse/Expand Toggle Button - Middle Right */}
                    <IconButton
                        onClick={() => setSidebarExpanded(!sidebarExpanded)}
                        title={sidebarExpanded ? "Samenvouwen" : "Uitvouwen"}
                        sx={{
                            position: "absolute",
                            top: "50%",
                            right: -12,
                            transform: "translateY(-50%)",
                            color: "#0078d4",
                            width: "32px",
                            height: "32px",
                            backgroundColor: "#fff",
                            border: "1px solid #e5e7eb",
                            zIndex: 10,
                            transition: "all 0.3s ease",
                            "&:hover": {
                                color: "#106ebe",
                                backgroundColor: "#f5f7fa",
                                borderColor: "#0078d4",
                            }
                        }}
                    >
                        {sidebarExpanded ? <ChevronLeftIcon sx={{ fontSize: "18px" }} /> : <ChevronRightIcon sx={{ fontSize: "18px" }} />}
                    </IconButton>

                    {/* Sidebar Title */}
                    {sidebarExpanded && (
                        <Typography
                            sx={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#666",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                mb: 1,
                            }}
                        >
                            Dijkontwerper
                        </Typography>
                    )}

                    {/* Sidebar Action Buttons */}
                    <Stack spacing={sidebarExpanded ? 1.5 : 1}>
                        {/* Load Button */}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                            title={!sidebarExpanded ? "Laden" : ""}
                        >
                            <Button
                                variant="outlined"
                                startIcon={<UploadIcon />}
                                onClick={handleFileMenuLoad}
                                fullWidth={sidebarExpanded}
                                size="small"
                                sx={{
                                    backgroundColor: "#fff",
                                    color: "#0078d4",
                                    textTransform: "none",
                                    fontSize: sidebarExpanded ? "13px" : "0px",
                                    fontWeight: 600,
                                    boxShadow: "none",
                                    transition: "all 0.2s ease",
                                    borderColor: "#e5e7eb",
                                    borderLeft: "3px solid #0078d4",
                                    justifyContent: sidebarExpanded ? "flex-start" : "center",
                                    paddingLeft: sidebarExpanded ? 1.5 : 0.5,
                                    minWidth: sidebarExpanded ? "auto" : "44px",
                                    width: sidebarExpanded ? "100%" : "44px",
                                    height: "44px",
                                    "&:hover": {
                                        backgroundColor: "#f5f7fa",
                                        boxShadow: "none",
                                        borderColor: "#0078d4",
                                    }
                                }}
                            >
                                {sidebarExpanded ? "Laden" : ""}
                            </Button>
                        </Box>

                        {/* Save Button */}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                            title={!sidebarExpanded ? "Opslaan" : ""}
                        >
                            <Button
                                variant="outlined"
                                startIcon={<SaveIcon />}
                                onClick={handleFileMenuSave}
                                disabled={!designName}
                                fullWidth={sidebarExpanded}
                                size="small"
                                sx={{
                                    backgroundColor: "#fff",
                                    color: designName ? "#0078d4" : "#ccc",
                                    textTransform: "none",
                                    fontSize: sidebarExpanded ? "13px" : "0px",
                                    fontWeight: 600,
                                    boxShadow: "none",
                                    transition: "all 0.2s ease",
                                    borderColor: designName ? "#e5e7eb" : "#f0f0f0",
                                    borderLeft: designName ? "3px solid #0078d4" : "3px solid #e5e7eb",
                                    justifyContent: sidebarExpanded ? "flex-start" : "center",
                                    paddingLeft: sidebarExpanded ? 1.5 : 0.5,
                                    minWidth: sidebarExpanded ? "auto" : "44px",
                                    width: sidebarExpanded ? "100%" : "44px",
                                    height: "44px",
                                    "&:hover": designName ? {
                                        backgroundColor: "#f5f7fa",
                                        boxShadow: "none",
                                        borderColor: "#0078d4",
                                    } : {},
                                }}
                            >
                                {sidebarExpanded ? "Opslaan" : ""}
                            </Button>
                        </Box>

                        {/* Change Title Button */}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                            title={!sidebarExpanded ? "Titel wijzigen" : ""}
                        >
                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => {
                                    setDesignNameDialogMode("edit");
                                    setDesignNameDialogOpen(true);
                                }}
                                disabled={!designName}
                                fullWidth={sidebarExpanded}
                                size="small"
                                sx={{
                                    backgroundColor: "#fff",
                                    color: designName ? "#0078d4" : "#ccc",
                                    textTransform: "none",
                                    fontSize: sidebarExpanded ? "13px" : "0px",
                                    fontWeight: 600,
                                    boxShadow: "none",
                                    transition: "all 0.2s ease",
                                    borderColor: designName ? "#e5e7eb" : "#f0f0f0",
                                    borderLeft: designName ? "3px solid #0078d4" : "3px solid #e5e7eb",
                                    justifyContent: sidebarExpanded ? "flex-start" : "center",
                                    paddingLeft: sidebarExpanded ? 1.5 : 0.5,
                                    minWidth: sidebarExpanded ? "auto" : "44px",
                                    width: sidebarExpanded ? "100%" : "44px",
                                    height: "44px",
                                    "&:hover": designName ? {
                                        backgroundColor: "#f5f7fa",
                                        boxShadow: "none",
                                        borderColor: "#0078d4",
                                    } : {},
                                }}
                            >
                                {sidebarExpanded ? "Titel wijzigen" : ""}
                            </Button>
                        </Box>
                    </Stack>
                </Box>
                )}

                {/* Main Content Area */}
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", width: 0 }}>
                    {/* File menu button bar - kept for backward compatibility but hidden */}
                    <Box sx={{ position: "relative", mb: 0, p: 0, backgroundColor: "#fafbfc", borderRadius: 0, display: "none" }}>
                        <Button
                            onClick={handleFileMenuOpen}
                            endIcon={<ExpandMoreIcon />}
                            variant="outlined"
                            fullWidth
                            sx={{
                                backgroundColor: "#fff",
                                color: "#0078d4",
                                textTransform: "none",
                                fontSize: "15px",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                boxShadow: "none",
                                transition: "all 0.2s ease",
                                justifyContent: "flex-start",
                                paddingLeft: 3,
                                paddingY: 1.5,
                                borderRadius: 0,
                                border: "1px solid #e5e7eb",
                                borderLeft: "4px solid #0078d4",
                                "&:hover": {
                                    backgroundColor: "#f5f7fa",
                                    boxShadow: "none",
                                }
                            }}
                        >
                            Mijn ontwerpen
                        </Button>
                        <Menu
                            anchorEl={fileMenuAnchor}
                            open={fileMenuOpen}
                            onClose={handleFileMenuClose}
                            PaperProps={{
                                sx: {
                                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                                    mt: 0.5,
                                }
                            }}
                        >
                            <MenuItem 
                                onClick={handleFileMenuLoad}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    py: 1.5,
                                    px: 2,
                                }}
                            >
                                <UploadIcon sx={{ fontSize: "20px", color: "#0078d4" }} />
                                <Box>
                                    <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                                        Laden
                                    </Typography>
                                    <Typography sx={{ fontSize: "12px", color: "#666" }}>
                                        Lokaal bestand laden
                                    </Typography>
                                </Box>
                            </MenuItem>
                            <MenuItem 
                                onClick={handleFileMenuSave} 
                                disabled={!designName}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    py: 1.5,
                                    px: 2,
                                }}
                            >
                                <SaveIcon sx={{ fontSize: "20px", color: designName ? "#0078d4" : "#ccc" }} />
                                <Box>
                                    <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
                                        Opslaan
                                    </Typography>
                                    <Typography sx={{ fontSize: "12px", color: designName ? "#666" : "#999" }}>
                                        Lokaal opslaan
                                    </Typography>
                                </Box>
                            </MenuItem>
                        </Menu>
                    </Box>

                    {/* Horizontal divider */}
                    <Box sx={{ borderBottom: 1, borderColor: "#e5e7eb", mb: 2, mt: 0 }} />
                    
                    <Typography
                        sx={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: designName ? "#323130" : "#a19f9d",
                            opacity: designName ? 1 : 0.6,
                            mb: 2,
                            px: 2,
                        }}
                    >
                        {designName ? `Ontwerp: ${designName}` : "Geen ontwerp gekozen"}
                    </Typography>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={value}
                            onChange={handleChange}
                            variant="scrollable"
                            scrollButtons="auto"
                            aria-label="scrollable auto tabs example"
                        >
                            <Tab 
                                icon={<HomeIcon />} 
                                label="Home"
                                {...a11yProps(0)}
                                disabled={!model.mapInitialized}
                            />
                            <Tab 
                                icon={<ArchitectureIcon />} 
                                label={(<span>Dimensioneer<br />grondlichaam</span>) as any}
                                {...a11yProps(1)}
                                disabled={!designName}
                            />
                            <Tab 
                                icon={<BuildIcon />} 
                                label={(<span>Dimensioneer<br />constructie</span>) as any}
                                {...a11yProps(2)}
                                disabled={!designName}
                            />
                            <Tab icon={<AssessmentIcon />} label="Effecten" {...a11yProps(3)} disabled={!designName} />
                            <Tab icon={<AttachMoneyIcon />} label="Kosten" {...a11yProps(4)} disabled={!designName} />
                            <Tab icon={<SelectAllIcon />} label="Afwegen" {...a11yProps(5)} disabled={!designName} />
                            </Tabs>
                        </Box>
                        <Box sx={{ flex: 1, overflow: "auto" }}>
                            <CustomTabPanel value={value} index={0}>
                            <HomePanel
                                onCreateNewDesign={handleCreateNewDesign}
                                onLoadDesign={handleLoadDesign}
                                onLoadProjectLocal={handleLoadProjectLocal}
                                onSaveProjectLocal={handleSaveProjectLocal}
                                designFeatureLayer3dUrl={model.designFeatureLayer3dUrl}
                                designName={designName}
                                isLoading={!model.mapInitialized}
                            />
                        </CustomTabPanel>
                        <CustomTabPanel value={value} index={1}>
                            <DimensionsPanel
                                model={model}
                                isLayerListVisible={isLayerListVisible}
                                setSelectedLineLayerId={setSelectedLineLayerId}
                                handleUploadGeoJSON={handleUploadGeoJSON}
                                handleSelectFromMap={handleSelectFromMap}
                                handleFileChange={handleFileChange}
                                handleClearGraphics={handleClearGraphics}
                                handleGridChange={handleGridChange}
                                handleExcelUpload={handleExcelUpload}
                                handleClearExcel={handleClearExcel}
                                handleOpenOverview={handleOpenOverview}
                                handleCreateDesign={handleCreateDesign}
                                handleClearDesign={handleClearDesign}
                                handleCreateCrossSection={handleCreateCrossSection}
                                handleSaveWithDialog={handleSaveWithDialog}
                                handleOpenDownloadDialog={handleOpenDownloadDialog}
                                designName={designName}
                            />
                        </CustomTabPanel>
                        <CustomTabPanel value={value} index={2}>
                            <ConstructionPanel model={model} />
                        </CustomTabPanel>
                        <CustomTabPanel value={value} index={3}>
                            <EffectAnalysisPanel model={model} />
                        </CustomTabPanel>
                        <CustomTabPanel value={value} index={4}>
                            {/* TODO: Add Kosten panel content */}
                            <CostCalculationPanel model={model} />
                        </CustomTabPanel>
                        <CustomTabPanel value={value} index={5}>
                            <ComparisonChartAndTablePanel 
                                model={model}
                                onLoadDesign={() => setValue(1)}
                            />
                        </CustomTabPanel>
                    </Box>
                </Box>
            </Box>

            {/* Paper for Chart and Table */}
            {model.designPanelVisible && (() => {
                // Initialize empty data if needed
                if (!model.chartData || model.chartData.length === 0) {
                    model.initializeEmptyChartData();
                }
                return (
                    <ChartAndTablePanel
                        setdesignPanelVisible={setdesignPanelVisible}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        mapLeftBorder={mapLeftBorder}
                        mapRightBorder={mapRightBorder}
                        chartContainerRef={chartContainerRef}
                        model={model}
                        handleCellChange={handleCellChange}
                        handleClearExcel={handleClearExcel}
                        handleExcelUpload={handleExcelUpload}
                        handleCreateDesign={handleCreateDesign}
                    />
                );
            })()}
            {/* Paper for Cross Section Chart */}
            {model.crossSectionPanelVisible && (
                <CrossSectionChartPanel
                    setcrossSectionPanelVisible={setcrossSectionPanelVisible}
                    mapLeftBorder={mapLeftBorder}
                    mapRightBorder={mapRightBorder}
                    crossSectionChartContainerRef={crossSectionChartContainerRef}
                    model={model}
                />
            )}
            {/* Paper for Cost Chart and Table */}
            {model.costPanelVisible && (
                <CostChartAndTablePanel
                    setPanelVisible={setCostPanelVisible}
                    mapLeftBorder={mapLeftBorder}
                    mapRightBorder={mapRightBorder}
                    model={model}
                />
            )}

            {/* Paper for Comparison Table */}
            {model.comparisonPanelVisible && (
                <ComparisonDataPanel
                    setPanelVisible={setComparisonPanelVisible}
                    mapLeftBorder={mapLeftBorder}
                    mapRightBorder={mapRightBorder}
                    model={model}
                />
            )}

            {/* Load Designs Dialog */}
            <LoadDesignsDialog
                open={loadDesignsDialogOpen}
                onClose={() => setLoadDesignsDialogOpen(false)}
                designFeatureLayer3dUrl={model.designFeatureLayer3dUrl}
                model={model}
                onLoadDesign={handleLoadDesignGeometries}
            />

            {/* Save Designs Dialog */}
            <SaveDesignsDialog
                open={saveDesignsDialogOpen}
                onClose={() => setSaveDesignsDialogOpen(false)}
                onSave={handleSaveDesignWithName}
                initialDesignName={designName}
            />

            {/* Download Dialog */}
            <DownloadDialog
                open={downloadDialogOpen}
                onClose={() => setDownloadDialogOpen(false)}
                onDownload={handleDownload}
                selectedDownloads={selectedDownloads}
                setSelectedDownloads={setSelectedDownloads}
                downloadOptions={downloadOptions}
                initialDesignName={designName}
            />

            <DesignNameDialog
                open={designNameDialogOpen}
                onClose={() => setDesignNameDialogOpen(false)}
                onSave={handleSaveDesignName}
                initialVak={designNameDialogMode === "create" ? "" : designNameParts.vak}
                initialAlternatief={designNameDialogMode === "create" ? "" : designNameParts.alternatief}
                title={designNameDialogMode === "create" ? "Nieuw ontwerp maken" : "Ontwerp naam wijzigen"}
            />
        </LayoutElement>
    );
};

export default DikeDesigner;
