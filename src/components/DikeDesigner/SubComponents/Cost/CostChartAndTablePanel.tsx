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
// import TableHead from "@vertigis/web/ui/TableHead";
import TableRow from "@vertigis/web/ui/TableRow";
import Collapse from "@vertigis/web/ui/Collapse";
import React, { useState } from "react";
import { TableHead } from "@mui/material"

import CostPieChart from "./CostPieChart";
import CostRangeStackedBar from "./CostRangeStackedBar";
import { CostItem } from "./CostModel";


interface CollapsibleSectionProps {
  title: string
  total?: number
  children: React.ReactNode
  level?: number
  showDetailHeader?: boolean
  subHeaderName?: string       // optional name for subheader row
  subHeaderTotal?: number      // optional total for subheader row
  subHeader2Name?: string      // optional name for second subheader row
  subHeader2Total?: number     // optional total for second subheader row
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  total,
  children,
  level = 0,
  showDetailHeader = false,
  subHeaderName,
  subHeaderTotal,
  subHeader2Name,
  subHeader2Total,
}) => {
  const [open, setOpen] = useState(level === 0)
  const paddingLeft = 2 + level * 2

  return (
    <>
      {/* Header row */}
      <TableRow>
        <TableCell width={48}>
          {children ? (
            <IconButton size="small" onClick={() => setOpen((o) => !o)}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          ) : null}
        </TableCell>

        <TableCell
          sx={{
            fontWeight: level === 0 ? 700 : 600,
            fontSize: level === 0 ? 14 : 13,
            pl: paddingLeft,
            color: "#0f172a",
          }}
        >
          {title}
        </TableCell>

        <TableCell align="right" sx={{ fontWeight: 600 }}>
          {total !== undefined
            ? total.toLocaleString("nl-NL", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              })
            : ""}
        </TableCell>
      </TableRow>

      {/* Collapsible content */}
      <TableRow>
        <TableCell colSpan={3} sx={{ p: 0, borderBottom: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ m: 1 }}>
              <Table size="small">
                {/* Detail column headers */}
                {showDetailHeader && (
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: 11, fontWeight: 600, pl: 6 }}>
                        Kostenpost
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600 }}>
                        Hoeveelheid
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600 }}>
                        Eenheidsprijs
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600 }}>
                        Totaal
                      </TableCell>
                    </TableRow>

                    {/* Optional subheader row */}
                    {subHeaderName && subHeaderTotal !== undefined && (
                      <TableRow>
                        <TableCell
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            pl: 6,
                            color: "#475569",
                          }}
                        >
                          {subHeaderName}
                        </TableCell>
                        <TableCell />
                        <TableCell />
                        <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600 }}>
                          {subHeaderTotal.toLocaleString("nl-NL", {
                            style: "currency",
                            currency: "EUR",
                            maximumFractionDigits: 0,
                          })}
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Optional second subheader row */}
                    {subHeader2Name && subHeader2Total !== undefined && (
                      <TableRow>
                        <TableCell
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            pl: 6,
                            color: "#475569",
                          }}
                        >
                          {subHeader2Name}
                        </TableCell>
                        <TableCell />
                        <TableCell />
                        <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600 }}>
                          {subHeader2Total.toLocaleString("nl-NL", {
                            style: "currency",
                            currency: "EUR",
                            maximumFractionDigits: 0,
                          })}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableHead>
                )}

                <TableBody>{children}</TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

interface SubHeaderRowProps {
  label: string
  total?: number
}

const SubHeaderRow: React.FC<SubHeaderRowProps> = ({ label, total }) => {
  return (
    <TableRow>
      <TableCell
        colSpan={4}
        sx={{
          fontSize: 11,
          fontWeight: 700,
          pl: 6,
          pt: 2,
          pb: 0.5,
          color: "#475569",
          borderBottom: 0,
        }}
      >
        {label}
        {total !== undefined && (
          <span style={{ float: 'right' }}>
            {total.toLocaleString("nl-NL", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            })}
          </span>
        )}
      </TableCell>
    </TableRow>
  )
}

interface SubRowProps { label: string; item?: CostItem; value?: number }

const SubRow: React.FC<SubRowProps> = ({ label, item, value }) => {
  const total = item ? item.value : value ?? 0

  return (
    <TableRow>
      {/* Kostenpost */}
      <TableCell sx={{ fontSize: 10, pl: 6 }}>
        {label}
      </TableCell>

      {/* Hoeveelheid */}
      <TableCell align="right" sx={{ fontSize: 10 }}>
        {item
          ? `${item.quantity.toLocaleString("nl-NL", {
              maximumFractionDigits: 2,
            })} ${item.unit}`
          : "-"}
      </TableCell>

      {/* Eenheidsprijs */}
      <TableCell align="right" sx={{ fontSize: 10 }}>
        {item
          ? item.unit_cost.toLocaleString("nl-NL", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 2,
            })
          : "-"}
      </TableCell>

      {/* Totaal */}
      <TableCell align="right" sx={{ fontSize: 10 }}>
        {total.toLocaleString("nl-NL", {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 0,
        })}
      </TableCell>
    </TableRow>
  )
}


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
                    {/* Bouwkosten (BK) */}
                    <CollapsibleSection
                      title="Bouwkosten (BK)"
                      total={model.costModel.bouwkostenTotal}
                    >
                      {/* Directe Bouwkosten (DBK) */}
                      <CollapsibleSection
                        title="Directe Bouwkosten (DBK)"
                        total={0}
                        level={1}
                      >
                        {/* Benoemde Directe BouwKosten - Grondwerk */}
                        <CollapsibleSection
                          title="Benoemde Directe BouwKosten - Grondwerk"
                          total={model.costModel.directCostGroundWork.totaleBDBKGrondwerk}
                          level={2}
                          showDetailHeader
                          subHeaderName="Grondversterking"
                          subHeaderTotal={model.costModel.directCostGroundWork.totaleBDBKGrondwerk}
                        >
                          <SubRow label="Opruimen terrein" value={model.costModel.directCostGroundWork.opruimenTerrein.value}/>
                          <SubRow label="Maaien terreinen" value={model.costModel.directCostGroundWork.maaienTerreinen.value}/>
                          <SubRow label="Afgraven grasbekleding" value={model.costModel.directCostGroundWork.afgravenGrasbekleding.value}/>
                          <SubRow label="Afgraven kleilaag" value={model.costModel.directCostGroundWork.afgravenKleilaag.value}/>
                          <SubRow label="Herkeuren kleilaag" value={model.costModel.directCostGroundWork.herkeurenKleilaag.value} />
                          <SubRow label="Aanvullen kern" value={model.costModel.directCostGroundWork.aanvullenKern.value}/>
                          <SubRow label="Profieleren dijkkern" value={model.costModel.directCostGroundWork.profielerenDijkkern.value}/>
                          <SubRow label="Aanbrengen nieuwe kleilaag" value={model.costModel.directCostGroundWork.aanbrengenNieuweKleilaag.value}/>
                          <SubRow label="Profieleren van nieuwe kleilaag" value={model.costModel.directCostGroundWork.profielerenVanNieuweKleilaag.value}/>
                          <SubRow label="Hergebruik teelaarde" value={model.costModel.directCostGroundWork.hergebruikTeelaarde.value}/>
                          <SubRow label="Aanvullen teelaarde" value={model.costModel.directCostGroundWork.aanvullenTeelaarde.value}/>
                          <SubRow label="Profieleren nieuwe graslaag" value={model.costModel.directCostGroundWork.profielerenNieuweGraslaag.value}/>
                          
                          <SubHeaderRow label="Constructies" total={0}/>
                          <SubRow label="Verankerde damwand 10 m" value={0}/>

                          <SubHeaderRow label="Infrastructuur" total={0}/>
                          <SubRow label="Opbreken regionale weg" value={model.costModel.directCostInfrastructure.opbrekenRegionaleWeg.value}/>
                          <SubRow label="Leveren en aanbrengen regionale weg" value={model.costModel.directCostInfrastructure.leverenEnAanbrengenRegionaleWeg.value}/>

                          {/* <SubHeaderRow label="Nader te detailleren bouwkosten" total={model.costModel.directConstructionCost.NTDBK} /> */}
                          
                          
                        </CollapsibleSection>
                      </CollapsibleSection>
                      
                      {/* Indirecte Bouwkosten (IBK) */}
                      <CollapsibleSection
                        title="Indirecte Bouwkosten (IBK)"
                        total={0}
                        level={1}
                      >
                        <SubRow label="Eenmalige algemen bouwplaats, uitvoerings en projectmanagementkosten" value={0} />
                        <SubRow label="Algemene kosten (AK)" value={0} />
                        <SubRow label="Winst & risico (WR)" value={0} />
                      </CollapsibleSection>
                    </CollapsibleSection>
                    
                    {/* Engineeringkosten (EK) */}
                    <CollapsibleSection
                      title="Engineeringkosten (EK)"
                      total={0}
                    >
                      {/* Directe engineeringkosten */}
                      <CollapsibleSection
                        title="Directe engineeringkosten"
                        total={0}
                        level={1}
                      >
                        <SubRow label="Engineeringskosten opdrachtgever (EPK)" value={0} />
                        <SubRow label="Engineeringkosten opdrachtnemer (schets-, voor-, definitief ontwerp)" value={0} />
                        <SubRow label="Onderzoeken (archeologie, explosievent, LNC)" value={0} />
                      </CollapsibleSection>
                      
                      {/* Indirecte engineering kosten */}
                      <CollapsibleSection
                        title="Indirecte engineering kosten"
                        total={0}
                        level={1}
                      >
                        <SubRow label="Algemene kosten (AK)" value={0} />
                        <SubRow label="Risico & winst (WR)" value={0} />

                      </CollapsibleSection>
                    </CollapsibleSection>
                    
                    {/* Overige bijkomende kosten */}
                    <CollapsibleSection
                      title="Overige bijkomende kosten"
                      total={0}
                    >
                      {/* Directe overige bijkomende kosten */}
                      <CollapsibleSection
                        title="Directe overige bijkomende kosten"
                        total={0}
                        level={1}
                      >
                        <SubRow label="Vergunningen, heffingen en verzekering" value={0} />
                        <SubRow label="Kabels & leidingen" value={0} />
                        <SubRow label="Planschade & inpassingsmaatregelen" value={0} />
                      </CollapsibleSection>
                      
                      {/* Indirecte overige bijkomende kosten */}
                      <CollapsibleSection
                        title="Indirecte overige bijkomende kosten"
                        total={0}
                        level={1}
                      >
                        <SubRow label="Algemene kosten (AK)" value={0} />
                        <SubRow label="Risico & winst (WR)" value={0} />

                      </CollapsibleSection>
                    </CollapsibleSection>
                    
                    {/* Subtotaal investeringkosten */}
                    <CollapsibleSection
                      title="Subtotaal investeringkosten"
                      total={0}
                    >
                      <SubRow label="Objectoverstijgende risico's" value={0} />
                    </CollapsibleSection>
                    
                    {/* Bottom summary rows */}
                    <TableRow>
                      <TableCell width={48} />
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          fontSize: 14,
                          pl: 2,
                          color: "#0f172a",
                          borderTop: "2px solid #e0e0e0",
                          pt: 2,
                        }}
                      >
                        Investeringskosten excl. BTW
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          fontSize: 14,
                          borderTop: "2px solid #e0e0e0",
                          pt: 2,
                        }}
                      >
                        {(0).toLocaleString("nl-NL", {
                          style: "currency",
                          currency: "EUR",
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell width={48} />
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          fontSize: 14,
                          pl: 2,
                          color: "#0f172a",
                        }}
                      >
                        Investeringkosten incl. BTW
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {(0).toLocaleString("nl-NL", {
                          style: "currency",
                          currency: "EUR",
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                    </TableRow>
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
