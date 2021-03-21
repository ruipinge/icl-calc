import raw from 'raw.macro';

const CSV = raw('./data.csv');

export interface DataPoint {
  iclSize: number;
  iclSe: number;
  ata: number;
  clr: number;
  vault: number;
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
    ata: row[6],
    clr: row[7],
    vault: row[11]
  }));

const mapCsvToDataPoint = (csv: string): DataPoint[] =>
  mapRowsToDataPoint(mapCsvToRows(csv));

export const DATA_POINTS: DataPoint[] = mapCsvToDataPoint(CSV);
