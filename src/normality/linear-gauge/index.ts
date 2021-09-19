export type Zone = {
  readonly min: number;
  readonly max: number;
  readonly color: string;
};

export type Pointer = {
  readonly color: string;
  readonly height: number;
  readonly width: number;
};

export type Options = {
  readonly divisionColor?: string;
  readonly divisions?: number;
  readonly divisionHeight?: number;
  readonly pointer?: Pointer;
  readonly subDivisions?: number;
  readonly subDivisionHeight?: number;
  readonly value?: number;
  readonly zones?: Zone[];
  readonly zoneHeight?: number;
};

const defaultZoneHeight = 12;
const defaultDivisions = 5;
const defaultDivisionHeight = 18;
const defaultDivisionColor = '#000000';
const defaultSubDivisions = 1;
const defaultSubDivisionHeight = 8;

const defaultZones = [
  {
    min: 0,
    max: 3,
    color: 'green'
  },
  {
    min: 3,
    max: 5,
    color: 'yellow'
  },
  {
    min: 5,
    max: 6,
    color: 'red'
  }
];

const defaultPointer = {
  color: 'red',
  height: 18,
  width: 5
};

type Style = {
  readonly [key: string]: string;
};

const createDiv = ({ styles = {} }: { readonly styles?: Style }) => {
  const div = document.createElement('div');
  Object.keys(styles).forEach((key) => div.style.setProperty(key, styles[key]));
  return div;
};

const createDivision = ({
  division,
  divisions,
  height
}: {
  readonly division: number;
  readonly divisions: number;
  readonly height: number;
}) => {
  const div = createDiv({
    styles: {
      position: 'absolute',
      top: '0px',
      height: `${height}px`,
      'border-left': '1px solid #000000'
    }
  });
  if (division < divisions) {
    div.style.setProperty('left', `${(division / divisions) * 100}%`);
  } else {
    div.style.setProperty('right', '0%');
  }
  return div;
};

const createSubDivision = ({
  subDivision,
  totalSubDivisions,
  subDivisionHeight
}: {
  readonly subDivision: number;
  readonly totalSubDivisions: number;
  readonly subDivisionHeight: number;
}) => {
  return createDiv({
    styles: {
      position: `absolute`,
      top: '0px',
      left: `${(subDivision / totalSubDivisions) * 100}%`,
      height: `${subDivisionHeight}px`,
      'border-left': '1px solid #000000'
    }
  });
};

const createZone = ({
  zone,
  height
}: {
  readonly zone: Zone;
  readonly height: number;
}): HTMLElement => {
  return createDiv({
    styles: {
      height: `${height}px`,
      flex: `${zone.max - zone.min}`, // TODO: make sure decimals are not used
      'background-color': zone.color
    }
  });
};

const createPointer = (pointer: Pointer): SVGElement => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', `${pointer.width}`);
  svg.setAttribute('height', `${pointer.height}`);
  svg.style.setProperty('position', 'absolute');

  const triangle = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'polygon'
  );
  triangle.setAttribute(
    'points',
    `${pointer.width / 2},0 0,${pointer.height} ${pointer.width},${
      pointer.height
    }`
  );
  triangle.setAttribute('fill', '#ff0000');
  svg.appendChild(triangle);
  return svg;
};

export class LinearGauge {
  readonly el: HTMLElement;
  zones: Zone[];
  zoneHeight: number;
  value?: number;
  pointer: Pointer;
  container?: HTMLDivElement;
  divisions: number;
  divisionHeight: number;
  subDivisionHeight: number;
  subDivisions: number;

  constructor(htmlElement: HTMLElement) {
    this.el = htmlElement;
    this.zones = [];
    this.zoneHeight = defaultZoneHeight;
    this.pointer = defaultPointer;
    this.divisions = defaultDivisions;
    this.divisionHeight = defaultDivisionHeight;
    this.subDivisions = defaultSubDivisions;
    this.subDivisionHeight = defaultSubDivisionHeight;
  }

  renderPointer(value?: number) {
    const min = this.zones[0].min;
    const max = this.zones[this.zones.length - 1].max;

    if (value !== undefined && value >= min && value <= max) {
      const totalRange = max - min;
      const valuePercent = ((value - min) / totalRange) * 100;

      const pointerSvg = createPointer(this.pointer);
      pointerSvg.style.setProperty(
        'left',
        `calc(${valuePercent}% - ${Math.floor(this.pointer.width / 2)}px)`
      );
      pointerSvg.style.setProperty('top', `${this.zoneHeight}px`);
      this.container?.appendChild(pointerSvg);
    }
  }

  renderSubDivisions() {
    const totalSubDivisions = this.divisions * this.subDivisions;
    Array(totalSubDivisions)
      .fill(0)
      .map((_, sub) => sub)
      .filter((sub) => sub % this.subDivisions !== 0)
      .map((subDivision) =>
        createSubDivision({
          subDivision: subDivision,
          totalSubDivisions: totalSubDivisions,
          subDivisionHeight: this.subDivisionHeight
        })
      )
      .forEach((div) => this.container?.appendChild(div));
  }

  renderDivisions() {
    Array(this.divisions + 1)
      .fill(0)
      .map((_, division) =>
        createDivision({
          division: division,
          divisions: this.divisions,
          height: this.divisionHeight
        })
      )
      .forEach((div) => this.container?.appendChild(div));
  }

  setOptions({
    divisionColor = defaultDivisionColor,
    divisions = defaultDivisions,
    divisionHeight = defaultDivisionHeight,
    pointer = defaultPointer,
    subDivisions = defaultSubDivisions,
    subDivisionHeight = defaultSubDivisionHeight,
    value,
    zones = defaultZones,
    zoneHeight = defaultZoneHeight
  }: Options): LinearGauge {
    const container = createDiv({
      styles: {
        'border-top': `1px solid ${divisionColor}`,
        display: 'flex',
        position: 'relative',
        height: `${Math.max(divisionHeight, zoneHeight + pointer.height)}px`
      }
    });

    this.container = container;
    this.zones = zones;
    this.zoneHeight = zoneHeight;
    this.pointer = pointer;
    this.divisions = divisions;
    this.divisionHeight = divisionHeight;
    this.subDivisions = subDivisions;
    this.subDivisionHeight = subDivisionHeight;

    // Pointer
    this.renderPointer(value);

    // Sub-Divisions
    this.renderSubDivisions();

    // Divisions
    this.renderDivisions();

    // Zones
    zones
      .map((z) => createZone({ zone: z, height: zoneHeight }))
      .forEach((d) => container.appendChild(d));

    this.el.appendChild(container);

    return this;
  }

  dispose(): HTMLElement {
    this.el.childNodes.forEach((node) => this.el.removeChild(node));
    // while (this.el.lastChild) {
    //   this.el.removeChild(this.el.lastChild);
    // }
    // this.el.textContent = '';
    return this.el;
  }
}
