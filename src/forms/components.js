import React from 'react';

import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Row from 'react-bootstrap/Row';


export const UnitInput = class UnitInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.defaultValue
    };

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.setState({
      value: event.target.value
    });
  }

  render() {
    const label = this.props.label,
      unit = this.props.unit,
      placeholder = this.props.placeholder,
      textAlign = this.props.placeholder || 'right';
    return (
      <Form.Group as={Row} controlId={this.props}>
        <Form.Label column sm="7">{label}</Form.Label>
        <Col sm="5">
          <InputGroup>
            <Form.Control type="text" className={'text-' + textAlign} value={this.state.value} onChange={this.handleChange} placeholder={placeholder} autoComplete="off" />
            {unit
              ? <InputGroup.Append>
                  <InputGroup.Text>{unit}</InputGroup.Text>
                </InputGroup.Append>
              : null
            }
          </InputGroup>
        </Col>
      </Form.Group>
    );
  };
};
