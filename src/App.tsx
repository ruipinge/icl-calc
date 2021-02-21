import React from 'react';

import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';

import { Pinge } from './forms/Pinge';


interface FormValuesType {
  name: string;
  age: number;
  dateOfBirth: string;
  eye: 'left' | 'right';

  // Biometrics:
  ata: number;
  wtw: number;
  clr: number;
  acp: number;
  acan: number;
  acat: number;
  kfm: number;
  cct: number;
}


// function FullForm()  extends React.Component {

//   constructor(props) {
//     super(props);
//     this.state = {};

//     this.handleSubmit = this.handleSubmit.bind(this);
//   }

//   handleSubmit(event) {
//     alert('An essay was submitted: ' + this.state.value);
//     event.preventDefault();
//   }

//   render() {
//     return (
//       <Form onSubmit={this.handleSubmit}>
//         <Row>
//           <Col md="12">
//             <PatientForm />
//           </Col>
//         </Row>
//         <hr />
//         <Row>
//           <Col md={{ span: 3 }}>
//             <BiometricsForm />
//           </Col>
//           <Col md={{ span: 3, offset: 1 }}>
//             <SpectacleRefractionForm />
//           </Col>
//           <Col md={{ span: 3, offset: 1 }}>
//             <ICLPowerForm />
//           </Col>
//         </Row>
// {/*
//         <hr />
//         <Row>
//           <Col>
//             <Button variant="primary" type="submit" value="Submit">Calculate</Button>
//           </Col>
//         </Row>
// */}
//       </Form>
//     );
//   }
// };

const renderICLPower = ({ param1 }: { param1: string }) => (
  <div>renderICLPower: {param1}</div>
);

const App = () => {
  const initialValues: FormValuesType = {
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
        <Pinge
          initialValues={initialValues}
          renderICLPower={renderICLPower}
        />
      </Container>
    </>
  );
};

export default App;
