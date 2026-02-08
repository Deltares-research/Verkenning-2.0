/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/order */
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

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
import Collapse from "@vertigis/web/ui/Collapse";
import React, { useState } from "react";

import CostPieChart from "./CostPieChart";
import CostRangeStackedBar from "./CostRangeStackedBar";

// Collapsible row for sub-items
const SubRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <TableRow sx={{ borderBottom: '1px solid #f1f5f9' }}>
    <TableCell sx={{ fontSize: "12px", color: "#64748b", paddingTop: 1, paddingBottom: 1, border: 0 }}>{label}</TableCell>
    <TableCell sx={{ fontSize: "12px", color: "#0f172a", border: 0 }} align="right">
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
    <React.Fragment>
      {/* Header row */}
      <TableRow sx={{ borderBottom: '1px solid #e2e8f0' }}>
        <TableCell sx={{ width: 50, border: 0 }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontSize: 13, fontWeight: 600, color: "#0f172a", paddingTop: 1.5, paddingBottom: 1.5, border: 0 }}>
          {title}
        </TableCell>
        <TableCell align="right" sx={{ fontSize: 13, fontWeight: 600, color: "#0f172a", paddingTop: 1.5, paddingBottom: 1.5, border: 0 }}>
          {total !== undefined ? total.toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : ""}
        </TableCell>
      </TableRow>

      {/* Children rows in collapsible section */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0, borderBottom: 0 }} colSpan={3}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Table size="small" aria-label="details">
                <TableBody>
                  {children}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
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
  const [currentTab, setCurrentTab] = useState(0);

  const handleToggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Get pie chart data from model
  const pieData = model.costModel.getPieChartData();

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

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: '#ffffff' }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="cost view tabs">
            <Tab label="Overzicht" sx={{ fontSize: '12px' }} />
            <Tab label="Tabel" sx={{ fontSize: '12px' }} />
            <Tab label="Grafieken" sx={{ fontSize: '12px' }} />
          </Tabs>
        </Box>

        {/* Tab Content Area */}
        <Box sx={{ 
          flexGrow: 1, 
          display: "flex", 
          flexDirection: "column",
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
                Berekening actief...
              </Typography>
              <Typography sx={{ fontSize: "11px", color: "#555" }}>
                Even geduld, dit kan een paar seconden duren.
              </Typography>
            </Box>
          )}
          
          {/* Tab 0: Overview - Table (2/3) + Charts (1/3) */}
          {currentTab === 0 && (
            <>
              {/* Table Panel - Takes 2/3 */}
              <Box sx={{ 
                flex: "2 1 66%", 
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
                boxShadow: "none",
                backgroundColor: "#fafafa"
              }}>
                <Table aria-label="collapsible table">
                  <TableHead>
                    <TableRow sx={{ borderBottom: '1px solid #e0e0e0' }}>
                      <TableCell sx={{ 
                        border: 0,
                        width: 50,
                        backgroundColor: "#fafafa"
                      }} />
                      <TableCell sx={{ 
                        fontSize: "14px", 
                        fontWeight: 500,
                        color: "#000000",
                        border: 0,
                        backgroundColor: "#fafafa"
                      }}>
                        Categorie
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        fontSize: "14px", 
                        fontWeight: 500,
                        color: "#000000",
                        border: 0,
                        backgroundColor: "#fafafa"
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

          {/* Charts Panel - Takes 1/3 */}
          <Box sx={{ 
            flex: "1 1 33%", 
            display: "flex",
            flexDirection: "row",
            overflow: "hidden",
            minWidth: 0,
            gap: 2
          }}>
            {/* Pie Chart Section - Takes 70% */}
            <Box sx={{
              flex: "1 1 70%",
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
              <Box sx={{ flexGrow: 1, minHeight: 200, height: "100%", display: "flex" }}>
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
                  <CostPieChart data={pieData} />
                </Paper>
              </Box>
            </Box>

            {/* Stacked Bar Chart Section - Takes 30% */}
            <Box sx={{
              flex: "1 1 30%",
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
              <Box sx={{ flexGrow: 1, minHeight: 200, display: "flex" }}>
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
        </>
          )}

          {/* Tab 1: Table Only */}
          {currentTab === 1 && (
            <Box sx={{ 
              flex: "1", 
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minWidth: 0,
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
                📊 Kostenoverzicht
              </Typography>
              
              <Box sx={{ flexGrow: 1, overflow: "auto" }}>
                <TableContainer component={Paper} sx={{ 
                  boxShadow: "none",
                  backgroundColor: "#fafafa"
                }}>
                  <Table aria-label="collapsible table">
                    <TableHead>
                      <TableRow sx={{ borderBottom: '1px solid #e0e0e0' }}>
                        <TableCell sx={{ 
                          border: 0,
                          width: 50,
                          backgroundColor: "#fafafa"
                        }} />
                        <TableCell sx={{ 
                          fontSize: "14px", 
                          fontWeight: 500,
                          color: "#000000",
                          border: 0,
                          backgroundColor: "#fafafa"
                        }}>
                          Categorie
                        </TableCell>
                        <TableCell align="right" sx={{ 
                          fontSize: "14px", 
                          fontWeight: 500,
                          color: "#000000",
                          border: 0,
                          backgroundColor: "#fafafa"
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
          )}

          {/* Tab 2: Charts Only */}
          {currentTab === 2 && (
            <Box sx={{ 
              flex: "1", 
              display: "flex",
              flexDirection: "row",
              overflow: "hidden",
              minWidth: 0,
              gap: 2
            }}>
              {/* Pie Chart Section - Takes 70% */}
              <Box sx={{
                flex: "1 1 70%",
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
                <Box sx={{ flexGrow: 1, minHeight: 200, height: "100%", display: "flex" }}>
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
                    <CostPieChart data={pieData} />
                  </Paper>
                </Box>
              </Box>

              {/* Stacked Bar Chart Section - Takes 30% */}
              <Box sx={{
                flex: "1 1 30%",
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
                <Box sx={{ flexGrow: 1, minHeight: 200, display: "flex" }}>
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
          )}
        </Box>
      </Paper>
    </>
  );
};

export default CostChartAndTablePanel;
