import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import React, { useEffect, useRef } from "react";

interface ChildData {
    category: string;
    value: number;
}

interface ParentData {
    category: string;
    value: number;
    children?: ChildData[];
}

interface Props {
    data: ParentData[];
}

const CostPieChart: React.FC<Props> = ({ data }) => {
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartRef.current) return;

        const root = am5.Root.new(chartRef.current);
        root.setThemes([am5themes_Animated.new(root)]);

        const container = root.container.children.push(
            am5.Container.new(root, {
                width: am5.percent(100),
                height: am5.percent(100),
                layout: root.horizontalLayout
            })
        );

        try {
            root._logo.dispose();
        } catch {
            // Handle error if logo is not present
        }

        // Create main chart
        const chart = container.children.push(
            am5percent.PieChart.new(root, {
                tooltip: am5.Tooltip.new(root, {})
            })
        );

        // Create main series
        const series = chart.series.push(
            am5percent.PieSeries.new(root, {
                valueField: "value",
                categoryField: "category",
                alignLabels: false
            })
        );

        series.labels.template.setAll({
            textType: "circular",
            radius: 4,
            fontSize: 11
        });
        
        series.ticks.template.set("visible", false);
        series.slices.template.set("toggleKey", "none");

        // Create sub chart
        const subChart = container.children.push(
            am5percent.PieChart.new(root, {
                radius: am5.percent(50),
                tooltip: am5.Tooltip.new(root, {})
            })
        );

        // Create sub series
        const subSeries = subChart.series.push(
            am5percent.PieSeries.new(root, {
                valueField: "value",
                categoryField: "category"
            })
        );

        subSeries.labels.template.setAll({
            fontSize: 10
        });

        subSeries.slices.template.set("toggleKey", "none");

        // Initialize with empty data (max number of children across all categories)
        const maxChildren = Math.max(...data.map(d => d.children?.length || 0));
        const emptyData = Array.from({ length: maxChildren }, (_, i) => ({
            category: `Item ${i}`,
            value: 0
        }));
        subSeries.data.setAll(emptyData);

        let selectedSlice: any;

        // Lines
        const line0 = container.children.push(
            am5.Line.new(root, {
                position: "absolute",
                stroke: root.interfaceColors.get("text"),
                strokeDasharray: [2, 2]
            })
        );
        
        const line1 = container.children.push(
            am5.Line.new(root, {
                position: "absolute",
                stroke: root.interfaceColors.get("text"),
                strokeDasharray: [2, 2]
            })
        );

        function updateLines() {
            if (selectedSlice) {
                const startAngle = selectedSlice.get("startAngle");
                const arc = selectedSlice.get("arc");
                const radius = selectedSlice.get("radius");

                const x00 = radius * am5.math.cos(startAngle);
                const y00 = radius * am5.math.sin(startAngle);

                const x10 = radius * am5.math.cos(startAngle + arc);
                const y10 = radius * am5.math.sin(startAngle + arc);

                const subRadius = subSeries.slices.getIndex(0)?.get("radius") || 0;
                const x01 = 0;
                const y01 = -subRadius;

                const x11 = 0;
                const y11 = subRadius;

                const point00 = series.toGlobal({ x: x00, y: y00 });
                const point10 = series.toGlobal({ x: x10, y: y10 });

                const point01 = subSeries.toGlobal({ x: x01, y: y01 });
                const point11 = subSeries.toGlobal({ x: x11, y: y11 });

                line0.set("points", [point00, point01]);
                line1.set("points", [point10, point11]);
            }
        }

        series.on("startAngle", () => {
            updateLines();
        });

        container.events.on("boundschanged", () => {
            root.events.once("frameended", () => {
                updateLines();
            });
        });

        function selectSlice(slice: any) {
            selectedSlice = slice;
            const dataItem = slice.dataItem;
            const dataContext = dataItem.dataContext as any;

            if (dataContext && dataContext.subData) {
                let i = 0;
                subSeries.data.each((dataObject) => {
                    const dataObj = dataContext.subData[i];
                    if (dataObj) {
                        if (!subSeries.dataItems[i].get("visible")) {
                            subSeries.dataItems[i].show();
                        }
                        subSeries.data.setIndex(i, dataObj);
                    } else {
                        subSeries.dataItems[i].hide();
                    }
                    i++;
                });
            }

            const middleAngle = slice.get("startAngle") + slice.get("arc") / 2;
            const firstAngle = series.dataItems[0].get("slice").get("startAngle");

            series.animate({
                key: "startAngle",
                to: firstAngle - middleAngle,
                duration: 1000,
                easing: am5.ease.out(am5.ease.cubic)
            });
            
            series.animate({
                key: "endAngle",
                to: firstAngle - middleAngle + 360,
                duration: 1000,
                easing: am5.ease.out(am5.ease.cubic)
            });
        }

        // Add click events
        series.slices.template.events.on("click", (e) => {
            selectSlice(e.target);
        });

        // Set data with subData structure
        const chartData = data.map(item => ({
            category: item.category,
            value: item.value,
            subData: item.children || []
        }));

        series.data.setAll(chartData);

        // Select first slice on load
        series.events.on("datavalidated", () => {
            selectSlice(series.slices.getIndex(0));
        });

        container.appear(1000, 10);

        return () => root.dispose();
    }, [data]);

    return <div ref={chartRef} style={{ width: "100%", height: "100%" }} />;
};

export default CostPieChart;
