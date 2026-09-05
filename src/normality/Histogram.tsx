import { HistogramEntry } from '../db';

// Layout constants for the internal SVG coordinate system. The <svg> below
// scales via `viewBox` + `width="100%"` rather than amCharts' old fixed
// 300px height: without measuring the container there is no way to hold a
// fixed pixel height *and* an undistorted aspect ratio at the same time, and
// distorting the text to force one would look worse than a chart that grows
// and shrinks slightly with its column width. Flagged for the owner's visual
// review, same as the tooltip choice below.
// WIDTH is not arbitrary: it is the aspect ratio the chart renders at. With
// `viewBox` + `width="100%"` the SVG scales to its column, so the apparent
// size of every label is (column width / WIDTH). A Bootstrap .col-md-4 in
// this layout is ~336px at a 1280px viewport - the width the amCharts
// reference in docs/histogram-reference/ was captured at - so WIDTH ~= 340
// makes the scale factor ~1 and the text render at the size it is declared.
// An earlier 460 shrank everything to 73%: same chart, noticeably smaller
// type and a 220px-tall plot instead of 300px. Caught by comparing against
// the reference, not by any test.
const WIDTH = 340;
const HEIGHT = 300;
const MARGIN = { top: 34, right: 16, bottom: 28, left: 48 };
const PLOT_LEFT = MARGIN.left;
const PLOT_RIGHT = WIDTH - MARGIN.right;
const PLOT_TOP = MARGIN.top;
const PLOT_BOTTOM = HEIGHT - MARGIN.bottom;
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;
const Y_TICK_STEP = 50;
const BAR_WIDTH_RATIO = 0.88;

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

  const slotWidth = PLOT_WIDTH / data.length;
  const barWidth = slotWidth * BAR_WIDTH_RATIO;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      role="img"
      aria-label={`Histogram of ${title}`}
      // The visual-capture harness (e2e/histogram-visual.spec.ts) targets
      // this. Without it the harness would have to guess at the DOM shape,
      // which is exactly how it broke on this change: it was written against
      // amCharts' wrapper <div> and found nothing once the SVG became the
      // component's own root.
      data-testid="histogram"
    >
      <text
        x={WIDTH / 2}
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
              x1={PLOT_LEFT}
              x2={PLOT_RIGHT}
              y1={y}
              y2={y}
              stroke="#dee2e6"
              strokeWidth={1}
            />
            <text
              x={PLOT_LEFT - 8}
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
        x={12}
        y={(PLOT_TOP + PLOT_BOTTOM) / 2}
        textAnchor="middle"
        fontSize={12}
        fill="#495057"
        transform={`rotate(-90 12 ${(PLOT_TOP + PLOT_BOTTOM) / 2})`}
      >
        Number of Eyes
      </text>

      {/* X axis: amCharts labelled every other bin (minGridDistance = 30),
          and drew a vertical gridline at each labelled category. */}
      {data.map((bin, i) => {
        if (i % 2 !== 0) {
          return null;
        }
        const x = PLOT_LEFT + i * slotWidth + slotWidth / 2;
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
        const x = PLOT_LEFT + i * slotWidth + (slotWidth - barWidth) / 2;
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
  );
};
