import { PLOT_INSET_LEFT, PLOT_INSET_RIGHT } from './plot-inset';
import { useLayoutEffect, useRef, useState } from 'react';

import { HistogramEntry } from '../db';

// The histogram is drawn at the container's true pixel width, measured, not
// scaled to fit.
//
// That is a requirement, not a preference. The Gauge rendered directly beneath
// each histogram encodes the SAME horizontal scale - it is the red/amber/green
// quantile band for the same metric - and Gauge.tsx positions itself with
// hardcoded pixel margins: `marginLeft: '71px', marginRight: '15px'`. So the
// plot area has to start exactly 71px in and end exactly 15px from the right,
// in rendered pixels, or the two stop describing the same axis and the band no
// longer sits under the values it refers to.
//
// An earlier version of this component used `viewBox` + `width="100%"` and
// scaled proportionally. That can satisfy the alignment at exactly one column
// width and drifts at every other one, because the gauge's margins are fixed
// px while a scaled viewBox's are not. Measuring is the only way to hold it at
// every viewport, and it also restores amCharts' fixed 300px height and true
// text sizes for free.

const HEIGHT = 300;
const MARGIN_TOP = 34;
const MARGIN_BOTTOM = 28;
const PLOT_TOP = MARGIN_TOP;
const PLOT_BOTTOM = HEIGHT - MARGIN_BOTTOM;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;
const Y_TICK_STEP = 50;
const BAR_WIDTH_RATIO = 0.88;

// Used until the container has been measured, and under jsdom, where
// getBoundingClientRect reports 0 and ResizeObserver does not exist. Keeping a
// usable fallback means the component still renders its bars, labels and title
// in tests - which is the whole reason the Normality tab is testable at all
// now - without a ResizeObserver polyfill in setupTests.
const FALLBACK_WIDTH = 340;

/**
 * Tracks the rendered width of the returned ref's element.
 */
const useMeasuredWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null) {
      return;
    }

    const measure = () => setWidth(element.getBoundingClientRect().width);
    measure();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width: width || FALLBACK_WIDTH };
};

// amCharts' bin `from` values are exact fractions of the data range and can
// carry long floating-point tails (e.g. 11.28800000000001). The old chart's
// category axis rendered them cleanly because amCharts formats numbers for
// display; reproduce that here by rounding to 3 decimals and dropping
// trailing zeros, rather than padding every label to a fixed precision.
const formatAxisNumber = (value: number): string =>
  Number(value.toFixed(3)).toString();

export const Histogram = ({
  data,
  title
}: {
  data: HistogramEntry[];
  title: string;
}) => {
  const { ref, width } = useMeasuredWidth();

  // These two are what keep the chart and the gauge beneath it on one axis.
  const plotLeft = PLOT_INSET_LEFT;
  const plotRight = Math.max(plotLeft + 1, width - PLOT_INSET_RIGHT);
  const plotWidth = plotRight - plotLeft;

  // Read Bootstrap's theme colours at render time (not hardcoded, not
  // module scope) so a Bootstrap theme change still flows through, matching
  // the pattern already used in Gauge.tsx / linear-gauge.
  const fill = getComputedStyle(document.body)
    .getPropertyValue('--secondary')
    .trim();
  const stroke = getComputedStyle(document.body)
    .getPropertyValue('--dark')
    .trim();

  // amCharts set valueAxis.max to this value but only ever treated it as a
  // hint: it rounded the rendered axis up to the nearest "nice" number. The
  // reference captures in docs/histogram-reference/ show every axis stepping
  // by 50, with ACA alone reaching 200 (max count 175) while the other five
  // stop at 150. Rounding up to the nearest multiple of 50 reproduces that.
  const axisMax =
    Math.ceil(Math.max(100, ...data.map((d) => d.count)) / Y_TICK_STEP) *
    Y_TICK_STEP;

  const yTicks: number[] = [];
  for (let v = 0; v <= axisMax; v += Y_TICK_STEP) {
    yTicks.push(v);
  }

  const slotWidth = plotWidth / data.length;
  const barWidth = slotWidth * BAR_WIDTH_RATIO;

  return (
    <div ref={ref}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`Histogram of ${title}`}
        // The visual-capture harness (e2e/histogram-visual.spec.ts) targets
        // this. Without it the harness would have to guess at the DOM shape,
        // which is exactly how it broke on this change: it was written against
        // amCharts' wrapper <div> and found nothing once the SVG became the
        // component's own root.
        data-testid="histogram"
      >
        {/* Title is centred on the whole chart, not the plot area. The
            plot is inset 71px on the left to line up with the gauge, and
            centring on that inset area pushes the longer titles -
            "Internal Anterior Chamber Depth - ACD (mm)" - off the right
            edge. amCharts centred on the full width too. */}
        <text
          x={width / 2}
          y={18}
          textAnchor="middle"
          fontSize={16}
          fill="currentColor"
        >
          {title}
        </text>

        {/* Y axis: gridlines + numeric labels every 50, plus the rotated title. */}
        {yTicks.map((tick) => {
          const y = PLOT_BOTTOM - (tick / axisMax) * PLOT_HEIGHT;
          return (
            <g key={tick}>
              <line
                data-testid="gridline"
                x1={plotLeft}
                x2={plotRight}
                y1={y}
                y2={y}
                stroke="#dee2e6"
                strokeWidth={1}
              />
              <text
                x={plotLeft - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill="#495057"
              >
                {tick}
              </text>
            </g>
          );
        })}
        <text
          x={20}
          y={(PLOT_TOP + PLOT_BOTTOM) / 2}
          textAnchor="middle"
          fontSize={12}
          fill="#495057"
          transform={`rotate(-90 20 ${(PLOT_TOP + PLOT_BOTTOM) / 2})`}
        >
          Number of Eyes
        </text>

        {/* X axis: amCharts labelled every other bin (minGridDistance = 30),
          and drew a vertical gridline at each labelled category. */}
        {data.map((bin, i) => {
          if (i % 2 !== 0) {
            return null;
          }
          const x = plotLeft + i * slotWidth + slotWidth / 2;
          return (
            <g key={bin.from}>
              <line
                x1={x}
                x2={x}
                y1={PLOT_TOP}
                y2={PLOT_BOTTOM}
                stroke="#dee2e6"
                strokeWidth={1}
              />
              <text
                x={x}
                y={PLOT_BOTTOM + 16}
                textAnchor="middle"
                fontSize={11}
                fill="#495057"
              >
                {formatAxisNumber(bin.from)}
              </text>
            </g>
          );
        })}

        {/* Bars. amCharts showed a floating tooltip on hover with the same two
          lines; a native SVG <title> gives the same information without
          reimplementing a tooltip library. Flagged for the owner's visual
          review alongside the viewBox choice above. */}
        {data.map((bin, i) => {
          const barHeight = (bin.count / axisMax) * PLOT_HEIGHT;
          const x = plotLeft + i * slotWidth + (slotWidth - barWidth) / 2;
          const y = PLOT_BOTTOM - barHeight;
          return (
            <rect
              key={bin.from}
              data-testid="bar"
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={fill}
              stroke={stroke}
            >
              <title>
                {`Interval: [${bin.from}, ${bin.to}[\nNumber of Eyes: ${bin.count}`}
              </title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
};
