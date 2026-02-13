import React, { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

interface CostRangeStackedBarProps {
    bouwKosten: number;
    engineering: number;
    overigeBijkomende: number;
    vastgoed: number;
}

const CostRangeStackedBar: React.FC<CostRangeStackedBarProps> = ({
    bouwKosten,
    engineering,
    overigeBijkomende,
    vastgoed,
}) => {
    const chartRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!chartRef.current) return;

        const root = am5.Root.new(chartRef.current);
        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                layout: root.verticalLayout,
            })
        );

        try { root._logo.dispose(); } catch {}

        const xAxis = chart.xAxes.push(
            am5xy.CategoryAxis.new(root, {
                categoryField: "category",
                renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 30 }),
            })
        );

        const yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
                min: 0,
                strictMinMax: true,
                extraMin: 0,
                renderer: am5xy.AxisRendererY.new(root, {}),
            })
        );

        // Data with lower / expected / upper range (±10%)
        const data = [
            {
                category: "Ondergrens",
                bouwKosten: Math.round(bouwKosten * 0.9),
                engineering: Math.round(engineering * 0.9),
                overigeBijkomende: Math.round(overigeBijkomende * 0.9),
                vastgoed: Math.round(vastgoed * 0.9),
            },
            {
                category: "Verwacht",
                bouwKosten: Math.round(bouwKosten),
                engineering: Math.round(engineering),
                overigeBijkomende: Math.round(overigeBijkomende),
                vastgoed: Math.round(vastgoed),
            },
            {
                category: "Bovengrens",
                bouwKosten: Math.round(bouwKosten * 1.1),
                engineering: Math.round(engineering * 1.1),
                overigeBijkomende: Math.round(overigeBijkomende * 1.1),
                vastgoed: Math.round(vastgoed * 1.1),
            },
        ];

        xAxis.data.setAll(data);

        // Use the same default palette as the PieChart (amCharts ColorSet).
        const colorSet = am5.ColorSet.new(root, {});

        function makeSeries(field: string, name: string) {
            const color = colorSet.next();
            const series = chart.series.push(
                am5xy.ColumnSeries.new(root, {
                    name,
                    xAxis,
                    yAxis,
                    valueYField: field,
                    categoryXField: "category",
                    stacked: true,
                })
            );

            series.columns.template.setAll({
                tooltipText: "{name}: {valueY.formatNumber('#,###')}€",
                tooltipY: 0,
                fill: color,
                stroke: color,
            });

            series.data.setAll(data);
            return series;
        }

        makeSeries("bouwKosten", "Bouwkosten grondwerk");
        makeSeries("engineering", "Engineeringkosten");
        makeSeries("overigeBijkomende", "Overige bijkomende kosten");
        makeSeries("vastgoed", "Vastgoedkosten");

        chart.children.push(
            am5.Legend.new(root, {
                centerX: am5.percent(50),
                x: am5.percent(50),
            })
        );

        return () => root.dispose();
    }, [bouwKosten, engineering, overigeBijkomende, vastgoed]);

    return <div ref={chartRef} style={{ width: "100%", height: "100%" }} />;
};

export default CostRangeStackedBar;
