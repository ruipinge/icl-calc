import React from 'react';
import { useRecoilState } from 'recoil'

import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';

import { patientState } from '../state'


function PatientForm() {
  const [val, setVal] = useRecoilState(patientState);

  const onChange = (ev) => {
    setVal((v) => {
      const a = {...v};
      a[ev.target.name] = ev.target.value;
      return a
    });
  };

  return (
    <>
      <h2>Patient</h2>

       <Form.Row>
        <Form.Group as={Col} md="4" controlId="formGridName">
          <Form.Label>Name</Form.Label>
          <Form.Control value={val.name} name="name" onChange={onChange} placeholder="enter patient name" autoComplete="off" />
        </Form.Group>
        <Form.Group as={Col} md={{span: 2, offset: 1}} controlId="formGridDateOfBirth">
          <Form.Label>Date of Birth</Form.Label>
          <Form.Control placeholder="yyyy-mm-dd" name="dateOfBirth" onChange={onChange} autoComplete="off" />
        </Form.Group>
        <Form.Group as={Col} md={{span: 1, offset: 1}} controlId="formGridAge">
          <Form.Label>Age</Form.Label>
          <Form.Control autoComplete="off" name="age" onChange={onChange} />
        </Form.Group>
        <Form.Group as={Col} md={{span: 2, offset: 1}} controlId="formGridEye">
          <Form.Label>Eye</Form.Label>
          <Form.Control as="select" defaultValue="Select..." name="eye" onChange={onChange}>
            <option value="">Select...</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </Form.Control>
        </Form.Group>
      </Form.Row>
    </>
  );
};

export default PatientForm;
