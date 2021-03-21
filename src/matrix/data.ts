import {
  Row as DbRow,
  INDEXED_ROWS,
  LENS_SIZES,
  LensSizeIndex,
  MYOPIA_LEVEL
} from '../db';

const ATA_DEVIATION: number = 0.1; // millimetres
const CLR_DEVIATION: number = 100 * 0.001; // millimetres

export interface MatrixFilter {
  readonly ata: number;
  readonly clr: number;
  readonly indexedRows?: LensSizeIndex;
}

export interface VaultRange {
  min?: number;
  max?: number;
}

export const filterFlatRows = (filter: MatrixFilter): DbRow[][] => {
  const indexedRows = filter.indexedRows || INDEXED_ROWS;
  return LENS_SIZES.reduce(
    (memoLens, lensSize) => [
      ...memoLens,
      ...MYOPIA_LEVEL.reduce(
        (memoMyopia, myopia) => [
          ...memoMyopia,
          ...[
            indexedRows[lensSize][myopia].filter(
              (row: DbRow) =>
                filter.ata >= row[6] - ATA_DEVIATION &&
                filter.ata <= row[6] + ATA_DEVIATION &&
                filter.clr >= row[7] - CLR_DEVIATION && // clr in db is in millimetres
                filter.clr <= row[7] + CLR_DEVIATION // clr in db is in millimetres
            )
          ]
        ],
        [] as DbRow[][]
      )
    ],
    [] as DbRow[][]
  );
};
