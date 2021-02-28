import React from 'react';

import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import { PingeForm, FormValues } from './Form';


const renderICLPower = ( param1: boolean ) => (
  <div>renderICLPower: {param1}</div>
);

const App = () => {
  const initialValues: FormValues = {
    name: '',
    age: -1,
    dateOfBirth: '',
    eye: 'left',

    // Biometrics:
    ata: 0,
    wtw: 0,
    clr: 0,
    acp: 0,
    acan: 0,
    acat: 0,
    kfm: 0,
    cct: 0,

    // Spectacle Refraction
    sphere: 0,
    cylinder: 0,
    axis: 0,
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
        <PingeForm
          initialValues={initialValues}
          setStatus={renderICLPower}
        />
      </Container>
    </>
  );
};

export default App;
