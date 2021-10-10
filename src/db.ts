import raw from 'raw.macro';

const CSV = raw('./data.csv');

export interface DataPoint {
  age: number;
  iclSize: number;
  iclSe: number;
  acd: number;
  cct: number;
  ata: number;
  clr: number;
  aca: number;
  vault: number;
  wtw: number;
  keratometry: number;
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
    age: row[0],
    iclSize: row[1],
    iclSe: row[2],
    acd: row[3],
    cct: row[4],
    ata: row[5],
    clr: row[6],
    aca: row[7],
    vault: row[8],
    wtw: row[9],
    keratometry: row[10]
  }));

const mapCsvToDataPoint = (csv: string): DataPoint[] =>
  mapRowsToDataPoint(mapCsvToRows(csv));

export const DATA_POINTS: DataPoint[] = mapCsvToDataPoint(CSV);

export const VALUES = {
  ATA: DATA_POINTS.map((point) => point.ata),
  CLR: DATA_POINTS.map((point) => point.clr),
  ACD: DATA_POINTS.map((point) => point.acd),
  ACA: DATA_POINTS.map((point) => point.aca),
  WTW: DATA_POINTS.map((point) => point.wtw),
  AGE: DATA_POINTS.map((point) => point.age)
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
  acd: getHistogramData(VALUES.ACD),
  aca: getHistogramData(VALUES.ACA),
  wtw: getHistogramData(VALUES.WTW),
  age: getHistogramData(VALUES.AGE)
};
