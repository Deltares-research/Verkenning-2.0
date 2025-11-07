/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/order */
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import Box from "@vertigis/web/ui/Box";
import Button from "@vertigis/web/ui/Button";
import IconButton from "@vertigis/web/ui/IconButton";
import Paper from "@vertigis/web/ui/Paper";
import Slider from "@vertigis/web/ui/Slider";
import Tab from "@vertigis/web/ui/Tab";
import Tabs from "@vertigis/web/ui/Tabs";
import TextField from "@vertigis/web/ui/Input";
import Typography from "@vertigis/web/ui/Typography";
import React, { useState } from "react";

import ButtonToolbar from "../ButtonToolbar";
import DataTable from "./DataTable";
import TableActions from "./TableActions";

interface ChartAndTablePanelProps {
  setdesignPanelVisible: (visible: boolean) => void;
  activeTab: number;
  setActiveTab: (tab: number) => void;
  mapLeftBorder: number;
  mapRightBorder: number;
  chartContainerRef: React.RefObject<HTMLDivElement>;
  model: any;
  handleCellChange: (rowIndex: number, colKey: string, value: string) => void;
  handleClearExcel: () => void;
  handleExcelUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ChartAndTablePanel: React.FC<ChartAndTablePanelProps> = ({
  setdesignPanelVisible,
  activeTab,
  setActiveTab,
  mapLeftBorder,
  mapRightBorder,
  chartContainerRef,
  model,
  handleCellChange,
  handleClearExcel,
  handleExcelUpload,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showLengthSlider, setShowLengthSlider] = useState(false);

  const handleAddRow = () => {
    const newRow = {
      oid: model.chartData.length + 1,
      locatie: "",
      afstand: "",
      hoogte: "",
    };
    model.chartData = [...model.chartData, newRow];
  };

  const handleDownloadDesigns = () => {
    model.handleExcelDownload();
  };

  const handleToggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleToggleLengthSlider = () => {
    setShowLengthSlider(!showLengthSlider);
  };

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          position: "fixed",
          bottom: 0,
          left: mapLeftBorder,
          width: mapRightBorder - mapLeftBorder,
          height: isMaximized ? "100vh" : "50%",
          zIndex: 10,
          p: 0,
          borderRadius: "5px",
          backgroundColor: "#ffffff",
          boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            color: "#ffffff",
            backgroundColor: "#1976d2",
            px: 2,
            py: 1,
            fontSize: "12px",
            borderTopLeftRadius: "4px",
            borderTopRightRadius: "4px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          Design overzicht

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              aria-label="maximize"
              onClick={handleToggleMaximize}
              size="medium"
              sx={{ color: "#ffffff", marginRight: 1 }}
            >
              {isMaximized ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
            <IconButton
              aria-label="close"
              onClick={() => setdesignPanelVisible(false)}
              size="medium"
              sx={{ color: "#ffffff" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Typography>

        {/* Button Toolbar */}
        <ButtonToolbar 
          model={model} 
          handleToggleLengthSlider={handleToggleLengthSlider}
        />

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(event, newValue: number) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{
            flexShrink: 0,
            minHeight: '36px',
            '& .MuiTab-root': {
              backgroundColor: '#f0f0f0',
              minHeight: '36px',
              padding: '6px 12px',
              '&.Mui-selected': {
                backgroundColor: '#1976d2',
                color: 'white',
                fontWeight: 'bold',
              },
              '&:hover': {
                backgroundColor: '#e0e0e0',
              },
            },
          }}
        >
          <Tab label="Dwarsprofiel" sx={{ fontSize: "11px" }} />
          <Tab label="Invoerdata" sx={{ fontSize: "11px" }} />
        </Tabs>

        {/* Content Area */}
        {activeTab === 0 && (
          <Box
            ref={chartContainerRef}
            sx={{
              flexGrow: 1,
              width: "100%",
              overflow: "hidden",
            }}
          />
        )}

        {activeTab === 1 && (
          <>
            <TableActions
              model={model}
              handleAddRow={handleAddRow}
              handleDownloadDesigns={handleDownloadDesigns}
              handleExcelUpload={handleExcelUpload}
            />
            
            <DataTable
              model={model}
              handleCellChange={handleCellChange}
            />
          </>
        )}
      </Paper>

      {/* Length Slider Dialog */}
      <Dialog
        open={showLengthSlider}
        onClose={handleToggleLengthSlider}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Dwarsprofiel Lengte Instellen</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Dwarsprofiel lengte: {model.crossSectionLength}m
          </Typography>
          <Slider
            value={model.crossSectionLength}
            onChange={(event: Event, newValue: number | number[]) => {
              model.crossSectionLength = newValue as number;
            }}
            min={50}
            max={500}
            step={10}
            marks={[
              { value: 50, label: '50m' },
              { value: 100, label: '100m' },
              { value: 200, label: '200m' },
              { value: 300, label: '300m' },
              { value: 500, label: '500m' }
            ]}
            valueLabelDisplay="auto"
            sx={{ mt: 2, mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleToggleLengthSlider} variant="contained" color="primary">
            Sluiten
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChartAndTablePanel;


