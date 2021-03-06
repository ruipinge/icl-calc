import React from 'react';

import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import { PingeForm, ICLForm } from './Form';

const renderICLPower = (param1: boolean) => <div>renderICLPower: {param1}</div>;

export const FormContainer = () => {
  const initialValues: ICLForm = {
    patient: {
      name: '',
      age: -1,
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

  return (
    <>
      <Navbar bg="dark" variant="dark" fixed="top">
        <Container>
          <Navbar.Brand href="#">ICL Size Calc</Navbar.Brand>
          <Nav className="mr-auto">
            {/*<Nav.Link href="#home">Home</Nav.Link>
          <Nav.Link href="#features">Features</Nav.Link>
          <Nav.Link href="#pricing">Pricing</Nav.Link>*/}
          </Nav>
          <Form inline>
            <Button variant="danger">Reset</Button>
          </Form>
        </Container>
      </Navbar>
      <Container>
        <PingeForm initialValues={initialValues} setStatus={renderICLPower} />
      </Container>
    </>
  );
};
