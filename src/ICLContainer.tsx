import { Formik, FormikProps, FormikState } from 'formik';
import { ICLInputs, INITIAL_VALUES } from './types';
import { Route, HashRouter as Router, Switch } from 'react-router-dom';

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
}: FormikState<ICLInputs>) => (
  <Switch>
    <Route path="/normality">
      <Normality
        ata={values.biometry.ata}
        clr={values.biometry.clr}
        acd={values.biometry.acd}
        aca={(values.biometry.acan + values.biometry.acat) / 2.0}
        wtw={values.biometry.wtw}
        age={values.patient.age()}
      />
    </Route>
    <Route path="/matrix">
      <Matrix ata={values.biometry.ata} clr={values.biometry.clr} />
    </Route>
    <Route path="/regression">
      <Regression
        acd={values.biometry.acd}
        ata={values.biometry.ata}
        clr={values.biometry.clr}
        se={calcICLSphericalEquivalent(values)}
        age={values.patient.age()}
      />
    </Route>
    <Route path="/">
      <Patient
        values={values}
        errors={errors}
        touched={touched}
        {...otherProps}
      />
    </Route>
  </Switch>
);

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
        <Router hashType="noslash">
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
