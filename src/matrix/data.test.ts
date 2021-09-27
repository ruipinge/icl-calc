import { DataPoint, mapRowsToDataPoint } from '../db';
import {
  LENS_SIZES,
  MYOPIA_LEVELS,
  MatrixFilter,
  filterFlatRows,
  filterPoint,
  getDataPoints
} from './data';

// prettier-ignore
const dataPoints: DataPoint[] = mapRowsToDataPoint([
    //[Age, ICLSize, ICLSE,  ACD, CCT,   ATA,   CLR, Ave Pre-op ACA,  Vault,  WTW, Keratometry]
      [ 23,    12.6,    -5, 4.02, 610, 11.72, -0.08,          47.05,   1100, 11.3,       44.35],
      [ 23,    12.6,    -5, 4.02, 610, 11.72, -0.08,          47.05,   1200, 11.3,       44.35],
      [ 23,    12.6,    -5, 4.02, 610, 11.72, -0.08,          47.05,   1300, 11.3,       44.35],
      [ 23,    12.6,   -11, 4.02, 610, 11.72, -0.08,          47.05,   1400, 11.3,       44.35],
      [ 23,    12.6,   -11, 4.02, 610, 11.72, -0.08,          47.05,   1500, 11.3,       44.35],
      [ 23,    12.6,   -11, 4.02, 610, 11.72, -0.08,          47.05,   1600, 11.3,       44.35],
      [ 23,    12.6,   -13, 4.02, 610, 11.72, -0.08,          47.05,   1700, 11.3,       44.35],
      [ 23,    12.6,   -13, 4.02, 610, 11.72, -0.08,          47.05,   1800, 11.3,       44.35],
      [ 23,    12.6,   -13, 4.02, 610, 11.72, -0.08,          47.05,   1900, 11.3,       44.35],
      [ 23,    13.2,    -5, 4.02, 610, 11.72, -0.08,          47.05,   2000, 11.3,       44.35],
      [ 23,    13.2,    -5, 4.02, 610, 11.72, -0.08,          47.05,   2100, 11.3,       44.35],
      [ 23,    13.2,    -5, 4.02, 610, 11.72, -0.08,          47.05,   2200, 11.3,       44.35],
      [ 23,    13.2,   -11, 4.02, 610, 11.72, -0.08,          47.05,   2300, 11.3,       44.35],
      [ 23,    13.2,   -11, 4.02, 610, 11.72, -0.08,          47.05,   2400, 11.3,       44.35],
      [ 23,    13.2,   -11, 4.02, 610, 11.72, -0.08,          47.05,   2500, 11.3,       44.35],
      [ 23,    13.2,   -13, 4.02, 610, 11.72, -0.08,          47.05,   2600, 11.3,       44.35],
      [ 23,    13.2,   -13, 4.02, 610, 11.72, -0.08,          47.05,   2700, 11.3,       44.35],
      [ 23,    13.2,   -13, 4.02, 610, 11.72, -0.08,          47.05,   2800, 11.3,       44.35],
      [ 23,    13.7,    -5, 4.02, 610, 11.72, -0.08,          47.05,   2900, 11.3,       44.35],
      [ 23,    13.7,    -5, 4.02, 610, 11.72, -0.08,          47.05,   3000, 11.3,       44.35],
      [ 23,    13.7,    -5, 4.02, 610, 11.72, -0.08,          47.05,   3100, 11.3,       44.35],
      [ 23,    13.7,   -11, 4.02, 610, 11.72, -0.08,          47.05,   3200, 11.3,       44.35],
      [ 23,    13.7,   -11, 4.02, 610, 11.72, -0.08,          47.05,   3300, 11.3,       44.35],
      [ 23,    13.7,   -11, 4.02, 610, 11.72, -0.08,          47.05,   3400, 11.3,       44.35],
      [ 23,    13.7,   -13, 4.02, 610, 11.72, -0.08,          47.05,   3500, 11.3,       44.35],
      [ 23,    13.7,   -13, 4.02, 610, 11.72, -0.08,          47.05,   3600, 11.3,       44.35],
      [ 23,    13.7,   -13, 4.02, 610, 11.72, -0.08,          47.05,   3700, 11.3,       44.35],
      // Excluded Lens Size
      [ 23,    13.6,   -13, 4.02, 610, 11.72, -0.08,          47.05,   3700, 11.3,       44.35],
      // Excluded ATA
      [ 23,    13.6,   -13, 4.02, 610, 11.81, -0.08,          47.05,   3700, 11.3,       44.35],
      [ 23,    13.6,   -13, 4.02, 610, 11.59, -0.08,          47.05,   3700, 11.3,       44.35],
      // Excluded CLR
      [ 23,    13.6,   -13, 4.02, 610, 11.72, -0.1001,        47.05,   3700, 11.3,       44.35],
      [ 23,    13.6,   -13, 4.02, 610, 11.72,  0.1001,        47.05,   3700, 11.3,       44.35],
    ]);

export const FILTER: MatrixFilter = {
  ata: 11.7,
  clr: 0,
  dataPoints: dataPoints
};

it('filter mocked data points', () => {
  const flatRows = filterFlatRows(FILTER);
  expect(flatRows.length).toBe(9);
  flatRows.forEach((points) => expect(points.length).toBe(3));
});

it('filter real data points', () => {
  const flatRows = filterFlatRows({
    ata: 11.7,
    clr: 0
  });
  expect(flatRows.length).toBe(9);

  expect(flatRows[0].length).toBe(0);
  expect(flatRows[1].length).toBe(5);
  expect(flatRows[2].length).toBe(6);
  expect(flatRows[3].length).toBe(0);
  expect(flatRows[4].length).toBe(8);
  expect(flatRows[5].length).toBe(6);
  expect(flatRows[6].length).toBe(0);
  expect(flatRows[7].length).toBe(0);
  expect(flatRows[8].length).toBe(0);
});

it('filter real data points for Lens and Myopia', () => {
  const points = getDataPoints({
    lens: LENS_SIZES[0],
    myopia: MYOPIA_LEVELS[0]
  });
  expect(points.length).toBe(8);
});

it('filter datapoint correctly', () => {
  const point = mapRowsToDataPoint([
    //[Age, ICLSize, ICLSE,  ACD, CCT,   ATA,   CLR, Ave Pre-op ACA,  Vault,  WTW, Keratometry]
    [23, 13.7, -7.5, 3.9, 590, 13.35, -350, 46.5, 760, 12.3, 39.7]
  ])[0];

  expect(point.clr).toBe(-350);
  expect(point.ata).toBe(13.35);

  expect(filterPoint({ ata: 13.35, clr: -350, point })).toBe(true);
  expect(filterPoint({ ata: 13.35, clr: -250, point })).toBe(true);
  expect(filterPoint({ ata: 13.35, clr: -450, point })).toBe(true);
  expect(filterPoint({ ata: 13.35, clr: -249, point })).toBe(false);
  expect(filterPoint({ ata: 13.35, clr: -451, point })).toBe(false);
  expect(filterPoint({ ata: 13.45, clr: -350, point })).toBe(true);
  expect(filterPoint({ ata: 13.25, clr: -350, point })).toBe(true);
  expect(filterPoint({ ata: 13.451, clr: -350, point })).toBe(false);
  expect(filterPoint({ ata: 13.249, clr: -350, point })).toBe(false);
});
