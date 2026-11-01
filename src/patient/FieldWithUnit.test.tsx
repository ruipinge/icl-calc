import { render, screen } from '@testing-library/react';

import { FieldWithUnit } from './FieldWithUnit';
import { Formik } from 'formik';

/*
 * Issue #129. FieldWithUnit's <label> carries htmlFor={name + 'field'}, but
 * neither branch of the component set that id, so the label was associated
 * with nothing and 23 of the 27 inputs on the Patient tab announced to a
 * screen reader unlabelled.
 *
 * It went unnoticed for years while being recorded in full: the
 * ICLContainer snapshot serialises 138 for="...field" attributes across its
 * nine renders and asserts nothing about any of them. These tests are the
 * assertion the snapshot never made, so they must query the way an
 * assistive technology resolves a control - by accessible name - and never
 * by id, name or DOM traversal. Querying by id here would pass against a
 * label pointing anywhere at all, which is the original defect.
 */

const renderField = (
  props: Partial<Parameters<typeof FieldWithUnit>[0]> = {}
) =>
  render(
    <Formik initialValues={{ biometry: { ata: 11.7 } }} onSubmit={() => {}}>
      <FieldWithUnit
        label="AtA"
        caption="Angle to Angle"
        name="biometry.ata"
        unit="mm"
        {...props}
      />
    </Formik>
  );

it('associates the label with the editable input', () => {
  renderField();

  // getByLabelText matches the label's textContent, which also carries the
  // aria-hidden visible copy, so this anchors on the sr-only name's tail.
  expect(
    screen.getByLabelText(/AtA \(mm\), Angle to Angle, millimetres$/)
  ).toHaveValue(11.7);
});

/*
 * #192: the name opens with the visible label word for word, so a speech
 * user can say what they see (WCAG 2.5.3), then the caption, then the unit
 * spelled out.
 */
it('gives the editable input an accessible name', () => {
  renderField();

  expect(
    screen.getByRole('spinbutton', {
      name: 'AtA (mm), Angle to Angle, millimetres'
    })
  ).toHaveValue(11.7);
});

/*
 * The disabled branch is a plain <input>, not a Formik <Field>, and renders
 * a computed result rather than an entry field - ICLPower's four outputs use
 * it. It needs the same association: a value a clinician reads is no less in
 * need of a label than one they type.
 */
it('associates the label with the disabled input', () => {
  renderField({
    label: 'Sphere',
    caption: undefined,
    name: 'iclSphere',
    unit: 'dpt',
    disabled: true,
    value: -8.5
  });

  expect(screen.getByLabelText(/Sphere \(dpt\), dioptres$/)).toHaveValue(
    '-8.5'
  );
  expect(screen.getByLabelText(/Sphere \(dpt\), dioptres$/)).toBeDisabled();
});

it('shows the short name with its unit in brackets, hidden from the tree', () => {
  renderField({
    label: 'WtW',
    caption: 'White to White',
    name: 'biometry.wtw'
  });

  expect(
    screen.getByRole('spinbutton', {
      name: 'WtW (mm), White to White, millimetres'
    })
  ).toBeInTheDocument();
  expect(screen.getByText('WtW (mm)')).toHaveAttribute('aria-hidden', 'true');
});

/*
 * The full name is on screen, not in a tooltip: there is no hover on a touch
 * screen, in gloves or from a keyboard. It is inside the label, so a tap on
 * it focuses the input, and out of the tree, since the name already says it.
 */
it('shows the full name as a caption inside the label', () => {
  renderField();

  const caption = screen.getByText('Angle to Angle');
  expect(caption).toBeVisible();
  expect(caption).toHaveClass('mcaption');
  expect(caption).toHaveAttribute('aria-hidden', 'true');
  // eslint-disable-next-line testing-library/no-node-access
  expect(caption.closest('label')).toHaveAttribute('for', 'biometry.atafield');
});

it('shows no caption, and names none, when there is none', () => {
  const { container } = renderField({
    label: 'Vertex',
    caption: undefined,
    name: 'spectacleRefraction.vertex'
  });

  expect(
    screen.getByRole('spinbutton', { name: 'Vertex (mm), millimetres' })
  ).toBeInTheDocument();
  // the caption's class is the only hook the stylesheet has; no role exposes it
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
  expect(container.querySelector('.mcaption')).toBeNull();
});

it('uses srLabel in place of the visible label, and shows the label as given', () => {
  renderField({
    label: '@',
    caption: undefined,
    srLabel: 'Anterior Keratometry Flat axis',
    name: 'corneaProfile.axisaf',
    unit: 'º'
  });
  expect(
    screen.getByRole('spinbutton', {
      name: 'Anterior Keratometry Flat axis, degrees'
    })
  ).toBeInTheDocument();
  expect(screen.queryByRole('spinbutton', { name: /^@/ })).toBeNull();
  expect(screen.getByText('@')).toHaveAttribute('aria-hidden', 'true');
});

it('appends the qualifier to the name only', () => {
  renderField({
    label: 'Sphere',
    caption: undefined,
    qualifier: ' (ICL power)',
    name: 'iclSphere',
    unit: 'dpt',
    disabled: true,
    value: -8.5
  });
  expect(
    screen.getByRole('textbox', { name: 'Sphere (dpt) (ICL power), dioptres' })
  ).toBeDisabled();
  expect(screen.getByText('Sphere (dpt)')).toBeVisible();
});

it('names a captioned, qualified field label, caption, qualifier, unit', () => {
  renderField({
    label: 'SE',
    caption: 'Spherical Equivalent',
    qualifier: ' (ICL power)',
    name: 'iclSphericalEquivalent',
    unit: 'dpt',
    disabled: true,
    value: -8.5
  });
  expect(
    screen.getByRole('textbox', {
      name: 'SE (dpt), Spherical Equivalent (ICL power), dioptres'
    })
  ).toBeDisabled();
});

it('marks an invalid, touched field and points at its message', () => {
  renderField({ error: 'Too small', touched: true });
  const input = screen.getByRole('spinbutton');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription('Too small');
});

it('references no message when there is no error', () => {
  renderField();
  const input = screen.getByRole('spinbutton');
  expect(input).not.toHaveAttribute('aria-describedby');
  expect(input).not.toHaveAttribute('aria-invalid');
});

it('keeps the name attribute L2 addresses', () => {
  renderField();
  expect(screen.getByRole('spinbutton')).toHaveAttribute(
    'name',
    'biometry.ata'
  );
});

it('keeps the id the label points at', () => {
  renderField();
  expect(screen.getByRole('spinbutton')).toHaveAttribute(
    'id',
    'biometry.atafield'
  );
});

it('puts labelClassName on the label', () => {
  const { container } = renderField({
    label: '@',
    srLabel: 'Axis',
    name: 'a',
    unit: 'º',
    labelClassName: 'kat'
  });
  // the label's class is the only hook the stylesheet has; no role exposes it
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
  expect(container.querySelector('label')).toHaveClass('kat');
});

it('leaves a plain label without a class', () => {
  const { container } = renderField();
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
  expect(container.querySelector('label')).not.toHaveAttribute('class');
});

it('shows no message for an untouched field', () => {
  renderField({ error: 'Bad' });
  expect(screen.queryByText('Bad')).toBeNull();
});

/*
 * The row's cells, in order: the label, the input itself - no wrapper and no
 * unit mark beside it, since the unit is in the label (#192) - and, while it
 * shows, the message, a line of its own across the whole row (#195).
 */
const cellName = (el: Element): string => {
  if (el.classList.contains('mrow-error')) {
    return 'message';
  }
  const tag = el.tagName.toLowerCase();
  return el.className ? `${tag}.${el.className}` : tag;
};

const row = (container: HTMLElement) =>
  // the row is the only hook the stylesheet has; no role exposes it
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
  container.querySelector('.mrow');

const rowChildren = (container: HTMLElement) =>
  // eslint-disable-next-line testing-library/no-node-access
  [...(row(container)?.children ?? [])].map(cellName);

it('puts the message after the input, as a cell of the row', () => {
  const { container } = renderField({ error: 'Too small', touched: true });

  expect(rowChildren(container)).toEqual(['label', 'input', 'message']);
  expect(screen.getByRole('spinbutton')).toHaveAccessibleDescription(
    'Too small'
  );
});

it('lays a row out as its label and its input alone, with no unit mark', () => {
  const { container } = renderField({ error: 'Too small' });

  expect(rowChildren(container)).toEqual(['label', 'input']);
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
  expect(container.querySelector('.unit')).toBeNull();
});

it("shows a plain row's message without a prefix", () => {
  renderField({ error: 'Too small', touched: true });

  const message = screen.getByText('Too small');
  // eslint-disable-next-line testing-library/no-node-access
  expect(message.closest('.mrow-error')).toHaveTextContent(/^Too small$/);
});

/* The row tells the stylesheet a message shows, so its cells hand it 0.6rem */
it('flags the row while its message shows', () => {
  const { container } = renderField({ error: 'Too small', touched: true });

  expect(row(container)).toHaveAttribute('data-message');
});

it('leaves a row without a message unflagged', () => {
  const { container } = renderField({ error: 'Too small' });

  expect(row(container)).not.toHaveAttribute('data-message');
});

/*
 * A message wraps to the width of its row; the stylesheet keeps a range from
 * breaking inside its brackets by holding it in its own span. The
 * description a screen reader announces is the message, unchanged.
 */
it('keeps a range whole in its own element, and the description unchanged', () => {
  renderField({ error: 'Invalid value. [30, 55]', touched: true });

  expect(screen.getByRole('spinbutton')).toHaveAccessibleDescription(
    'Invalid value. [30, 55]'
  );
  expect(screen.getByText('[30, 55]').tagName).toBe('SPAN');
  expect(screen.getByText('[30, 55]')).toHaveClass('mrow-range');
});
