import type am5xy from "@amcharts/amcharts5/xy";
import ArchitectureIcon from "@mui/icons-material/Architecture";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import BuildIcon from "@mui/icons-material/Build";
import EditIcon from "@mui/icons-material/Edit";

import Box from "@vertigis/web/ui/Box";
import Tab from "@vertigis/web/ui/Tab"
import Tabs from "@vertigis/web/ui/Tabs"
import Stack from "@vertigis/web/ui/Stack";
import FormLabel from "@vertigis/web/ui/FormLabel";
import Input from "@vertigis/web/ui/Input";
import Alert from "@vertigis/web/ui/Alert"

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


import { save2dRuimtebeslagToFeatureLayer, save3dDesignToFeatureLayer } from "./Functions/SaveFunctions";
import ChartAndTablePanel from "./SubComponents/Dimensions/ChartAndTablePanel";
import CrossSectionChartPanel from "./SubComponents/Dimensions/CrossSectionChartPanel";
import DimensionsPanel from "./SubComponents/Dimensions/DimensionsPanel";
import EffectAnalysisPanel from "./SubComponents/Effects/EffectAnalysisPanel";


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
    const [loading, setLoading] = useState(false); // State to track loading status
    const [value, setValue] = React.useState(0);
    const [isLayerListVisible, setIsLayerListVisible] = useState(false);
    const [designName, setDesignName] = useState<string>(() => model.designName || "");
    const [showNameWarning, setShowNameWarning] = useState(false);
    const [selectedDownloads, setSelectedDownloads] = useState<string[]>([]);

    function setcrossSectionPanelVisible(value: boolean) {
        model.crossSectionPanelVisible = value;
        if (!value) {
            model.userLinePoints = [];
        }
    }

    function setdesignPanelVisible(value: boolean) {
        model.designPanelVisible = value;
        model.crossSectionPanelVisible = false;
    }



    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const handleDesignNameChange = (e) => {
        setDesignName(e.target.value);
        // Hide warning when user starts typing
        if (e.target.value.trim()) {
            setShowNameWarning(false);
        }
    };

    const handleDesignNameBlur = () => {
        // Update model when input loses focus
        if (designName.trim()) {
            model.designName = designName.trim();
        }
    };

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
        model.view.analyses.removeAll()
        model.total2dArea = null;
        model.total3dArea = null;
        model.lineLength = null;
        cleanFeatureLayer(model.designLayer2D);

        setLoading(true); // Show loader
        try {
            await createDesigns(model);
            console.log("Designs created");
            
            await calculateVolume(model);
            console.log("Volume calculated");
            
            await calculateDesignValues(model);
            console.log("Design values calculated");
        } catch (error) {
            console.error("Error during design creation:", error);
        } finally {
            setLoading(false); // Hide loader
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
    useWatchAndRerender(model, "mapElement");
    useWatchAndRerender(model, "isPlacingDwpProfile");
    useWatchAndRerender(model, "rivierzijde");
    useWatchAndRerender(model, "selectedDwpLocation");
    useWatchAndRerender(model, "selectedPointIndex");
    useWatchAndRerender(model, "selectingDwpLocation");
    useWatchAndRerender(model, "crossSectionLength");

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


    return (
        <LayoutElement {...props} style={{ width: "100%", overflowY: "auto" }}>
            <Box
                sx={{ width: '100%' }}
            >
                {/* Ontwerp naam - prominent bovenaan */}
                <Stack spacing={1.5} sx={{
                    padding: '16px',
                    borderRadius: '8px',
                }}>
                    <FormLabel sx={{ 
                        fontWeight: 'bold', 
                        fontSize: '14px',
                        color: '#000000ff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}>
                        <EditIcon sx={{ fontSize: 18 }} />
                        Ontwerp naam
                    </FormLabel>
                    
                    <Input
                        value={designName}
                        onChange={handleDesignNameChange}
                        onBlur={handleDesignNameBlur}
                        placeholder="Voer een ontwerpnaam in..."
                        size="medium"
                        fullWidth
                        error={showNameWarning}
                        sx={{
                            fontSize: '14px',
                            fontWeight: 500,
                            '& .MuiInputBase-input': {
                                padding: '12px 14px',
                            },
                            backgroundColor: 'white',
                        }}
                    />

                    {/* Alert onder de naam input */}
                    {showNameWarning && (
                        <Alert severity="warning" sx={{ marginTop: 1 }}>
                            Vul een ontwerp naam in voordat u bestanden downloadt of opslaat.
                        </Alert>
                    )}
                </Stack>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={value}
                        onChange={handleChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        aria-label="scrollable auto tabs example"
                    >
                        <Tab 
                            icon={<ArchitectureIcon />} 
                            label={(<span>Dimensioneer<br />grondlichaam</span>) as any}
                            {...a11yProps(0)}
                        />
                        <Tab 
                            icon={<BuildIcon />} 
                            label={(<span>Dimensioneer<br />constructie</span>) as any}
                            {...a11yProps(1)}
                        />
                        <Tab icon={<AssessmentIcon />} label="Effecten" {...a11yProps(2)} />
                        <Tab icon={<AttachMoneyIcon />} label="Kosten" {...a11yProps(3)} />
                        <Tab icon={<SelectAllIcon />} label="Afwegen" {...a11yProps(4)} />
                    </Tabs>
                </Box>
                <CustomTabPanel value={value} index={0}>
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
                        handleExport3dDesign={handleExport3dDesign}
                        handleExportInputLine={handleExportInputLine}
                        handleExport2D={handleExport2D}
                        handleExportRuimtebeslag={handleExportRuimtebeslag}
                        handleClearDesign={handleClearDesign}
                        handleCreateCrossSection={handleCreateCrossSection}
                        handleSaveDesign={handleSaveDesign}
                        loading={loading}
                        setShowNameWarning={setShowNameWarning}
                        selectedDownloads={selectedDownloads}
                        setSelectedDownloads={setSelectedDownloads}
                    />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={1}>
                    {/* TODO: Add Dimensioneer constructie panel content */}
                    <Box sx={{ p: 2 }}>
                        Dimensioneer constructie - Coming soon
                    </Box>
                </CustomTabPanel>
                <CustomTabPanel value={value} index={2}>
                    <EffectAnalysisPanel model={model} />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={3}>
                    {/* TODO: Add Kosten panel content */}
                    <Box sx={{ p: 2 }}>
                        Kosten - Coming soon
                    </Box>
                </CustomTabPanel>
                <CustomTabPanel value={value} index={4}>
                    {/* TODO: Add Afwegen panel content */}
                    <Box sx={{ p: 2 }}>
                        Afwegen - Coming soon
                    </Box>
                </CustomTabPanel>
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
        </LayoutElement>
    );
};

export default DikeDesigner;
