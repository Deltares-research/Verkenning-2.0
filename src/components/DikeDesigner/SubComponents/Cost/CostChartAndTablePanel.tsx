/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/order */
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";

import Box from "@vertigis/web/ui/Box";
import Button from "@vertigis/web/ui/Button";
import IconButton from "@vertigis/web/ui/IconButton";
import Paper from "@vertigis/web/ui/Paper";
import Tab from "@vertigis/web/ui/Tab";
import Tabs from "@vertigis/web/ui/Tabs";
import Typography from "@vertigis/web/ui/Typography";
import LinearProgress from "@vertigis/web/ui/LinearProgress";
import Table from "@vertigis/web/ui/Table";
import TableBody from "@vertigis/web/ui/TableBody";
import TableCell from "@vertigis/web/ui/TableCell";
import TableContainer from "@vertigis/web/ui/Box";
import TableHead from "@vertigis/web/ui/TableHead";
import TableRow from "@vertigis/web/ui/TableRow";
import React, { useState } from "react";

import CostPieChart from "./CostPieChart";
import CostRangeStackedBar from "./CostRangeStackedBar";

// Collapsible row for sub-items
const SubRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <TableRow sx={{ "&:last-child td": { borderBottom: "none" } }}>
    <TableCell sx={{ fontSize: "10px", pl: 4, color: "#475569" }}>{label}</TableCell>
    <TableCell sx={{ fontSize: "10px", color: "#0f172a" }} align="right">
      {value.toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
    </TableCell>
  </TableRow>
);

interface CollapsibleSectionProps {
  title: string;
  total?: number;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, total, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Header row */}
      <TableRow
        hover
        onClick={() => setOpen(!open)}
        sx={{
          cursor: "pointer",
          background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
          borderBottom: "1px solid #e2e8f0"
        }}
      >
        <TableCell sx={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
          <span style={{ marginRight: 6 }}>{open ? "▾" : "▸"}</span>
          {title}
        </TableCell>
        <TableCell align="right" sx={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
          {total !== undefined ? total.toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : ""}
        </TableCell>
      </TableRow>

      {/* Children rows */}
      {open && children}
    </>
  );
};

interface CostChartAndTablePanelProps {
  setPanelVisible: (visible: boolean) => void;
  mapLeftBorder: number;
  mapRightBorder: number;
  model: any;
}

const CostChartAndTablePanel: React.FC<CostChartAndTablePanelProps> = ({
  setPanelVisible,
  mapLeftBorder,
  mapRightBorder,
  model,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleToggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // Prepare PieChart data
  const pieData = [
    { category: "Voorbereiding", value: model.costModel.directCostGroundWork.preparationCost },
    { category: "Grondlichaam", value: model.costModel.directCostGroundWork.groundworkCost },
    { category: "Constructie", value: model.costModel.indirectConstructionCosts.totalCosts },
    { category: "Engineering", value: model.costModel.engineeringCosts.totalEngineeringCosts },
    { category: "Overige bijkomende kosten", value: model.costModel.otherCosts.totalGeneralCosts },
    { category: "Vastgoedkosten", value: model.costModel.realEstateCosts.totalRealEstateCosts },
  ].filter(d => d.value > 0);

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
          zIndex: 15,
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
          Kosten overzicht

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
              onClick={() => setPanelVisible(false)}
              size="medium"
              sx={{ color: "#ffffff" }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Typography>

        {/* Split Content Area - Left: Table, Right: Charts */}
        <Box sx={{ 
          flexGrow: 1, 
          display: "flex", 
          overflow: "hidden",
          gap: 2,
          p: 2,
          position: "relative"
        }}>
          {model.loading && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(255, 255, 255, 0.75)",
                zIndex: 5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                px: 2,
                textAlign: "center",
              }}
            >
              <Box sx={{ width: "70%", maxWidth: 420 }}>
                <LinearProgress />
              </Box>
              <Typography sx={{ fontSize: "13px", color: "#1976d2", fontWeight: 600 }}>
                Kosten worden berekend...
              </Typography>
              <Typography sx={{ fontSize: "11px", color: "#555" }}>
                Even geduld, dit kan een paar seconden duren.
              </Typography>
            </Box>
          )}
          {/* Left Panel - Table */}
          <Box sx={{ 
            flex: "1 1 50%", 
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            p: 2
          }}>
            {/* Section Header */}
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2, 
                fontWeight: 600, 
                color: "#1976d2",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: 1
              }}
            >
              📊 Kostenoverzicht
            </Typography>
            
            <Box sx={{ flexGrow: 1, overflow: "auto" }}>
              <TableContainer component={Paper} sx={{ 
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderRadius: "6px",
                overflow: "hidden"
              }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ 
                        fontSize: "11px", 
                        fontWeight: 700,
                        letterSpacing: 0.3,
                        textTransform: "uppercase",
                        color: "#0f172a",
                        background: "linear-gradient(180deg, #f5f7fb 0%, #eef2f7 100%)",
                        borderBottom: "1px solid #e2e8f0"
                      }}>
                        Categorie
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        fontSize: "11px", 
                        fontWeight: 700,
                        letterSpacing: 0.3,
                        textTransform: "uppercase",
                        color: "#0f172a",
                        background: "linear-gradient(180deg, #f5f7fb 0%, #eef2f7 100%)",
                        borderBottom: "1px solid #e2e8f0"
                      }}>
                        Kosten (€)
                      </TableCell>
                    </TableRow>
                  </TableHead>
                <TableBody>
                  {/* Directe kosten grondwerk */}
                  <CollapsibleSection
                    title="Benoemde Directe BouwKosten - Grondwerk"
                    total={model.costModel.directCostGroundWork.totaleBDBKGrondwerk}
                  >
                    <SubRow label="Voorbereiding" value={model.costModel.directCostGroundWork.preparationCost} />
                    <SubRow label="Afgraven grasbekleding" value={model.costModel.directCostGroundWork.afgravenGrasbekledingCost} />
                    <SubRow label="Afgraven kleilaag" value={model.costModel.directCostGroundWork.afgravenKleilaagCost} />
                    <SubRow label="Herkeuren kleilaag" value={model.costModel.directCostGroundWork.herkeurenKleilaagCost} />
                    <SubRow label="Aanvullen kern" value={model.costModel.directCostGroundWork.aanvullenKernCost} />
                    <SubRow label="Profieleren dijkkern" value={model.costModel.directCostGroundWork.profielerenDijkkernCost} />
                    <SubRow label="Aanbrengen nieuwe kleilaag" value={model.costModel.directCostGroundWork.aanbrengenNieuweKleilaagCost} />
                    <SubRow label="Profieleren van nieuwe kleilaag" value={model.costModel.directCostGroundWork.profielerenVanNieuweKleilaagCost} />
                    <SubRow label="Hergebruik teelaarde" value={model.costModel.directCostGroundWork.hergebruikTeelaardeCost} />
                    <SubRow label="Aanvullen teelaarde" value={model.costModel.directCostGroundWork.aanvullenTeelaardeCost} />
                    <SubRow label="Profieleren nieuwe graslaag" value={model.costModel.directCostGroundWork.profielerenNieuweGraslaagCost} />
                  </CollapsibleSection>

                  {/* Directe kosten constructies */}
                  <CollapsibleSection
                    title="Benoemde Directe BouwKosten - constructies"
                    total={model.costModel.directCostStructures.totaleBDBKconstructie}
                  >
                      <SubRow label="BDBK" value={model.costModel.directCostStructures.totaleBDBKconstructie} />

                  </CollapsibleSection>

                  {/* Bouwkosten grondwerk */}
                  <CollapsibleSection
                    title="Indirecte BouwKosten"
                    total={model.costModel.indirectConstructionCosts.indirectCosts}
                  >
                    <SubRow label="PM kosten" value={model.costModel.indirectConstructionCosts.pmCost} />
                    <SubRow label="Algemene kosten" value={model.costModel.indirectConstructionCosts.generalCost} />
                    <SubRow label="Risico & winst" value={model.costModel.indirectConstructionCosts.riskProfit} />
                  </CollapsibleSection>

                  {/* Engineeringkosten */}
                  <CollapsibleSection
                    title="Engineeringkosten"
                    total={model.costModel.engineeringCosts.totalEngineeringCosts}
                  >
                    <SubRow label="EPK kosten" value={model.costModel.engineeringCosts.epkCost} />
                    <SubRow label="Schets voor definitief ontwerp" value={model.costModel.engineeringCosts.designCost} />
                    <SubRow label="Onderzoeken" value={model.costModel.engineeringCosts.researchCost} />
                    <SubRow label="Algemene kosten" value={model.costModel.engineeringCosts.generalCost} />
                    <SubRow label="Risico & winst" value={model.costModel.engineeringCosts.riskProfit} />
                  </CollapsibleSection>

                  {/* Overige bijkomende kosten */}
                  <CollapsibleSection
                    title="Overige bijkomende kosten"
                    total={model.costModel.otherCosts.totalGeneralCosts}
                  >
                    <SubRow label="Vergunningen" value={model.costModel.otherCosts.insurances} />
                    <SubRow label="Kabels & leidingen" value={model.costModel.otherCosts.cablesPipes} />
                    <SubRow label="Planschade" value={model.costModel.otherCosts.damages} />
                    <SubRow label="Algemene kosten" value={model.costModel.otherCosts.generalCost} />
                    <SubRow label="Risico & winst" value={model.costModel.otherCosts.riskProfit} />
                  </CollapsibleSection>

                  {/* Vastgoedkosten */}
                  <CollapsibleSection
                    title="Vastgoedkosten"
                    total={model.costModel.realEstateCosts.totalRealEstateCosts}
                  >
                    <SubRow label="Wegen" value={model.costModel.realEstateCosts.roadCost} />
                    <SubRow label="Panden" value={model.costModel.realEstateCosts.houseCost} />
                  </CollapsibleSection>
                </TableBody>
              </Table>
            </TableContainer>
            </Box>
          </Box>

          {/* Right Panel - Charts */}
          <Box sx={{ 
            flex: "1 1 50%", 
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
            gap: 2
          }}>
            {/* Top Chart Section */}
            <Box sx={{
              flex: "1 1 50%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              p: 2
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  fontWeight: 600, 
                  color: "#1976d2",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}
              >
                📈 Kostenverdeling
              </Typography>
              <Box sx={{ flexGrow: 1, minHeight: 260, height: "100%", display: "flex" }}>
                <Paper sx={{ 
                  padding: 2,
                  height: "100%",
                  width: "100%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "auto"
                }}>
                  <CostPieChart data={pieData.map(d => ({ ...d, value: Math.round(d.value) }))} />
                </Paper>
              </Box>
            </Box>

            {/* Bottom Chart Section */}
            <Box sx={{
              flex: "1 1 50%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              p: 2
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  fontWeight: 600, 
                  color: "#1976d2",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}
              >
                📊 Kostenbereik per categorie
              </Typography>
              <Box sx={{ flexGrow: 1, minHeight: 260, display: "flex" }}>
                <Paper sx={{ 
                  padding: 2,
                  height: "100%",
                  width: "100%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "auto"
                }}>
                  <CostRangeStackedBar
                    bouwKosten={model.costModel.indirectConstructionCosts.totalCosts}
                    engineering={model.costModel.engineeringCosts.totalEngineeringCosts}
                    overigeBijkomende={model.costModel.otherCosts.totalGeneralCosts}
                    vastgoed={model.costModel.realEstateCosts.totalRealEstateCosts}
                  />
                </Paper>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </>
  );
};

export default CostChartAndTablePanel;
