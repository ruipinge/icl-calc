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
const choose = (id: string) =>
  fireEvent.change(combobox(), { target: { value: id } });
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
  // age() is a PatientInfo method: losing the instance would show 0
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

it.each(['typical-myope', 'after-myopic-surgery', 'larger-segment'])(
  'applies every field of %s',
  async (id) => {
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
  }
);

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

  await waitFor(() => {
    expect(screen.getByRole('spinbutton', { name: ATA })).toHaveValue(
      INITIAL_VALUES.biometry.ata
    );
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
 * The select always shows "Choose…", so a browser fires change for it only
 * if the control had drifted to a case first. Simulated by moving the DOM
 * value directly, so React's tracker sees '' as a change: nothing applies.
 */
it('applies nothing when "Choose…" is chosen', async () => {
  renderPatient();
  fireEvent.change(screen.getByRole('spinbutton', { name: ATA }), {
    target: { value: '13.4' }
  });
  await waitFor(() => {
    expect(screen.getByRole('spinbutton', { name: ATA })).toHaveValue(13.4);
  });

  const select = combobox() as HTMLSelectElement;
  select.value = 'typical-myope';
  choose('');

  expect(screen.getByRole('spinbutton', { name: ATA })).toHaveValue(13.4);
  expect(combobox()).toHaveValue('');
});
