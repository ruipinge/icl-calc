import { INITIAL_VALUES, PatientInfo } from '../types';
import { PRESETS, Preset } from '../presets';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ICLContainer } from '../ICLContainer';

/*
 * The full container, not a bare Formik wrapper: what matters is that a
 * preset reaches the real fields, leaves the real identity row alone, and
 * that the real Reset button still clears it (Review Focus 4).
 */
const renderPatient = () => {
  window.history.pushState({}, 'Test page', '#');
  return render(<ICLContainer />);
};

const ATA = 'Angle to Angle (AtA), millimetres';
const combobox = () =>
  screen.getByRole('combobox', { name: 'Load an example case' });
const loadButton = () => screen.getByRole('button', { name: 'Load' });
const select = (id: string) =>
  fireEvent.change(combobox(), { target: { value: id } });
const choose = (id: string) => {
  select(id);
  fireEvent.click(loadButton());
};
const preset = (id: string): Preset => {
  const found = PRESETS.find((p) => p.id === id);
  if (!found) throw new Error(`no preset ${id}`);
  return found;
};

it('applies a preset to the clinical fields and leaves identity alone', async () => {
  const { values } = preset('typical-myope');
  renderPatient();

  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ana' } });
  fireEvent.change(screen.getByLabelText('Date of Birth'), {
    target: { value: '1990-01-01' }
  });
  fireEvent.change(screen.getByLabelText('Eye'), {
    target: { value: 'right' }
  });
  choose('typical-myope');

  await waitFor(() => {
    expect(screen.getByRole('spinbutton', { name: ATA })).toHaveValue(
      values.biometry.ata
    );
  });
  expect(
    screen.getByRole('spinbutton', {
      name: 'Central Corneal Thickness (CCT), micrometres'
    })
  ).toHaveValue(values.corneaProfile.cct);
  expect(
    screen.getByRole('combobox', {
      name: 'Previous Corneal Refractive Surgery'
    })
  ).toHaveValue(values.corneaProfile.previousSurgery);
  expect(
    screen.getByRole('spinbutton', {
      name: 'Sphere (spectacle refraction), dioptres'
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
  expect(screen.getByRole('textbox', { name: 'Age, years' })).toHaveValue(
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
  const { container } = renderPatient();

  choose(id);

  await waitFor(() => {
    expect(screen.getByRole('spinbutton', { name: ATA })).toHaveValue(
      values.biometry.ata
    );
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

it('returns to "Choose…" after applying, so the same case can be re-applied', async () => {
  const { values } = preset('typical-myope');
  renderPatient();

  choose('typical-myope');
  await waitFor(() => {
    expect(screen.getByRole('spinbutton', { name: ATA })).toHaveValue(
      values.biometry.ata
    );
  });
  expect(combobox()).toHaveValue('');
  // Load has disabled itself; focus goes back to the select, not to <body>
  expect(combobox()).toHaveFocus();

  fireEvent.change(screen.getByRole('spinbutton', { name: ATA }), {
    target: { value: '13.4' }
  });
  await waitFor(() => {
    expect(screen.getByRole('spinbutton', { name: ATA })).toHaveValue(13.4);
  });

  choose('typical-myope');
  await waitFor(() => {
    expect(screen.getByRole('spinbutton', { name: ATA })).toHaveValue(
      values.biometry.ata
    );
  });
  expect(combobox()).toHaveValue('');
});

it('is cleared by Reset like everything else', async () => {
  const { values } = preset('typical-myope');
  expect(values.biometry.ata).not.toBe(INITIAL_VALUES.biometry.ata);
  renderPatient();

  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ana' } });
  choose('typical-myope');
  await waitFor(() => {
    expect(screen.getByRole('spinbutton', { name: ATA })).toHaveValue(
      values.biometry.ata
    );
  });

  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

  // back to empty, where every measured field starts (#196); an empty
  // number input reads as null
  expect(INITIAL_VALUES.biometry.ata).toBe('');
  await waitFor(() => {
    expect(screen.getByRole('spinbutton', { name: ATA })).toHaveValue(null);
  });
  expect(screen.getByLabelText('Name')).toHaveValue('');
  expect(combobox()).toHaveValue('');
});

it('offers "Choose…", then every preset in order', () => {
  renderPatient();

  const options = Array.from(
    // eslint-disable-next-line testing-library/no-node-access
    combobox().querySelectorAll('option')
  ).map((o) => [o.value, o.textContent]);
  expect(options).toEqual([
    ['', 'Choose…'],
    ...PRESETS.map((p) => [p.id, p.label])
  ]);
});

/*
 * Choosing is not loading. Chromium on Windows and Linux fires change while
 * a closed select is stepped through with the arrow keys, so a select that
 * applied on change would overwrite a clinician's measurements on one key.
 */
it('changes nothing until Load is pressed', async () => {
  renderPatient();
  fireEvent.change(screen.getByRole('spinbutton', { name: ATA }), {
    target: { value: '13.4' }
  });
  await waitFor(() => {
    expect(screen.getByRole('spinbutton', { name: ATA })).toHaveValue(13.4);
  });
  expect(loadButton()).toBeDisabled();

  select('typical-myope');

  expect(combobox()).toHaveValue('typical-myope');
  expect(loadButton()).toBeEnabled();
  // give any stray Formik update the chance to land before asserting
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(screen.getByRole('spinbutton', { name: ATA })).toHaveValue(13.4);
  expect(screen.getByRole('status')).toHaveTextContent('');
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
  const { container } = renderPatient();

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
    const { container } = renderPatient();

    choose('after-myopic-surgery');
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        `Loaded "${label}". Name, date of birth and eye were kept as entered.`
      );
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

it('clears the status on Reset', async () => {
  const { label } = preset('after-myopic-surgery');
  renderPatient();

  choose('after-myopic-surgery');
  await waitFor(() => {
    expect(screen.getByRole('status')).toHaveTextContent(label);
  });
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
  await waitFor(() => {
    expect(screen.getByRole('status')).toHaveTextContent('');
  });
});
