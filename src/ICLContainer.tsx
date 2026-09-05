import { Formik, FormikProps, FormikState } from 'formik';
import { ICLInputs, INITIAL_VALUES } from './types';
import { Route, HashRouter as Router, Routes } from 'react-router-dom';

import { Footer } from './misc/Footer';
import { ICLSchema } from './ICLSchema';
import { Matrix } from './matrix';
import { NavBar } from './misc/NavBar';
import { Normality } from './normality';
import { Patient } from './patient';
import { Regression } from './regression';
import { TabLinks } from './misc/TabLinks';
import { calcICLSphericalEquivalent } from './formulas';

const TabContent = ({
  errors,
  touched,
  values,
  ...otherProps
}: FormikState<ICLInputs>) => {
  const patientTab = (
    <Patient
      values={values}
      errors={errors}
      touched={touched}
      {...otherProps}
    />
  );

  return (
    <Routes>
      <Route
        path="/normality"
        element={
          <Normality
            ata={values.biometry.ata}
            clr={values.biometry.clr}
            acd={values.biometry.acd}
            aca={(values.biometry.acan + values.biometry.acat) / 2.0}
            wtw={values.biometry.wtw}
            age={values.patient.age()}
          />
        }
      />
      <Route
        path="/matrix"
        element={<Matrix ata={values.biometry.ata} clr={values.biometry.clr} />}
      />
      <Route
        path="/regression"
        element={
          <Regression
            acd={values.biometry.acd}
            ata={values.biometry.ata}
            clr={values.biometry.clr}
            se={calcICLSphericalEquivalent(values)}
            age={values.patient.age()}
          />
        }
      />
      {/*
        v5's <Switch> picked the first match and a bare path="/" matched
        everything, so an unknown hash fell through to Patient. v7's <Routes>
        ranks matches and path="/" matches only exactly, so the catch-all
        below is what restores that fallback - without it an unknown hash
        renders nothing at all. Both entries point at the same element.

        Precisely: this restores the fallback for unknown *top-level*
        routes, not v5's prefix matching. A v7 leaf route compiles with
        end=true, so "/matrix/extra" no longer reaches Matrix the way it
        did under v5 - it falls through to the splat and renders Patient.
        That is untested on purpose: TabLinks only ever emits the four
        exact single-segment paths, and v5 never produced a nested URL
        either, so no bookmark can hold one. Revisit only if a route ever
        gains children.
      */}
      <Route path="/" element={patientTab} />
      <Route path="*" element={patientTab} />
    </Routes>
  );
};

// Formik invokes its `children` render prop directly from its own render
// - `children(formikbag)` - not as a distinct React element, so this
// never gets its own Fiber and an inline arrow here would not be a
// component as far as the rules of hooks are concerned. It holds no
// hooks today, so that is moot; it stays a named component because it
// reads better than a 40-line arrow inline, and because anything added
// here later would need to know the above.
const FormContent = ({
  errors,
  touched,
  values,
  resetForm,
  ...otherProps
}: FormikProps<ICLInputs>) => {
  return (
    <>
      <NavBar resetForm={resetForm} />
      <div className="container">
        {/*
          Hash routing, not BrowserRouter: this deploys to GitHub Pages, which
          serves no SPA fallback, so a real path would 404 on reload. v7 dropped
          the hashType="noslash" prop this used to carry, so links now render as
          #/matrix rather than #matrix. Old bookmarks still resolve - v7's
          createHashHistory prefixes a missing leading slash - and normalise on
          the next click. See src/ICLContainer.test.tsx for the tests that hold
          that guarantee.
        */}
        <Router>
          <TabLinks />
          <hr />
          <TabContent
            values={values}
            errors={errors}
            touched={touched}
            {...otherProps}
          />
        </Router>
      </div>
      <Footer />
    </>
  );
};

export const ICLContainer = () => (
  <Formik
    initialValues={INITIAL_VALUES}
    validationSchema={ICLSchema}
    onSubmit={
      /* istanbul ignore next */
      () => {}
    }
  >
    {FormContent}
  </Formik>
);
