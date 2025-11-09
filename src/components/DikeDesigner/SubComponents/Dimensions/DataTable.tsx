import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

import Table from "@vertigis/web/ui/Table"
import TableContainer from "@vertigis/web/ui/Box"
import TableHead from "@vertigis/web/ui/TableHead"
import TableRow from "@vertigis/web/ui/TableRow"
import TableCell from "@vertigis/web/ui/TableCell"
import TableBody from "@vertigis/web/ui/TableBody"
import Select from "@vertigis/web/ui/Select"  
import MenuItem from "@vertigis/web/ui/MenuItem"
import Typography from "@vertigis/web/ui/Typography"
import Switch from "@vertigis/web/ui/Switch"
import FormControlLabel from "@vertigis/web/ui/FormControlLabel"
import IconButton from "@vertigis/web/ui/IconButton"
import Box from "@vertigis/web/ui/Box"
import TextField from "@vertigis/web/ui/Input"

import React, { useState } from "react";

import { clearDwpLocation, setMapDwpLocation } from "../../Functions/DesignFunctions";

interface DataTableProps {
  model: any;
  handleCellChange: (rowIndex: number, colKey: string, value: string) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  model,
  handleCellChange,
}) => {
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [rowToggleStates, setRowToggleStates] = useState<Record<number, 'hoogte' | 'afstand'>>({});
  const [taludInputValues, setTaludInputValues] = useState<Record<number, string>>({});

  const handleRemoveRow = (rowIndex: number) => {
    const rowToRemove = model.chartData[rowIndex];
    if (!rowToRemove) return;
    
    model.chartData = model.chartData.filter((row) => row.oid !== rowToRemove.oid);
    clearDwpLocation(model, rowToRemove);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedRowIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedRowIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedRowIndex === null || draggedRowIndex === dropIndex) {
      return;
    }

    const newChartData = [...model.chartData];
    const draggedItem = newChartData[draggedRowIndex];

    newChartData.splice(draggedRowIndex, 1);
    newChartData.splice(dropIndex, 0, draggedItem);

    model.chartData = newChartData;
  };

  const handleToggleSwitch = (rowIndex: number) => {
    setRowToggleStates(prev => {
      const currentState = prev[rowIndex] || 'hoogte';
      const newState = currentState === 'hoogte' ? 'afstand' : 'hoogte';
      
      return {
        ...prev,
        [rowIndex]: newState
      };
    });
  };

  const handleTaludChange = (rowIndex: number, newTalud: string) => {
    const taludValue = parseFloat(newTalud);
    if (isNaN(taludValue) || taludValue <= 0) return;

    const currentRow = model.chartData[rowIndex];
    const prevRow = model.chartData[rowIndex - 1];
    
    if (!prevRow) return;

    const currentAfstand = parseFloat(currentRow.afstand as string) || 0;
    const currentHoogte = parseFloat(currentRow.hoogte as string) || 0;
    const prevAfstand = parseFloat(prevRow.afstand as string) || 0;
    const prevHoogte = parseFloat(prevRow.hoogte as string) || 0;

    const currentHeightDiff = Math.abs(currentHoogte - prevHoogte);
    const currentDistanceDiff = Math.abs(currentAfstand - prevAfstand);

    const shouldChangeAfstand = (rowToggleStates[rowIndex] || 'hoogte') === 'afstand';

    if (shouldChangeAfstand) {
      const newDistanceDiff = taludValue * currentHeightDiff;
      const newAfstand = currentAfstand > prevAfstand 
        ? prevAfstand + newDistanceDiff 
        : prevAfstand - newDistanceDiff;
      
      handleCellChange(rowIndex, 'afstand', newAfstand.toFixed(1));
    } else {
      const newHeightDiff = currentDistanceDiff / taludValue;
      const newHoogte = currentHoogte > prevHoogte 
        ? prevHoogte + newHeightDiff 
        : prevHoogte - newHeightDiff;
      
      handleCellChange(rowIndex, 'hoogte', newHoogte.toFixed(1));
    }
  };

  return (
    <TableContainer
      key={model.activeSheet}
      sx={{ flexGrow: 1, overflow: "auto" }}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell align="center" sx={{ fontSize: "11px", width: "40px", padding: "4px", border: "1px solid #ddd" }} />
            {model.chartData?.length > 0 &&
              Object.keys(model.chartData[0] as object || {}).slice(1).map((header) => (
                <TableCell key={header} align="center" sx={{ fontSize: "11px", padding: "4px", border: "1px solid #ddd" }}>
                  {header.charAt(0).toUpperCase() + header.slice(1)}
                </TableCell>
              ))}
            {model.chartData?.length > 0 && (
              <>
                <TableCell align="center" sx={{ fontSize: "11px", padding: "4px", border: "1px solid #ddd" }}>Talud</TableCell>
                <TableCell align="center" sx={{ fontSize: "11px", padding: "4px", border: "1px solid #ddd" }}>Acties</TableCell>
              </>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {model.chartData?.map((row, rowIndex) => {
            const rowKey = `row-${rowIndex}`;
            const prevRow = model.chartData[rowIndex - 1];
            
            const currentAfstand = parseFloat(row.afstand as string) || 0;
            const currentHoogte = parseFloat(row.hoogte as string) || 0;
            const prevAfstand = prevRow ? (parseFloat(prevRow.afstand as string) || 0) : 0;
            const prevHoogte = prevRow ? (parseFloat(prevRow.hoogte as string) || 0) : 0;

            const absoluteDistanceDiff = Math.abs(currentAfstand - prevAfstand);
            const heightDiff = Math.abs(currentHoogte - prevHoogte);
            const talud = prevRow && heightDiff !== 0 ? (absoluteDistanceDiff / heightDiff).toFixed(1) : '';

            return (
              <TableRow
                key={rowKey}
                draggable
                onDragStart={(e) => handleDragStart(e, rowIndex as number)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, rowIndex as number)}
                sx={{
                  cursor: "move",
                  "&:hover": { backgroundColor: "#f9f9f9" },
                  backgroundColor: draggedRowIndex === rowIndex ? "#e3f2fd" : "inherit",
                  opacity: draggedRowIndex === rowIndex ? 0.5 : 1,
                }}
              >
                <TableCell align="center" sx={{ width: "40px", padding: "4px", border: "1px solid #ddd" }}>
                  <DragIndicatorIcon
                    sx={{
                      color: "#999",
                      fontSize: "18px",
                      cursor: "grab",
                      "&:hover": { color: "#666" },
                      "&:active": { cursor: "grabbing" },
                    }}
                  />
                </TableCell>

                {Object.entries(row as object || {}).slice(1).map(([key, cell], colIndex) => (
                  <TableCell key={`${rowKey}-${key}`} align="center" sx={{ padding: "4px", border: "1px solid #ddd" }}>
                    {colIndex === 0 ? (
                      <Select
                        value={cell}
                        onChange={(e) =>
                          handleCellChange(rowIndex as number, key, e.target.value as string)
                        }
                        variant="outlined"
                        size="small"
                        fullWidth
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {model.dwpLocations.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <TextField
                        value={cell || ""}
                        onBlur={(e) => {
                          handleCellChange(rowIndex as number, key, e.target.value);
                          if ((key === 'afstand' || key === 'hoogte') && model.chartDataElevation?.length) {
                            setMapDwpLocation(model, {
                              ...row,
                              [key]: e.target.value
                            });
                          }
                        }}
                        onChange={(e) => {
                          const value = e.target.value.replace(",", ".");
                          const updatedData = [...model.chartData];
                          updatedData[rowIndex][key] = value;
                          model.chartData = updatedData;
                        }}
                   
                        size="small"
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    )}
                  </TableCell>
                ))}

                {/* Talud column */}
                {rowIndex === 0 ? (
                  <TableCell align="center" sx={{ padding: "4px", border: "1px solid #ddd" }}>-</TableCell>
                ) : (
                  <TableCell align="center" sx={{ fontSize: '12px', width: '80px', minWidth: '80px', padding: "4px", border: "1px solid #ddd" }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center' }}>
                      <Typography sx={{ fontSize: '12px', fontWeight: 'bold' }}>1:</Typography>
                      <TextField
                        sx={{ width: '50px' }}
                        value={taludInputValues[rowIndex] !== undefined ? taludInputValues[rowIndex] : talud}
                        onBlur={(e) => handleTaludChange(rowIndex as number, e.target.value)}
                        onChange={(e) => {
                          const value = e.target.value.replace(",", ".");
                          setTaludInputValues(prev => ({ ...prev, [rowIndex]: value }));
                        }}
                        size="small"
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    </Box>
                  </TableCell>
                )}

                {/* Actions column */}
                <TableCell align="center" sx={{ padding: "4px", border: "1px solid #ddd" }}>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                    {rowIndex !== 0 && (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={(rowToggleStates[rowIndex] || 'hoogte') === 'afstand'}
                            onChange={() => handleToggleSwitch(rowIndex as number)}
                            size="small"
                          />
                        }
                        label={
                          <Typography sx={{ fontSize: '10px' }}>
                            {(rowToggleStates[rowIndex] || 'hoogte') === 'afstand' ? 'afstand' : 'hoogte'}
                          </Typography>
                        }
                        labelPlacement="end"
                        sx={{ margin: 0, minWidth: '60px' }}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    )}
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleRemoveRow(rowIndex as number)}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataTable;
