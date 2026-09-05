/**
 * The horizontal inset shared by the Histogram and the Gauge drawn beneath it.
 *
 * These two components are read together: the gauge is the red/amber/green
 * quantile band for the *same* metric on the *same* horizontal scale as the
 * histogram above it. If their plot areas do not start and end at the same x,
 * the band no longer sits under the values it describes, and the pair becomes
 * quietly misleading rather than obviously broken.
 *
 * The values originate from amCharts' default plot inset, which the gauge was
 * hand-tuned to match back when amCharts owned the chart. They live here, in
 * one place, because they were previously duplicated as literals in two files
 * - and when the hand-rolled histogram changed its geometry, nothing caught
 * the drift. No test could: each component was correct in isolation.
 *
 * Consumed by Gauge.tsx as CSS pixel margins and by Histogram.tsx as SVG user
 * units. Those coincide only because the histogram renders at its container's
 * measured pixel width rather than scaling a viewBox - see the comment at the
 * top of Histogram.tsx.
 */
export const PLOT_INSET_LEFT = 71;
export const PLOT_INSET_RIGHT = 15;
