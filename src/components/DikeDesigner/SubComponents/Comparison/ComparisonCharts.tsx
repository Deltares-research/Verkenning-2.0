import React, { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import Box from "@vertigis/web/ui/Box";
import Typography from "@vertigis/web/ui/Typography";
import type { DesignSnapshot } from "./snapshotUtils";

interface ComparisonChartsProps {
    snapshots: DesignSnapshot[];
}

const sumValues = (obj: any): number =>
    Object.values(obj || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number;

const num = (v: any): number => Math.round(Number(v) || 0);
const count = (v: any[] | null | undefined): number => (v != null ? v.length : 0);

interface ChartConfig {
    title: string;
    unit: string;
    stacked: boolean;
    series: { name: string; field: string; color: number }[];
    getData: (snapshots: DesignSnapshot[]) => any[];
}

const chartConfigs: ChartConfig[] = [
    // Row 1: Costs & Volumes
    {
        title: "Kostenverdeling per alternatief",
        unit: "€",
        stacked: true,
        series: [
            { name: "Grondwerk", field: "grondwerk", color: 0x4caf50 },
            { name: "Constructies", field: "constructies", color: 0x2196f3 },
            { name: "Indirecte bouwkosten", field: "indirect", color: 0xff9800 },
            { name: "Engineering", field: "engineering", color: 0xf44336 },
            { name: "Overige kosten", field: "overig", color: 0x9c27b0 },
            { name: "Vastgoed", field: "vastgoed", color: 0x795548 },
        ],
        getData: (snapshots) =>
            snapshots.map((s) => ({
                category: s.name,
                grondwerk: Math.round(sumValues(s.projectJSON.costs.directCostGroundWork)),
                constructies: Math.round(sumValues(s.projectJSON.costs.directCostStructures)),
                indirect: Math.round(sumValues(s.projectJSON.costs.indirectConstructionCosts)),
                engineering: Math.round(sumValues(s.projectJSON.costs.engineeringCosts)),
                overig: Math.round(sumValues(s.projectJSON.costs.otherCosts)),
                vastgoed: Math.round(sumValues(s.projectJSON.costs.realEstateCosts)),
            })),
    },
    {
        title: "Volumes (m³)",
        unit: "m³",
        stacked: false,
        series: [
            { name: "Volumeverschil", field: "volumeDiff", color: 0x1565c0 },
            { name: "Uitgravingsvolume", field: "excavation", color: 0xe65100 },
            { name: "Opvulvolume", field: "fill", color: 0x2e7d32 },
        ],
        getData: (snapshots) =>
            snapshots.map((s) => ({
                category: s.name,
                volumeDiff: num(s.projectJSON.designValues.volumeDifference),
                excavation: num(s.projectJSON.designValues.excavationVolume),
                fill: num(s.projectJSON.designValues.fillVolume),
            })),
    },
    // Row 2: Wonen & Natuur
    {
        title: "1. Wonen en leefomgeving",
        unit: "",
        stacked: false,
        series: [
            { name: "BAG panden [aantal]", field: "panden", color: 0x1565c0 },
            { name: "Invloedzone panden [aantal]", field: "pandenBuffer", color: 0x42a5f5 },
            { name: "Percelen [aantal]", field: "percelen", color: 0xff9800 },
            { name: "Erven [aantal]", field: "erven", color: 0x8d6e63 },
        ],
        getData: (snapshots) =>
            snapshots.map((s) => ({
                category: s.name,
                panden: count(s.projectJSON.effects.intersectingPanden),
                pandenBuffer: count(s.projectJSON.effects.intersectingPandenBuffer),
                percelen: count(s.projectJSON.effects.intersectingPercelen),
                erven: count(s.projectJSON.effects.intersectingErven),
            })),
    },
    {
        title: "1. Wonen en leefomgeving (m²)",
        unit: "m²",
        stacked: false,
        series: [
            { name: "BAG panden", field: "pandenArea", color: 0x1565c0 },
            { name: "Invloedzone panden", field: "pandenBufferArea", color: 0x42a5f5 },
            { name: "Percelen", field: "percelenArea", color: 0xff9800 },
            { name: "Erven", field: "ervenArea", color: 0x8d6e63 },
        ],
        getData: (snapshots) =>
            snapshots.map((s) => ({
                category: s.name,
                pandenArea: num(s.projectJSON.effects.intersectingPandenArea),
                pandenBufferArea: num(s.projectJSON.effects.intersectingPandenBufferArea),
                percelenArea: num(s.projectJSON.effects.intersectingPercelenArea),
                ervenArea: num(s.projectJSON.effects.intersectingErvenArea),
            })),
    },
    // Row 3: Natuur & Verkeer
    {
        title: "2. Natuur (m²)",
        unit: "m²",
        stacked: false,
        series: [
            { name: "Natura 2000", field: "natura2000", color: 0x2e7d32 },
            { name: "GNN", field: "gnn", color: 0x66bb6a },
            { name: "NBP beheertype", field: "beheertype", color: 0xa5d6a7 },
        ],
        getData: (snapshots) =>
            snapshots.map((s) => ({
                category: s.name,
                natura2000: num(s.projectJSON.effects.intersectingNatura2000),
                gnn: num(s.projectJSON.effects.intersectingGNN),
                beheertype: num(s.projectJSON.effects.intersectingBeheertypeArea),
            })),
    },
    {
        title: "3. Verkeer",
        unit: "m²",
        stacked: false,
        series: [
            { name: "BGT wegdelen [m²]", field: "wegdelen", color: 0x546e7a },
            { name: "BGT afritten [m²]", field: "afritten", color: 0x90a4ae },
        ],
        getData: (snapshots) =>
            snapshots.map((s) => ({
                category: s.name,
                wegdelen: num(s.projectJSON.effects.intersectingWegdelen2dRuimtebeslag),
                afritten: num(s.projectJSON.effects.intersectingInritten2dRuimtebeslag),
            })),
    },
    // Row 4: Uitvoering
    {
        title: "4. Uitvoering - Aantallen",
        unit: "",
        stacked: false,
        series: [
            { name: "Panden [aantal]", field: "panden", color: 0x1565c0 },
            { name: "Percelen [aantal]", field: "percelen", color: 0xff9800 },
        ],
        getData: (snapshots) =>
            snapshots.map((s) => ({
                category: s.name,
                panden: count(s.projectJSON.effects.uitvoeringszonePanden),
                percelen: count(s.projectJSON.effects.uitvoeringszonePercelen),
            })),
    },
    {
        title: "4. Uitvoering - Oppervlaktes (m²)",
        unit: "m²",
        stacked: false,
        series: [
            { name: "Wegoppervlak", field: "weg", color: 0x546e7a },
            { name: "Panden", field: "pandenArea", color: 0x1565c0 },
            { name: "Percelen", field: "percelenArea", color: 0xff9800 },
            { name: "Natura 2000", field: "natura", color: 0x2e7d32 },
            { name: "GNN", field: "gnn", color: 0x66bb6a },
            { name: "NBP beheertype", field: "beheertype", color: 0xa5d6a7 },
        ],
        getData: (snapshots) =>
            snapshots.map((s) => ({
                category: s.name,
                weg: num(s.projectJSON.effects.uitvoeringszoneWegoppervlak),
                pandenArea: num(s.projectJSON.effects.uitvoeringszonePandenArea),
                percelenArea: num(s.projectJSON.effects.uitvoeringszonePercelenArea),
                natura: num(s.projectJSON.effects.uitvoeringszoneNatura2000),
                gnn: num(s.projectJSON.effects.uitvoeringszoneGNN),
                beheertype: num(s.projectJSON.effects.uitvoeringszoneBeheertypeArea),
            })),
    },
];

const SingleChart: React.FC<{ config: ChartConfig; snapshots: DesignSnapshot[] }> = ({ config, snapshots }) => {
    const chartRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!chartRef.current) return;

        const root = am5.Root.new(chartRef.current);
        root.setThemes([am5themes_Animated.new(root)]);

        try { root._logo.dispose(); } catch { /* noop */ }

        const chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                layout: root.verticalLayout,
                paddingTop: 5,
                paddingBottom: 0,
                paddingLeft: 0,
                paddingRight: 5,
            })
        );

        const xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 30 });
        xRenderer.labels.template.setAll({
            fontSize: 10,
            maxWidth: 90,
            oversizedBehavior: "truncate",
        });

        const xAxis = chart.xAxes.push(
            am5xy.CategoryAxis.new(root, {
                categoryField: "category",
                renderer: xRenderer,
            })
        );

        const yRenderer = am5xy.AxisRendererY.new(root, {});
        yRenderer.labels.template.setAll({ fontSize: 10 });

        const yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
                min: 0,
                renderer: yRenderer,
                numberFormat: "#a",
            })
        );

        const data = config.getData(snapshots);
        xAxis.data.setAll(data);

        for (const s of config.series) {
            const tooltipUnit = config.unit ? ` ${config.unit}` : "";
            const series = chart.series.push(
                am5xy.ColumnSeries.new(root, {
                    name: s.name,
                    xAxis,
                    yAxis,
                    valueYField: s.field,
                    categoryXField: "category",
                    stacked: config.stacked,
                    tooltip: am5.Tooltip.new(root, {
                        labelText: `{name}: {valueY.formatNumber('#,###')}${tooltipUnit}`,
                    }),
                })
            );

            const color = am5.color(s.color);
            series.columns.template.setAll({
                fill: color,
                stroke: color,
                cornerRadiusTL: 2,
                cornerRadiusTR: 2,
                width: am5.percent(config.stacked ? 60 : 80),
            });

            series.data.setAll(data);
        }

        const legend = chart.children.push(
            am5.Legend.new(root, {
                centerX: am5.percent(50),
                x: am5.percent(50),
                layout: root.gridLayout,
                maxWidth: 400,
            })
        );
        legend.labels.template.setAll({ fontSize: 9, maxWidth: 110, oversizedBehavior: "truncate" });
        legend.markers.template.setAll({ width: 8, height: 8 });
        legend.data.setAll(chart.series.values);

        chart.appear(400, 50);

        return () => root.dispose();
    }, [config, snapshots]);

    return (
        <Box sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#fafafa",
            borderRadius: "6px",
            border: "1px solid #e0e0e0",
            p: 1,
        }}>
            <Typography
                variant="subtitle2"
                sx={{ fontSize: "11px", fontWeight: 600, color: "#1565C0", textAlign: "center", mb: 0.5 }}
            >
                {config.title}
            </Typography>
            <div ref={chartRef} style={{ width: "100%", flex: 1, minHeight: "200px" }} />
        </Box>
    );
};

const ComparisonCharts: React.FC<ComparisonChartsProps> = ({ snapshots }) => {
    if (snapshots.length < 2) return null;

    // Group charts into rows of 2
    const rows: ChartConfig[][] = [];
    for (let i = 0; i < chartConfigs.length; i += 2) {
        rows.push(chartConfigs.slice(i, i + 2));
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 1 }}>
            {rows.map((row, rowIdx) => (
                <Box key={rowIdx} sx={{ display: "flex", gap: 2, minHeight: "280px" }}>
                    {row.map((config) => (
                        <SingleChart key={config.title} config={config} snapshots={snapshots} />
                    ))}
                </Box>
            ))}
        </Box>
    );
};

export default ComparisonCharts;
