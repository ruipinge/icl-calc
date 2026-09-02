import { Formik, FormikProps, FormikState } from 'formik';
import { ICLInputs, INITIAL_VALUES } from './types';
import {
  Route,
  HashRouter as Router,
  Switch,
  useLocation
} from 'react-router-dom';

import { Footer } from './misc/Footer';
import GA from './misc/GoogleAnalytics';
import { ICLSchema } from './ICLSchema';
import { Matrix } from './matrix';
import { NavBar } from './misc/NavBar';
import { Normality } from './normality';
import { Patient } from './patient';
import { Regression } from './regression';
import { TabLinks } from './misc/TabLinks';
import { calcICLSphericalEquivalent } from './formulas';
import { useEffect } from 'react';

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

// Sends a GA4 pageview whenever the active tab changes. Mounted inside
// <Router> below so `useLocation` sees the four tab routes (/, /normality,
// /matrix, /regression) - this is a hash-router SPA, so a tab switch is
// never a full page load and would otherwise never be tracked at all,
// same as it never was under the old Universal Analytics integration.
//
// #49 upgrades react-router-dom 5 -> 7, which changes this import (and
// possibly useLocation's behaviour) - that issue needs to update this.
const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    GA.pageview(location.pathname);
  }, [location.pathname]);

  return null;
};

// Formik invokes its `children` render prop directly from its own render,
// not as a distinct React element - an inline arrow function there is not
// a component as far as the rules of hooks are concerned, so this is
// pulled out as a named component instead. That's what lets the mount
// effect below live here rather than back inside JSX.
const FormContent = ({
  errors,
  touched,
  values,
  resetForm,
  ...otherProps
}: FormikProps<ICLInputs>) => {
  // Runs once on mount rather than as a side effect during render - see
  // src/misc/GoogleAnalytics.ts for why this is a no-op unless
  // VITE_GA_MEASUREMENT_ID is configured.
  useEffect(() => {
    GA.init();
  }, []);

  return (
    <>
      <NavBar resetForm={resetForm} />
      <div className="container">
        <Router hashType="noslash">
          <RouteTracker />
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
