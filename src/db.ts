import raw from 'raw.macro';

const CSV = raw('./data.csv');

export interface DataPoint {
  iclSize: number;
  iclSe: number;
  acq: number;
  ata: number;
  clr: number;
  aca: number;
  vault: number;
  wtw: number;
}

export const mapCsvToRows = (csv: string): number[][] =>
  csv
    .split('\n')
    .reduce(
      (memo, row) => [
        ...memo,
        row.split(';').map((col: string) => Number(col))
      ],
      [] as number[][]
    )
    .filter((row) => !!row[0] && !isNaN(row[0]));

export const mapRowsToDataPoint = (rows: number[][]): DataPoint[] =>
  rows.map((row) => ({
    iclSize: row[1],
    iclSe: row[2],
    acq: row[5],
    ata: row[6],
    clr: row[7],
    aca: row[10],
    vault: row[11],
    wtw: row[15]
  }));

const mapCsvToDataPoint = (csv: string): DataPoint[] =>
  mapRowsToDataPoint(mapCsvToRows(csv));

export const DATA_POINTS: DataPoint[] = mapCsvToDataPoint(CSV);

export const VALUES = {
  ATA: DATA_POINTS.map((point) => point.ata),
  CLR: DATA_POINTS.map((point) => point.clr),
  ACQ: DATA_POINTS.map((point) => point.acq),
  ACA: DATA_POINTS.map((point) => point.aca),
  WTW: DATA_POINTS.map((point) => point.wtw)
};

const MAX_COLS = 10;

export interface HistogramEntry {
  from: number;
  to: number;
  count: number;
}
const getHistogramData = (source: number[]): HistogramEntry[] => {
  // Init
  const min = Math.min.apply(null, source);
  const max = Math.max.apply(null, source);
  const range = max - min;
  const step = range / MAX_COLS;

  // Create items
  const data = Array.from(Array(MAX_COLS).keys()).map((i) => {
    const from = min + i * step;
    const to = min + (i + 1) * step;
    return {
      from: from,
      to: to,
      count: 0
    };
  });

  // Calculate range of the values
  source.forEach((value) => {
    const item = data.find((el) => value >= el.from && value <= el.to);
    item && item.count++;
  });

  return data;
};

export const HISTOGRAM_DATA = {
  ata: getHistogramData(VALUES.ATA),
  clr: getHistogramData(VALUES.CLR),
  acq: getHistogramData(VALUES.ACQ),
  aca: getHistogramData(VALUES.ACA),
  wtw: getHistogramData(VALUES.WTW)
};
