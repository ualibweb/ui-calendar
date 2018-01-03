import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { FormattedDate } from 'react-intl';
import { Row, Col } from '@folio/stripes-components/lib/LayoutGrid';

function padNumber(param) {
  return (param > 9) ? param : `0${param}`;
}

function ViewOpeningDay(props) {
  const openingDays = props.initialValues;

  return (
    <div>
      <section>
        <Row>
          <Col xs={12}><h2 style={{ marginTop: '0' }}>Opening day</h2></Col>
        </Row>
        <Row>
          <Col xs={4}><h4>Start date</h4></Col>
          <Col xs={4}><h4>End date</h4></Col>
        </Row>
        <Row>
          <Col xs={4}><FormattedDate value={openingDays.startDate} /></Col>
          <Col xs={4}><FormattedDate value={openingDays.endDate} /></Col>
        </Row>
        <Row>
          <Col xs={4}><h4>Opening day</h4></Col>
          <Col xs={4}><h4>Opening start</h4></Col>
          <Col xs={4}><h4>Opening end</h4></Col>
        </Row>
        {openingDays.openingDays.map((openingDay, index) =>
          (<Row key={index}>
            <Col xs={4}>{openingDay.day}</Col>
            <Col xs={4}>{`${padNumber(openingDay.startHour)}:${padNumber(openingDay.startMinute)}`}</Col>
            <Col xs={4}>{`${padNumber(openingDay.endHour)}:${padNumber(openingDay.endMinute)}`}</Col>
          </Row>),
        )}
      </section>
    </div>
  );
}

ViewOpeningDay.propTypes = {
  initialValues: PropTypes.object,
};

export default ViewOpeningDay;