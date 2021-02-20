import React from 'react';

import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';


class PatientForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      dateOfBirth: undefined,
      age: undefined
    };

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState({
      value: event.target.value
    });
  }

  render() {
    return (
      <>
        <h2>Patient</h2>

         <Form.Row>
          <Form.Group as={Col} md="4" controlId="formGridName">
            <Form.Label>Name</Form.Label>
            <Form.Control placeholder="enter patient name" autoComplete="off" />
          </Form.Group>
          <Form.Group as={Col} md={{span: 2, offset: 1}} controlId="formGridDateOfBirth">
            <Form.Label>Date of Birth</Form.Label>
            <Form.Control placeholder="yyyy-mm-dd" autoComplete="off" />
          </Form.Group>
          <Form.Group as={Col} md={{span: 1, offset: 1}} controlId="formGridAge">
            <Form.Label>Age</Form.Label>
            <Form.Control autoComplete="off" />
          </Form.Group>
          <Form.Group as={Col} md={{span: 2, offset: 1}} controlId="formGridEye">
            <Form.Label>Eye</Form.Label>
            <Form.Control as="select" defaultValue="Select...">
              <option>Select...</option>
              <option>Left</option>
              <option>Right</option>
            </Form.Control>
          </Form.Group>
        </Form.Row>
      </>
    );
  }
};

export default PatientForm;
