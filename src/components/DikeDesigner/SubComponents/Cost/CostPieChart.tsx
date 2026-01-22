import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import React, { useEffect, useRef } from "react";

interface Props {
    data: { category: string; value: number }[];
}

const CostPieChart: React.FC<Props> = ({ data }) => {
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        const root = am5.Root.new(chartRef.current);
        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
            am5percent.PieChart.new(root, {
                layout: root.verticalLayout
            })
        ); 

        try {
            root._logo.dispose();
        } catch {
            // Handle error if logo is not present
        }

        const series = chart.series.push(
            am5percent.PieSeries.new(root, {
                valueField: "value",
                categoryField: "category"
            })
        );

        series.data.setAll(data);
        series.labels.template.set("text", "{category}: {value}€");
        series.ticks.template.set("visible", true);

        // Set tooltip on slices
        series.slices.template.setAll({
            tooltipText: "{category}: {value}€",
        });


        return () => root.dispose();
    }, [data]);

    return <div ref={chartRef} style={{ width: "100%", height: "250px" }} />;
};

export default CostPieChart;
