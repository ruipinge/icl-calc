import { Formik } from 'formik';
import { HashRouter as Router, NavLink, Route, Switch } from 'react-router-dom';
import { Footer } from './Footer';
import { ICLSchema } from './ICLSchema';
import { Matrix } from './matrix';
import { Normality } from './normality';
import { Patient } from './patient';
import { Regression } from './regression';
import { INITIAL_VALUES } from './types';

export const ICLContainer = () => {
  const initialValues = INITIAL_VALUES;

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={ICLSchema}
      onSubmit={
        /* istanbul ignore next */
        () => {}
      }
    >
      {({ errors, touched, values, resetForm, ...otherProps }) => (
        <>
          <nav className="navbar navbar-expand navbar-dark bg-dark fixed-top">
            <div className="container">
              <a className="navbar-brand" href={process.env.PUBLIC_URL || '/'}>
                ICL Size Calc
              </a>
              <form className="form-inline">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    resetForm();
                  }}
                >
                  Reset
                </button>
              </form>
            </div>
          </nav>
          <div className="container">
            <Router hashType="noslash">
              <ul className="nav nav-pills" style={{ marginBottom: '1rem' }}>
                <li className="nav-item">
                  <NavLink
                    exact={true}
                    className="nav-link"
                    activeClassName="active"
                    to="/"
                  >
                    Patient
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    exact={true}
                    className="nav-link"
                    activeClassName="active"
                    to="/normality"
                  >
                    Biometric Normality
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    exact={true}
                    className="nav-link"
                    activeClassName="active"
                    to="/matrix"
                  >
                    Floating Matrix
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    exact={true}
                    className="nav-link"
                    activeClassName="active"
                    to="/regression"
                  >
                    Regression
                  </NavLink>
                </li>
              </ul>
              <hr />
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
            </Router>
          </div>
          <Footer />
        </>
      )}
    </Formik>
  );
};
