import { Formik, FormikState } from 'formik';
import { ICLInputs, INITIAL_VALUES } from './types';
import { Route, HashRouter as Router, Switch } from 'react-router-dom';

import { Footer } from './misc/Footer';
import GA from './misc/GoogleAnalytics';
import { ICLSchema } from './ICLSchema';
import { Matrix } from './matrix';
import { NavBar } from './misc/NavBar';
import { Normality } from './normality';
import { Patient } from './patient';
import { Regression } from './regression';
import { TabLinks } from './misc/TabLinks';
import { calcIclSphericalEquivalent } from './formulas';

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
        se={calcIclSphericalEquivalent({
          sphere: values.spectacleRefraction.sphere,
          cylindre: values.spectacleRefraction.cylindre
        })}
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

export const ICLContainer = () => (
  <Formik
    initialValues={INITIAL_VALUES}
    validationSchema={ICLSchema}
    onSubmit={
      /* istanbul ignore next */
      () => {}
    }
  >
    {({ errors, touched, values, resetForm, ...otherProps }) => (
      <>
        <NavBar resetForm={resetForm} />
        <div className="container">
          {GA.init()}
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
    )}
  </Formik>
);
