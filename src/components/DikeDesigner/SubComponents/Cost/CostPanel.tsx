import React, { useState } from "react";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { Collapse, Box } from "@mui/material";

import Stack from "@vertigis/web/ui/Stack";
import Button from "@vertigis/web/ui/Button";
import Table from "@vertigis/web/ui/Table";
import TableBody from "@vertigis/web/ui/TableBody";
import TableCell from "@vertigis/web/ui/TableCell";
import TableContainer from "@vertigis/web/ui/Box";
import TableHead from "@vertigis/web/ui/TableHead";
import TableRow from "@vertigis/web/ui/TableRow";
import Paper from "@vertigis/web/ui/Paper";
import FormLabel from "@vertigis/web/ui/FormLabel";
import FormControl from "@vertigis/web/ui/FormControl";
import Select from "@vertigis/web/ui/Select";
import MenuItem from "@vertigis/web/ui/MenuItem";
import { stackStyle } from "../../../styles";
import { useWatchAndRerender } from "@vertigis/web/ui";

import type DikeDesignerModel from "../../DikeDesignerModel";
import { handleCostCalculation } from "../../Functions/CostFunctions";
import CostPieChart from "./CostPieChart";
import CostRangeStackedBar from "./CostRangeStackedBar";

interface CostCalculationPanelProps {
  model: DikeDesignerModel;
}

// Collapsible row for sub-items
const SubRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <TableRow>
    <TableCell sx={{ fontSize: "10px", pl: 4 }}>{label}</TableCell>
    <TableCell sx={{ fontSize: "10px" }} align="right">
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
        sx={{ cursor: "pointer", backgroundColor: "#f5f5f5" }}
      >
        <TableCell sx={{ fontSize: 12, fontWeight: "bold" }}>
          <span style={{ marginRight: 6 }}>{open ? "▾" : "▸"}</span>
          {title}
        </TableCell>
        <TableCell align="right" sx={{ fontSize: 12, fontWeight: "bold" }}>
          {total !== undefined ? total.toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : ""}
        </TableCell>
      </TableRow>

      {/* Children rows */}
      {open && children}
    </>
  );
};



const CostCalculationPanel: React.FC<CostCalculationPanelProps> = ({ model }) => {
  // Watch all flat fields (keep it simple)
  useWatchAndRerender(model.costModel, "directCostGroundWork");
  useWatchAndRerender(model.costModel, "bouwKostenGrondWerk");
  useWatchAndRerender(model.costModel, "engineeringKosten");
  useWatchAndRerender(model.costModel, "overigeBijkomendeKosten");
  useWatchAndRerender(model.costModel, "vastgoedKosten");


  // Prepare PieChart data
  const pieData = [
    { category: "Voorbereiding", value: model.costModel.directCostGroundWork.preparationCost },
    { category: "Grondlichaam", value: model.costModel.directCostGroundWork.groundworkCost },
    { category: "Constructie", value: model.costModel.bouwKostenGrondWerk.totalCosts },
    { category: "Engineering", value: model.costModel.engineeringKosten.totalEngineeringCosts },
    { category: "Overige bijkomende kosten", value: model.costModel.overigeBijkomendeKosten.totalGeneralCosts },
    { category: "Vastgoedkosten", value: model.costModel.vastgoedKosten.totalRealEstateCosts },
  ].filter(d => d.value > 0);

  return (
    <Stack spacing={1}>
      {/* Header / Calculate Button */}
      <Stack spacing={2} sx={stackStyle}>
        <FormLabel>Kosten berekening</FormLabel>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AssessmentIcon />}
          onClick={() => handleCostCalculation(model)}
          fullWidth
          disabled={!model.graphicsLayerTemp?.graphics.length || model.loading}
        >
          Bereken kosten
        </Button>
      </Stack>

      {/* Complexity selector */}
      <FormControl fullWidth>
        <FormLabel>Complexiteit maatregel</FormLabel>
        <Select
          value={model.costModel.complexity}
          onChange={(e) => (model.costModel.complexity = e.target.value as string)}
          label="Complexiteit maatregel"
        >
          {model.costModel.complexityTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Hardcoded nested table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: "11px", fontWeight: "bold" }}>Categorie</TableCell>
              <TableCell align="right" sx={{ fontSize: "11px", fontWeight: "bold" }}>Kosten</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Directe kosten grondwerk */}
            <CollapsibleSection
              title="Benoemde Directe BouwKosten"
              total={model.costModel.directCostGroundWork.groundworkCost}
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

            {/* Bouwkosten grondwerk */}
            <CollapsibleSection
              title="BouwKosten Grondwerk"
              total={model.costModel.bouwKostenGrondWerk.totalCosts}
            >
              <SubRow label="PM kosten" value={model.costModel.bouwKostenGrondWerk.pmCost} />
              <SubRow label="Algemene kosten" value={model.costModel.bouwKostenGrondWerk.generalCost} />
              <SubRow label="Risico & winst" value={model.costModel.bouwKostenGrondWerk.riskProfit} />
            </CollapsibleSection>

            {/* Engineeringkosten */}
            <CollapsibleSection
              title="Engineeringkosten"
              total={model.costModel.engineeringKosten.totalEngineeringCosts}
            >
              <SubRow label="EPK kosten" value={model.costModel.engineeringKosten.epkCost} />
              <SubRow label="Schets voor definitief ontwerp" value={model.costModel.engineeringKosten.designCost} />
              <SubRow label="Onderzoeken" value={model.costModel.engineeringKosten.researchCost} />
              <SubRow label="Algemene kosten" value={model.costModel.engineeringKosten.generalCost} />
              <SubRow label="Risico & winst" value={model.costModel.engineeringKosten.riskProfit} />
            </CollapsibleSection>

            {/* Overige bijkomende kosten */}
            <CollapsibleSection
              title="Overige bijkomende kosten"
              total={model.costModel.overigeBijkomendeKosten.totalGeneralCosts}
            >
              <SubRow label="Vergunningen" value={model.costModel.overigeBijkomendeKosten.insurances} />
              <SubRow label="Kabels & leidingen" value={model.costModel.overigeBijkomendeKosten.cablesPipes} />
              <SubRow label="Planschade" value={model.costModel.overigeBijkomendeKosten.damages} />
              <SubRow label="Algemene kosten" value={model.costModel.overigeBijkomendeKosten.generalCost} />
              <SubRow label="Risico & winst" value={model.costModel.overigeBijkomendeKosten.riskProfit} />
            </CollapsibleSection>

            {/* Vastgoedkosten */}
            <CollapsibleSection
              title="Vastgoedkosten"
              total={model.costModel.vastgoedKosten.totalRealEstateCosts}
            >
              <SubRow label="Wegen" value={model.costModel.vastgoedKosten.roadCost} />
              <SubRow label="Panden" value={model.costModel.vastgoedKosten.houseCost} />
            </CollapsibleSection>

          </TableBody>
        </Table>
      </TableContainer>

      {/* Pie Chart and Stacked Bar Chart */}
      <Paper sx={{ padding: 1 }}>
        <CostPieChart data={pieData.map(d => ({ ...d, value: Math.round(d.value) }))} />
      </Paper>
      <Paper sx={{padding: 1 }}>
        <CostRangeStackedBar
          bouwKosten={model.costModel.bouwKostenGrondWerk.totalCosts}
          engineering={model.costModel.engineeringKosten.totalEngineeringCosts}
          overigeBijkomende={model.costModel.overigeBijkomendeKosten.totalGeneralCosts}
          vastgoed={model.costModel.vastgoedKosten.totalRealEstateCosts}
        />
      </Paper>
    </Stack>
  );
};

export default CostCalculationPanel;
