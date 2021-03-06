import React, { useState } from 'react';

import { ICLForm, ICLInputs } from './ICLForm';

const setStatus = (a: any) => console.log(a);

export const ICLContainer = () => {
  const initialValues: ICLInputs = {
    patient: {
      name: '',
      dateOfBirth: '',
      eye: 'left'
    },
    biometrics: {
      ata: 0,
      wtw: 0,
      clr: 0,
      acq: 0,
      acan: 0,
      acat: 0,
      kf: 0,
      cct: 0
    },
    spectacleRefraction: {
      sphere: 0,
      cylindre: 0,
      axis: 0,
      vertex: 0
    }
  };

  const [val, setVal] = useState(0);

  return (
    <>
      <nav className="navbar navbar-expand navbar-dark bg-dark fixed-top">
        <div className="container">
          <a className="navbar-brand" href="#">
            ICL Size Calc
          </a>
          <ul className="navbar-nav mr-auto">
            {/*
            <li class="nav-item active">
              <a class="nav-link" href="#home">Home <span class="sr-only">(current)</span></a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">Link</a>
            </li>
            */}
          </ul>
          <form className="form-inline">
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                setVal((state) => state + 1);
              }}
            >
              Reset
            </button>
          </form>
        </div>
      </nav>
      <div className="container">
        <ICLForm
          initialValues={initialValues}
          key={val}
          setStatus={setStatus}
        />
      </div>
    </>
  );
};
