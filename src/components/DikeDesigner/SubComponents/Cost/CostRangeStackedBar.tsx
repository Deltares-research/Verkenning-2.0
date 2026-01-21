import React, { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

interface CostRangeStackedBarProps {
    preparation: number;
    groundBody: number;
    construction: number;
    engineering: number;
}

const CostRangeStackedBar: React.FC<CostRangeStackedBarProps> = ({
    preparation,
    groundBody,
    construction,
    engineering,
}) => {
    const chartRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const root = am5.Root.new(chartRef.current!);

        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                layout: root.verticalLayout,
            })
        );

        // Create axes
        const xRenderer = am5xy.AxisRendererX.new(root, { minGridDistance: 30 });
        const xAxis = chart.xAxes.push(
            am5xy.CategoryAxis.new(root, {
                maxDeviation: 0.3,
                categoryField: "category",
                renderer: xRenderer,
            })
        );

        const yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
                renderer: am5xy.AxisRendererY.new(root, {}),
            })
        );

        // Prepare data
        const data = [
            {
                category: "Ondergrens",
                preparation: Math.round(preparation * 0.9),
                groundBody: Math.round(groundBody * 0.9),
                construction: Math.round(construction * 0.9),
                engineering: Math.round(engineering * 0.9),
            },
            {
                category: "Verwacht",
                preparation: Math.round(preparation),
                groundBody: Math.round(groundBody),
                construction: Math.round(construction),
                engineering: Math.round(engineering),
            },
            {
                category: "Bovengrens",
                preparation: Math.round(preparation * 1.1),
                groundBody: Math.round(groundBody * 1.1),
                construction: Math.round(construction * 1.1),
                engineering: Math.round(engineering * 1.1),
            },
        ];

        xAxis.data.setAll(data);

        // Colors for consistency with pie chart
        const colors = {
            preparation: am5.color(0xffa500), // orange
            groundBody: am5.color(0x00aaff), // blue
            construction: am5.color(0x00cc44), // green
            engineering: am5.color(0xff0000), // red
        };

        // Function to create series
        function makeSeries(field: string, name: string, color: am5.Color) {
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

        makeSeries("preparation", "Voorbereiding", colors.preparation);
        makeSeries("groundBody", "Grondlichaam", colors.groundBody);
        makeSeries("construction", "Constructie", colors.construction);
        makeSeries("engineering", "Engineering", colors.engineering);

        // Add legend
        chart.children.push(
            am5.Legend.new(root, {
                centerX: am5.percent(50),
                x: am5.percent(50),
            })
        );

        return () => {
            root.dispose();
        };
    }, [preparation, groundBody, construction, engineering]);

    return <div ref={chartRef} style={{ width: "100%", height: "300px" }} />;
};

export default CostRangeStackedBar;
