import AddIcon from "@mui/icons-material/Add";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {
  Box,
  Button,
} from "@mui/material";
import React from "react";

interface TableActionsProps {
  model: any;
  handleAddRow: () => void;
  handleDownloadDesigns: () => void;
  handleExcelUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const TableActions: React.FC<TableActionsProps> = ({
  model,
  handleAddRow,
  handleDownloadDesigns,
  handleExcelUpload,
}) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      padding: "8px",
      backgroundColor: "#f5f5f5",
    }}
  >
    <Button
      variant="contained"
      color="secondary"
      startIcon={<AddIcon />}
      onClick={handleAddRow}
    >
      Voeg nieuwe rij toe
    </Button>
    
    <Box sx={{ display: "flex", gap: 1 }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<CloudDownloadIcon />}
        onClick={handleDownloadDesigns}
        disabled={model.chartData?.length === 0}
      >
        Download ontwerpen (Excel)
      </Button>
      <Button
        variant="contained"
        color="primary"
        startIcon={<CloudUploadIcon />}
        component="label"
        disabled={model.graphicsLayerLine?.graphics?.length === 0 || !model.chartDataElevation?.length}
      >
        Upload ontwerpen (Excel)
        <input
          type="file"
          accept=".xlsx, .xls"
          hidden
          onChange={handleExcelUpload}
        />
      </Button>
    </Box>
  </Box>
);

export default TableActions;
