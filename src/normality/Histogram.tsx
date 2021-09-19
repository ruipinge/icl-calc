import * as am4charts from '@amcharts/amcharts4/charts';
import * as am4core from '@amcharts/amcharts4/core';

import { useLayoutEffect, useRef } from 'react';

import { HistogramEntry } from '../db';

am4core.options.queue = true;

export const Histogram = ({
  data,
  title
}: {
  data: HistogramEntry[];
  title: string;
}) => {
  const chart = useRef<am4charts.XYChart>();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Create chart instance

    let x: am4charts.XYChart = am4core.create(
      ref.current || undefined,
      am4charts.XYChart
    );

    let t = x.titles.create();
    t.text = title;
    t.marginBottom = 22;
    t.fontSize = '1rem';

    // Add data
    x.data = data;

    // Create axes
    const categoryAxis = x.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = 'from';
    categoryAxis.renderer.grid.template.location = 0;
    categoryAxis.renderer.minGridDistance = 30;

    const valueAxis = x.yAxes.push(new am4charts.ValueAxis());
    valueAxis.title.text = 'Number of Eyes';
    valueAxis.min = 0;
    valueAxis.max = Math.max(...[100, ...data.map((d) => d.count)]);

    // Create series
    const series = x.series.push(new am4charts.ColumnSeries());
    const fill = getComputedStyle(document.body).getPropertyValue(
      '--secondary' // Bootstrap 4
    );
    const stroke = getComputedStyle(document.body).getPropertyValue(
      '--dark' // Bootstrap 4
    );
    series.columns.template.fill = am4core.color(fill.trim());
    series.columns.template.stroke = am4core.color(stroke.trim());
    series.dataFields.valueY = 'count';
    series.dataFields.categoryX = 'from';
    series.columns.template.tooltipText =
      'Interval: [bold][[{from}, {to}[[[/]\nNumber of Eyes: [bold]{count}[/]';

    chart.current = x;

    return () => {
      x.dispose();
    };
  }, []);

  return <div ref={ref} style={{ width: '100%', height: '300px' }} />;
};
