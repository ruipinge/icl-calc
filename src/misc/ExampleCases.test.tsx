import { INITIAL_VALUES, PatientInfo } from '../types';
import { PRESETS, Preset } from '../presets';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';

import { ICLContainer } from '../ICLContainer';
import { loadedExample } from './ExampleCases';

/*
 * The full container, not a bare Formik wrapper: what matters is that a
 * case reaches the real fields, leaves the real identity row alone, that the
 * real Reset button still clears it, and that the shell's status line
 * confirms it on whichever tab is showing.
 */
const renderAt = (hash = '#') => {
  window.history.pushState({}, 'Test page', hash);
  return render(<ICLContainer />);
};

const ATA = 'AtA (mm), Angle to Angle, millimetres';
const CAPTION = 'Load an example case. Name, date of birth and eye are kept.';
const examples = () => screen.getByRole('button', { name: 'Examples' });
const item = (label: string) => screen.getByRole('button', { name: label });
const preset = (id: string): Preset => {
  const found = PRESETS.find((p) => p.id === id);
  if (!found) throw new Error(`no preset ${id}`);
  return found;
};
const choose = (id: string) => {
  fireEvent.click(examples());
  fireEvent.click(item(preset(id).label));
};
const ata = () => screen.getByRole('spinbutton', { name: ATA });
const loadedText = (label: string) =>
  `Loaded "${label}". Name, date of birth and eye were kept as entered.`;
const editAta = async (value: string) => {
  fireEvent.change(ata(), { target: { value } });
  await waitFor(() => {
    expect(ata()).toHaveValue(Number(value));
  });
};

it('discloses the cases, in order, from a collapsed Examples button', () => {
  renderAt();

  expect(examples()).toHaveAttribute('aria-expanded', 'false');
  expect(examples()).not.toHaveAttribute('aria-controls');
  expect(screen.queryByText(CAPTION)).toBeNull();
  expect(screen.queryByRole('button', { name: PRESETS[0].label })).toBeNull();

  fireEvent.click(examples());

  expect(examples()).toHaveAttribute('aria-expanded', 'true');
  expect(examples()).toHaveAttribute('aria-controls', 'examples-panel');
  expect(screen.getByText(CAPTION)).toBeInTheDocument();
  const list = screen.getByRole('list', { name: CAPTION });
  // eslint-disable-next-line testing-library/no-node-access
  expect(document.getElementById('examples-panel')).toContainElement(list);
  const items = screen
    .getAllByRole('button')
    .filter((b) => b.classList.contains('examples-item'));
  expect(items.map((b) => b.textContent)).toEqual(PRESETS.map((p) => p.label));
  expect(items.map((b) => list.contains(b))).toEqual(PRESETS.map(() => true));
});

it('collapses when Examples is clicked a second time', () => {
  renderAt();

  fireEvent.click(examples());
  expect(examples()).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(examples());

  expect(examples()).toHaveAttribute('aria-expanded', 'false');
  expect(examples()).not.toHaveAttribute('aria-controls');
  expect(screen.queryByText(CAPTION)).toBeNull();
});

// Enter and Space load only because the items are native buttons, which
// turn both keys into a click; jsdom does not synthesise that, so this pins
// the element instead. Neither control is a form field.
it('makes every case a native, unnamed button', () => {
  renderAt();
  fireEvent.click(examples());

  for (const { label } of PRESETS) {
    expect(item(label).tagName).toBe('BUTTON');
    expect(item(label)).toHaveAttribute('type', 'button');
    expect(item(label)).not.toHaveAttribute('name');
  }
  expect(examples()).toHaveAttribute('type', 'button');
  expect(examples()).not.toHaveAttribute('name');
});

it('applies a preset to the clinical fields and leaves identity alone', async () => {
  const { values } = preset('typical-myope');
  renderAt();

  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ana' } });
  fireEvent.change(screen.getByLabelText('Date of Birth'), {
    target: { value: '1990-01-01' }
  });
  fireEvent.change(screen.getByLabelText('Eye'), {
    target: { value: 'right' }
  });
  choose('typical-myope');

  await waitFor(() => {
    expect(ata()).toHaveValue(values.biometry.ata);
  });
  expect(
    screen.getByRole('spinbutton', {
      name: 'CCT (μm), Central Corneal Thickness, micrometres'
    })
  ).toHaveValue(values.corneaProfile.cct);
  expect(
    screen.getByRole('combobox', {
      name: 'Previous Corneal Refractive Surgery'
    })
  ).toHaveValue(values.corneaProfile.previousSurgery);
  expect(
    screen.getByRole('spinbutton', {
      name: 'Sphere (dpt) (spectacle refraction), dioptres'
    })
  ).toHaveValue(values.spectacleRefraction.sphere);

  expect(screen.getByLabelText('Name')).toHaveValue('Ana');
  expect(screen.getByLabelText('Date of Birth')).toHaveValue('1990-01-01');
  expect(screen.getByLabelText('Eye')).toHaveValue('right');
  // age() is a PatientInfo method: losing the instance makes it throw
  const age = new PatientInfo({
    name: 'Ana',
    dateOfBirth: '1990-01-01',
    eye: 'right'
  }).age();
  expect(age).toBeGreaterThan(0);
  expect(screen.getByRole('textbox', { name: 'Age (years)' })).toHaveValue(
    String(age)
  );
});

it.each([
  'typical-myope',
  'steep-cornea',
  'after-myopic-surgery',
  'larger-segment'
])('applies every field of %s', async (id) => {
  const { values } = preset(id);
  const { container } = renderAt();

  choose(id);

  await waitFor(() => {
    expect(ata()).toHaveValue(values.biometry.ata);
  });
  const fields = Object.entries(values).flatMap(([group, entries]) =>
    (Object.entries(entries as object) as [string, string | number][]).map(
      ([key, value]) => [`${group}.${key}`, value] as const
    )
  );
  expect(fields).toHaveLength(20);
  for (const [name, value] of fields) {
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    const field = container.querySelector(`[name="${name}"]`);
    // jest-dom prints the element, name attribute included, on failure
    expect(field).not.toBeNull();
    expect(field).toHaveValue(value);
  }
});

it('closes after loading and returns focus, so the same case can be re-applied', async () => {
  const { label, values } = preset('typical-myope');
  renderAt();

  choose('typical-myope');
  await waitFor(() => {
    expect(ata()).toHaveValue(values.biometry.ata);
  });
  expect(examples()).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('button', { name: label })).toBeNull();
  // the item that had focus is gone; focus goes back to Examples, not <body>
  expect(examples()).toHaveFocus();

  await editAta('13.4');

  choose('typical-myope');
  await waitFor(() => {
    expect(ata()).toHaveValue(values.biometry.ata);
  });
});

it('is cleared by Reset like everything else', async () => {
  const { values } = preset('typical-myope');
  expect(values.biometry.ata).not.toBe(INITIAL_VALUES.biometry.ata);
  renderAt();

  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ana' } });
  choose('typical-myope');
  await waitFor(() => {
    expect(ata()).toHaveValue(values.biometry.ata);
  });

  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

  // back to empty, where every measured field starts (#196); an empty
  // number input reads as null
  expect(INITIAL_VALUES.biometry.ata).toBe('');
  await waitFor(() => {
    expect(ata()).toHaveValue(null);
  });
  expect(screen.getByLabelText('Name')).toHaveValue('');
});

it('clears the status on Reset', async () => {
  const { label } = preset('after-myopic-surgery');
  renderAt();

  choose('after-myopic-surgery');
  await waitFor(() => {
    expect(screen.getByRole('status')).toHaveTextContent(label);
  });
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
  await waitFor(() => {
    expect(screen.getByRole('status')).toHaveTextContent('');
  });
});

/*
 * Moving is not loading. #202 kept loading off a select's change event
 * because Chromium on Windows and Linux fires change while a closed select
 * is stepped through with the arrows; the arrows here only move focus.
 */
it('moves focus with the arrow keys, wrapping, and never loads', async () => {
  renderAt();
  await editAta('13.4');

  fireEvent.click(examples());
  // ArrowUp on the button is not handled: nothing moves
  fireEvent.keyDown(examples(), { key: 'ArrowUp' });
  expect(document.body).toHaveFocus();

  const labels = PRESETS.map((p) => p.label);
  const steps: [HTMLElement, string, string][] = [
    [examples(), 'ArrowDown', labels[0]],
    [item(labels[0]), 'ArrowDown', labels[1]],
    [item(labels[1]), 'ArrowUp', labels[0]],
    [item(labels[0]), 'ArrowUp', labels[labels.length - 1]],
    [item(labels[labels.length - 1]), 'ArrowDown', labels[0]]
  ];
  for (const [from, key, to] of steps) {
    const handled = fireEvent.keyDown(from, { key });
    expect(item(to)).toHaveFocus();
    // fireEvent returns false when the default action was prevented
    expect(handled).toBe(false);
  }

  // any other key is left to the browser
  expect(fireEvent.keyDown(item(labels[0]), { key: 'Home' })).toBe(true);
  expect(item(labels[0])).toHaveFocus();

  // give any stray Formik update the chance to land before asserting
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(ata()).toHaveValue(13.4);
  expect(screen.getByRole('status')).toHaveTextContent('');

  fireEvent.keyDown(item(labels[0]), { key: 'Escape' });
  expect(examples()).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByText(CAPTION)).toBeNull();
  expect(examples()).toHaveFocus();
});

it('ignores keys while closed', () => {
  renderAt();
  examples().focus();

  expect(fireEvent.keyDown(examples(), { key: 'ArrowDown' })).toBe(true);
  fireEvent.keyDown(examples(), { key: 'Escape' });

  expect(examples()).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByText(CAPTION)).toBeNull();
});

it('closes on a pointer down outside it, without loading, but not inside', async () => {
  renderAt();
  await editAta('13.4');

  fireEvent.click(examples());
  fireEvent.pointerDown(screen.getByText(CAPTION));
  expect(examples()).toHaveAttribute('aria-expanded', 'true');

  fireEvent.pointerDown(document.body);
  expect(examples()).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByText(CAPTION)).toBeNull();

  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(ata()).toHaveValue(13.4);
  expect(screen.getByRole('status')).toHaveTextContent('');
});

it('closes when focus leaves it, but not when focus moves within it', () => {
  renderAt();
  fireEvent.click(examples());
  // element.focus() is not an RTL event, so its state update needs act()
  const focus = (element: HTMLElement) => act(() => element.focus());

  focus(examples());
  focus(item(PRESETS[0].label));
  expect(examples()).toHaveAttribute('aria-expanded', 'true');

  // a blur to nowhere (the window losing focus) is not leaving
  act(() => item(PRESETS[0].label).blur());
  expect(examples()).toHaveAttribute('aria-expanded', 'true');

  focus(item(PRESETS[0].label));
  focus(screen.getByRole('button', { name: 'Reset' }));
  expect(examples()).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByText(CAPTION)).toBeNull();
});

/*
 * Every preset but steep-cornea has no posterior keratometry. Loading one
 * over steep-cornea must zero those fields: a stale posterior K switches
 * calcRadiusPosterior's fork and changes the computed ICL power.
 */
it('replaces the previous case, posterior keratometry included', async () => {
  const steep = preset('steep-cornea').values.corneaProfile;
  const typical = preset('typical-myope').values.corneaProfile;
  expect(steep.kpf).not.toBe(typical.kpf);
  const { container } = renderAt();

  choose('steep-cornea');
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
  const field = (name: string) => container.querySelector(`[name="${name}"]`);
  await waitFor(() => {
    expect(field('corneaProfile.kpf')).toHaveValue(steep.kpf);
  });

  choose('typical-myope');
  await waitFor(() => {
    expect(field('corneaProfile.kpf')).toHaveValue(typical.kpf);
  });
  for (const key of ['kps', 'axispf', 'axisps'] as const) {
    expect(field(`corneaProfile.${key}`)).toHaveValue(typical[key]);
  }
});

/*
 * One edit per clinical group: the status must clear whichever group moves
 * away from the loaded case, posterior keratometry included.
 */
it.each([
  ['biometry', 'ata'],
  ['corneaProfile', 'kpf'],
  ['spectacleRefraction', 'sphere']
] as const)(
  'says which case was loaded, until %s.%s moves away from it',
  async (group, key) => {
    const { label, values } = preset('after-myopic-surgery');
    const { container } = renderAt();

    choose('after-myopic-surgery');
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(loadedText(label));
    });

    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    const field = container.querySelector(`[name="${group}.${key}"]`);
    expect(field).not.toBeNull();
    const current = (values[group] as unknown as Record<string, number>)[key];
    fireEvent.change(field as Element, {
      target: { value: String(current + 1) }
    });
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('');
    });
  }
);

// Once edited, the data is the clinician's: typing the case's value back
// must not bring the confirmation back, nor re-announce it.
it('does not confirm an edited case again when its value is typed back', async () => {
  const { label, values } = preset('typical-myope');
  renderAt();

  choose('typical-myope');
  await waitFor(() => {
    expect(screen.getByRole('status')).toHaveTextContent(loadedText(label));
  });

  await editAta(String(values.biometry.ata + 1));
  await waitFor(() => {
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  await editAta(String(values.biometry.ata));
  // give any stray Formik update the chance to land before asserting
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(screen.getByRole('status')).toHaveTextContent('');
});

// Examples is in the sticky header; the confirmation is at the top of the
// page, out of sight for a clinician scrolled down a tab.
it('scrolls the confirmation into view when a case loads', async () => {
  const { label } = preset('steep-cornea');
  const scrollIntoView = vi.fn();
  const original = Object.getOwnPropertyDescriptor(
    Element.prototype,
    'scrollIntoView'
  );
  Element.prototype.scrollIntoView = scrollIntoView;
  try {
    renderAt();
    choose('steep-cornea');
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(loadedText(label));
    });

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
    expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByRole('status'));
  } finally {
    if (original) {
      Object.defineProperty(Element.prototype, 'scrollIntoView', original);
    } else {
      delete (Element.prototype as Partial<Element>).scrollIntoView;
    }
  }
});

// The confirmation lives in the shell, under the tabs, not on Patient.
it('confirms a case loaded from another tab, and keeps it on Patient', async () => {
  const { label } = preset('larger-segment');
  renderAt('#/matrix');
  expect(screen.queryByLabelText('Name')).toBeNull();

  choose('larger-segment');
  await waitFor(() => {
    expect(screen.getByRole('status')).toHaveTextContent(loadedText(label));
  });

  fireEvent.click(screen.getByRole('link', { name: 'Patient' }));
  await screen.findByLabelText('Name');
  expect(screen.getByRole('status')).toHaveTextContent(loadedText(label));
});

describe('loadedExample', () => {
  const { id, values } = preset('steep-cornea');
  const form = { ...INITIAL_VALUES, ...values };

  it('names nothing without a loaded id', () => {
    expect(loadedExample(form, undefined)).toBeUndefined();
    expect(loadedExample(form, {})).toBeUndefined();
  });

  it('names nothing for an unknown id', () => {
    expect(loadedExample(form, { example: 'no-such-case' })).toBeUndefined();
  });

  it('names nothing once one value differs', () => {
    const moved = {
      ...form,
      corneaProfile: {
        ...form.corneaProfile,
        axisps: values.corneaProfile.axisps + 1
      }
    };
    expect(loadedExample(moved, { example: id })).toBeUndefined();
  });

  it('names the case while every value matches', () => {
    expect(loadedExample(form, { example: id })).toBe(preset(id));
  });
});
