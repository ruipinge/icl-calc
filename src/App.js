import React from 'react';
import { RecoilRoot } from 'recoil'

import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';

import BiometricsForm from './forms/Biometrics';
import ICLPowerForm from './forms/ICLPower';
import PatientForm from './forms/Patient';
import SpectacleRefractionForm from './forms/SpectacleRefraction';


class FullForm extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {
    alert('An essay was submitted: ' + this.state.value);
    event.preventDefault();
  }

  render() {
    return (
      <Form onSubmit={this.handleSubmit}>
        <Row>
          <Col md="12">
            <PatientForm />
          </Col>
        </Row>
        <hr />
        <Row>
          <Col md={{ span: 3 }}>
            <BiometricsForm />
          </Col>
          <Col md={{ span: 3, offset: 1 }}>
            <SpectacleRefractionForm />
          </Col>
          <Col md={{ span: 3, offset: 1 }}>
            <ICLPowerForm />
          </Col>
        </Row>
{/*
        <hr />
        <Row>
          <Col>
            <Button variant="primary" type="submit" value="Submit">Calculate</Button>
          </Col>
        </Row>
*/}
      </Form>
    );
  }
};

const App = () => (
  <>
  <RecoilRoot>
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
      <FullForm />
    </Container>
  </RecoilRoot>
  </>
);

export default App;
