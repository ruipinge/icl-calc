import { Formik, FormikState } from 'formik';
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

const TabContent = ({
  errors,
  touched,
  values,
  ...otherProps
}: FormikState<ICLInputs>) => (
  <Switch>
    <Route path="/normality">
      <Normality />
    </Route>
    <Route path="/matrix">
      <Matrix
        ata={values.biometrics.ata}
        clr={values.biometrics.clr * 0.001} // CLR in Matrix is in millimetres
      />
    </Route>
    <Route path="/regression">
      <Regression />
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
