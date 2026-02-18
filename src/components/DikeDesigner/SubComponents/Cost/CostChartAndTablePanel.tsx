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
import { CostItem, SurchargeCostItem } from "./CostModel";

const SECTION_EXPANDER_COL_WIDTH = 48
const SECTION_TOTAL_COL_WIDTH = 170


interface CollapsibleSectionProps {
  title: string
  total?: number
  totalIncludingBTW?: number
  children: React.ReactNode
  level?: number
  showDetailHeader?: boolean
  detailHeaderLabels?: {
    costPost?: string
    quantity?: string
    unitCost?: string
    total?: string
    totalExcl?: string
    totalIncl?: string
  }
  subHeaderName?: string       // optional name for subheader row
  subHeaderTotal?: number      // optional total for subheader row
  subHeader2Name?: string      // optional name for second subheader row
  subHeader2Total?: number     // optional total for second subheader row
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  total,
  totalIncludingBTW,
  children,
  level = 0,
  showDetailHeader = false,
  detailHeaderLabels,
  subHeaderName,
  subHeaderTotal,
  subHeader2Name,  // consider removing if not needed anymore
  subHeader2Total, // consider removing if not needed anymore
}) => {
  const [open, setOpen] = useState(level === 0)
  const paddingLeft = 2 + level * 2
  const totalExcl = Number(total ?? 0)
  const totalIncl = Number(totalIncludingBTW ?? (Number.isFinite(totalExcl) ? totalExcl * 1.21 : 0))

  const formatCurrency = (value: number) =>
    value.toLocaleString("nl-NL", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    })

  return (
    <>
      {/* Header row */}
      <TableRow>
        <TableCell width={SECTION_EXPANDER_COL_WIDTH} sx={{ width: SECTION_EXPANDER_COL_WIDTH }}>
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

        <TableCell align="right" sx={{ fontWeight: 600, width: SECTION_TOTAL_COL_WIDTH }}>
          {total !== undefined ? formatCurrency(totalExcl) : ""}
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 600, width: SECTION_TOTAL_COL_WIDTH }}>
          {total !== undefined
            ? formatCurrency(totalIncl)
            : ""}
        </TableCell>
      </TableRow>

      {/* Collapsible content */}
      <TableRow>
        <TableCell colSpan={4} sx={{ p: 0, borderBottom: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ width: "100%" }}>
              <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
                {/* Detail column headers */}
                {showDetailHeader && (
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: 11, fontWeight: 600, pl: 6 }}>
                        {detailHeaderLabels?.costPost ?? "Kostenpost"}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600 }}>
                        {detailHeaderLabels?.quantity ?? "Hoeveelheid"}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600 }}>
                        {detailHeaderLabels?.unitCost ?? "Eenheidsprijs"}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600 }}>
                        {detailHeaderLabels?.totalExcl ?? detailHeaderLabels?.total ?? "Totaal excl. BTW"}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600 }}>
                        {detailHeaderLabels?.totalIncl ?? "Totaal incl. BTW"}
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
                          {formatCurrency(subHeaderTotal)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600 }}>
                          {formatCurrency(subHeaderTotal * 1.21)}
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
                          {formatCurrency(subHeader2Total)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600 }}>
                          {formatCurrency(subHeader2Total * 1.21)}
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
  totalIncludingBTW?: number
}

const SubHeaderRow: React.FC<SubHeaderRowProps> = ({ label, total, totalIncludingBTW }) => {
  const totalExcl = Number(total ?? 0)
  const totalIncl = Number(totalIncludingBTW ?? (Number.isFinite(totalExcl) ? totalExcl * 1.21 : 0))

  return (
    <TableRow>
      <TableCell
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
      </TableCell>
      <TableCell sx={{ borderBottom: 0 }} />
      <TableCell sx={{ borderBottom: 0 }} />
      <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600, borderBottom: 0 }}>
        {total !== undefined
          ? totalExcl.toLocaleString("nl-NL", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            })
          : ""}
      </TableCell>
      <TableCell align="right" sx={{ fontSize: 11, fontWeight: 600, borderBottom: 0 }}>
        {total !== undefined
          ? totalIncl.toLocaleString("nl-NL", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            })
          : ""}
      </TableCell>
    </TableRow>
  )
}

interface SubRowProps { label: string; item?: CostItem | SurchargeCostItem; value?: number; valueIncludingBTW?: number }

const SubRow: React.FC<SubRowProps> = ({ label, item, value, valueIncludingBTW }) => {
  const totalExcl = item ? Number(item.value ?? 0) : Number(value ?? 0)
  const totalInclFromItem = item && typeof item === "object" && "value_incl_BTW" in (item as any)
    ? Number((item as any).value_incl_BTW)
    : Number.NaN
  const totalIncl = Number.isFinite(totalInclFromItem)
    ? totalInclFromItem
    : Number(valueIncludingBTW ?? (Number.isFinite(totalExcl) ? totalExcl * 1.21 : 0))
  const isSurchargeItem = !!item && typeof item === "object" && "surcharge_percentage" in (item as any)

  const quantity = !isSurchargeItem && item ? Number((item as CostItem).quantity) : NaN
  const unitCost = !isSurchargeItem && item ? Number((item as CostItem).unit_cost) : NaN
  const unit = !isSurchargeItem ? (item as CostItem | undefined)?.unit ?? "" : ""

  const surchargeRaw = isSurchargeItem ? Number((item as any).surcharge_percentage) : NaN
  const surchargeDisplay = Number.isFinite(surchargeRaw) ? (surchargeRaw <= 1 ? surchargeRaw * 100 : surchargeRaw) : NaN
  const baseCost = isSurchargeItem ? Number((item as any).base_cost) : NaN

  return (
    <TableRow>
      {/* Kostenpost */}
      <TableCell sx={{ fontSize: 10, pl: 6 }}>
        {label}
      </TableCell>

      {/* Hoeveelheid */}
      <TableCell align="right" sx={{ fontSize: 10 }}>
        {isSurchargeItem
          ? (Number.isFinite(surchargeDisplay)
              ? `${surchargeDisplay.toLocaleString("nl-NL", { maximumFractionDigits: 2 })} %`
              : "-")
          : (item && Number.isFinite(quantity)
              ? `${Math.round(quantity).toLocaleString("nl-NL", {
                  maximumFractionDigits: 0,
                })}${unit ? ` [${unit}]` : ""}`
              : "-")}
      </TableCell>

      {/* Eenheidsprijs */}
      <TableCell align="right" sx={{ fontSize: 10 }}>
        {isSurchargeItem
          ? (Number.isFinite(baseCost)
              ? baseCost.toLocaleString("nl-NL", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0,
                })
              : "-")
          : (item && Number.isFinite(unitCost)
              ? unitCost.toLocaleString("nl-NL", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 2,
                })
              : "-")}
      </TableCell>

      {/* Totaal excl. BTW */}
      <TableCell align="right" sx={{ fontSize: 10 }}>
        {totalExcl.toLocaleString("nl-NL", {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 0,
        })}
      </TableCell>

      {/* Totaal incl. BTW */}
      <TableCell align="right" sx={{ fontSize: 10 }}>
        {totalIncl.toLocaleString("nl-NL", {
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

  const CostTable: React.FC = () => (
    <TableContainer component={Paper} sx={{
      boxShadow: "none",
      backgroundColor: "#fafafa"
    }}>
      <Table aria-label="collapsible table" sx={{ tableLayout: "fixed", width: "100%" }}>
        <TableHead>
          <TableRow sx={{ borderBottom: '1px solid #e0e0e0' }}>
            <TableCell sx={{
              border: 0,
              width: SECTION_EXPANDER_COL_WIDTH,
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
              backgroundColor: "#fafafa",
              width: SECTION_TOTAL_COL_WIDTH,
            }}>
              Kosten excl. BTW (€)
            </TableCell>
            <TableCell align="right" sx={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#000000",
              border: 0,
              backgroundColor: "#fafafa",
              width: SECTION_TOTAL_COL_WIDTH,
            }}>
              Kosten incl. BTW (€)
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {/* Bouwkosten (BK) */}
          <CollapsibleSection
            title="Bouwkosten (BK)"
            total={model.costModel.constructionCost.totalConstructionCost}
            totalIncludingBTW={model.costModel.constructionCost.totalConstructionCostIncludingBTW}
          >
            {/* Directe Bouwkosten (DBK) */}
            <CollapsibleSection
              title="Directe Bouwkosten (DBK)"
              total={model.costModel.indirectConstructionCosts.totalDirectCosts}
              totalIncludingBTW={model.costModel.indirectConstructionCosts.totalDirectCostsIncludingBTW}
              level={1}
              showDetailHeader

            >
              <SubHeaderRow label="Grondversterking" total={model.costModel.directCostGroundWork.totaleBDBKGrondwerk}/>
              <SubRow label="Opruimen terrein" item={model.costModel.directCostGroundWork.opruimenTerrein}/>
              <SubRow label="Maaien terreinen" item={model.costModel.directCostGroundWork.maaienTerreinen}/>
              <SubRow label="Afgraven grasbekleding" item={model.costModel.directCostGroundWork.afgravenGrasbekleding}/>
              <SubRow label="Afgraven kleilaag" item={model.costModel.directCostGroundWork.afgravenKleilaag}/>
              <SubRow label="Herkeuren kleilaag" item={model.costModel.directCostGroundWork.herkeurenKleilaag} />
              <SubRow label="Aanvullen kern" item={model.costModel.directCostGroundWork.aanvullenKern}/>
              <SubRow label="Profieleren dijkkern" item={model.costModel.directCostGroundWork.profielerenDijkkern}/>
              <SubRow label="Aanbrengen nieuwe kleilaag" item={model.costModel.directCostGroundWork.aanbrengenNieuweKleilaag}/>
              <SubRow label="Profieleren van nieuwe kleilaag" item={model.costModel.directCostGroundWork.profielerenVanNieuweKleilaag}/>
              <SubRow label="Hergebruik teelaarde" item={model.costModel.directCostGroundWork.hergebruikTeelaarde}/>
              <SubRow label="Aanvullen teelaarde" item={model.costModel.directCostGroundWork.aanvullenTeelaarde}/>
              <SubRow label="Profieleren nieuwe graslaag" item={model.costModel.directCostGroundWork.profielerenNieuweGraslaag}/>
              <SubRow label="Inzaaien nieuwe toplaag" item={model.costModel.directCostGroundWork.inzaaienNieuweToplaag}/>

              <SubHeaderRow label="Constructies" total={model.costModel.directCostStructures.totaleBDBKConstructie}/>
              <SubRow label={model.constructionModel.structureType} item={model.costModel.directCostStructures.structureDetails}/>

              <SubHeaderRow label="Infrastructuur" total={model.costModel.directCostInfrastructure.totaleBDBKInfra}/>
              <SubRow label="Verwijderen weg" item={model.costModel.directCostInfrastructure.opbrekenRegionaleWeg}/>
              <SubRow label="Aanleggen weg" item={model.costModel.directCostInfrastructure.leverenEnAanbrengenRegionaleWeg}/>
              <SubRow label="Verwijderen fietspad" item={model.costModel.directCostInfrastructure.verwijderenFietspad}/>
              <SubRow label="Aanleggen fietspad" item={model.costModel.directCostInfrastructure.aanleggenFietspad}/>


            </CollapsibleSection>

            {/* Indirecte Bouwkosten (IBK) */}
            <CollapsibleSection
              title="Indirecte Bouwkosten (IBK)"
              total={model.costModel.indirectConstructionCosts.totalIndirectCosts}
              totalIncludingBTW={model.costModel.indirectConstructionCosts.totalIndirectCostsIncludingBTW}
              level={1}
              showDetailHeader
              detailHeaderLabels={{
                costPost: "Kostenpost",
                quantity: "Opslag (%)",
                unitCost: "Basis",
                totalExcl: "Totaal excl. BTW",
                totalIncl: "Totaal incl. BTW",
              }}
            >
              <SubRow label="Eenmalige algemen bouwplaats, uitvoerings en projectmanagementkosten" item={model.costModel.indirectConstructionCosts.pmCost} />
              <SubRow label="Algemene kosten (AK)" item={model.costModel.indirectConstructionCosts.generalCost} />
              <SubRow label="Winst & risico (WR)" item={model.costModel.indirectConstructionCosts.riskProfit} />
            </CollapsibleSection>
          </CollapsibleSection>

          {/* Engineeringkosten (EK) */}
          <CollapsibleSection
            title="Engineeringkosten (EK)"
            total={model.costModel.engineeringCosts.totalEngineeringCosts}
            totalIncludingBTW={model.costModel.engineeringCosts.totalEngineeringCostsIncludingBTW}
          >
            {/* Directe engineeringkosten */}
            <CollapsibleSection
              title="Directe engineeringkosten"
              total={model.costModel.engineeringCosts.totalDirectEngineeringCost}
              totalIncludingBTW={model.costModel.engineeringCosts.totalDirectEngineeringCostIncludingBTW}
              level={1}
              showDetailHeader
              detailHeaderLabels={{
                costPost: "Kostenpost",
                quantity: "Opslag (%)",
                unitCost: "Basis",
                totalExcl: "Totaal excl. BTW",
                totalIncl: "Totaal incl. BTW",
              }}
            >
              <SubRow label="Engineeringskosten opdrachtgever (EPK)" item={model.costModel.engineeringCosts.epkCost} />
              <SubRow label="Engineeringkosten opdrachtnemer (schets-, voor-, definitief ontwerp)" item={model.costModel.engineeringCosts.designCost} />
              <SubRow label="Onderzoeken (archeologie, explosievent, LNC)" item={model.costModel.engineeringCosts.researchCost} />
            </CollapsibleSection>

            {/* Indirecte engineering kosten */}
            <CollapsibleSection
              title="Indirecte engineering kosten"
              total={model.costModel.engineeringCosts.totalIndirectEngineeringCosts}
              totalIncludingBTW={model.costModel.engineeringCosts.totalIndirectEngineeringCostsIncludingBTW}
              level={1}
              showDetailHeader
              detailHeaderLabels={{
                costPost: "Kostenpost",
                quantity: "Opslag (%)",
                unitCost: "Basis",
                totalExcl: "Totaal excl. BTW",
                totalIncl: "Totaal incl. BTW",
              }}
            >
              <SubRow label="Algemene kosten (AK)" item={model.costModel.engineeringCosts.generalCost} />
              <SubRow label="Risico & winst (WR)" item={model.costModel.engineeringCosts.riskProfit} />

            </CollapsibleSection>
          </CollapsibleSection>

          {/* Overige bijkomende kosten */}
          <CollapsibleSection
            title="Overige bijkomende kosten"
            total={model.costModel.otherCosts.totalGeneralCosts}
            totalIncludingBTW={model.costModel.otherCosts.totalGeneralCostsIncludingBTW}
          >
            {/* Directe overige bijkomende kosten */}
            <CollapsibleSection
              title="Directe overige bijkomende kosten"
              total={model.costModel.otherCosts.totalDirectGeneralCosts}
              totalIncludingBTW={model.costModel.otherCosts.totalDirectGeneralCostsIncludingBTW}
              level={1}
              showDetailHeader
              detailHeaderLabels={{
                costPost: "Kostenpost",
                quantity: "Opslag (%)",
                unitCost: "Basis",
                totalExcl: "Totaal excl. BTW",
                totalIncl: "Totaal incl. BTW",
              }}
            >
              <SubRow label="Vergunningen, heffingen en verzekering" item={model.costModel.otherCosts.insurances} />
              <SubRow label="Kabels & leidingen" item={model.costModel.otherCosts.cablesPipes} />
              <SubRow label="Planschade & inpassingsmaatregelen" item={model.costModel.otherCosts.damages} />
            </CollapsibleSection>

            {/* Indirecte overige bijkomende kosten */}
            <CollapsibleSection
              title="Indirecte overige bijkomende kosten"
              total={model.costModel.otherCosts.totalIndirectGeneralCosts}
              totalIncludingBTW={model.costModel.otherCosts.totalIndirectGeneralCostsIncludingBTW}
              level={1}
              showDetailHeader
              detailHeaderLabels={{
                costPost: "Kostenpost",
                quantity: "Opslag (%)",
                unitCost: "Basis",
                totalExcl: "Totaal excl. BTW",
                totalIncl: "Totaal incl. BTW",
              }}
            >
              <SubRow label="Algemene kosten (AK)" item={model.costModel.otherCosts.generalCost} />
              <SubRow label="Risico & winst (WR)" item={model.costModel.otherCosts.riskProfit} />

            </CollapsibleSection>
          </CollapsibleSection>

          {/* Subtotaal investeringkosten */}
          <CollapsibleSection
            title="Subtotaal investeringkosten"
            total={model.costModel.constructionCost.totalConstructionCost + model.costModel.engineeringCosts.totalEngineeringCosts + model.costModel.otherCosts.totalGeneralCosts}
            totalIncludingBTW={
              (model.costModel.constructionCost.totalConstructionCostIncludingBTW ?? model.costModel.constructionCost.totalConstructionCost * 1.21) +
              (model.costModel.engineeringCosts.totalEngineeringCostsIncludingBTW ?? model.costModel.engineeringCosts.totalEngineeringCosts * 1.21) +
              (model.costModel.otherCosts.totalGeneralCostsIncludingBTW ?? model.costModel.otherCosts.totalGeneralCosts * 1.21)
            }
          >
            <SubRow label="Objectoverstijgende risico's" value={model.costModel.risicoreservering} />
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
              Investeringskosten
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
              {model.costModel.totalExcludingBTW.toLocaleString("nl-NL", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              })}
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
              {model.costModel.totalIncludingBTW.toLocaleString("nl-NL", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              })}
            </TableCell>
          </TableRow>

          <CollapsibleSection
            title="Vastgoedkosten"
            total={model.costModel.realEstateCosts.totalRealEstateCosts}
            totalIncludingBTW={model.costModel.realEstateCosts.totalRealEstateCostsIncludingBTW}
            showDetailHeader
          >
            <SubRow label="Direct benoemd" item={model.costModel.realEstateCosts.directBenoemdItem}  />
            <SubRow label="Direct niet benoemd" item={model.costModel.realEstateCosts.directNietBenoemdItem} />
            <SubRow label="Indirect" item={model.costModel.realEstateCosts.indirectItem}  />
            <SubRow label="Risico" item={model.costModel.realEstateCosts.riskItem} />

          </CollapsibleSection>

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
              Totaal investeringskosten + vastgoedkosten
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
              {(
                model.costModel.totalExcludingBTW +
                model.costModel.realEstateCosts.totalRealEstateCosts
              ).toLocaleString("nl-NL", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              })}
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
              {(
                model.costModel.totalIncludingBTW +
                (model.costModel.realEstateCosts.totalRealEstateCostsIncludingBTW ??
                  model.costModel.realEstateCosts.totalRealEstateCosts * 1.21)
              ).toLocaleString("nl-NL", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              })}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )

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
            <Tab label="Kostenverdeling" sx={{ fontSize: '12px' }} />
            <Tab label="Kostenbereik" sx={{ fontSize: '12px' }} />
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
          
          {/* Tab 0: Overview - Table Only */}
          {currentTab === 0 && (
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
                <CostTable />
              </Box>
            </Box>
          )}

          {/* Tab 1: Kostenverdeling (Pie Chart Only) */}
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
          )}

          {/* Tab 2: Kostenbereik (Stacked Bar Chart Only) */}
          {currentTab === 2 && (
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
                    bouwKosten={
                      model.costModel.constructionCost.totalConstructionCostIncludingBTW ??
                      model.costModel.constructionCost.totalConstructionCost * 1.21
                    }
                    engineering={
                      model.costModel.engineeringCosts.totalEngineeringCostsIncludingBTW ??
                      model.costModel.engineeringCosts.totalEngineeringCosts * 1.21
                    }
                    overigeBijkomende={
                      model.costModel.otherCosts.totalGeneralCostsIncludingBTW ??
                      model.costModel.otherCosts.totalGeneralCosts * 1.21
                    }
                    vastgoed={
                      model.costModel.realEstateCosts.totalRealEstateCostsIncludingBTW ??
                      model.costModel.realEstateCosts.totalRealEstateCosts * 1.21
                    }
                  />
                </Paper>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </>
  );
};

export default CostChartAndTablePanel;
