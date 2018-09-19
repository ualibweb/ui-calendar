import React from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';

class CalendarUtils extends React.Component {
  static translate(id) {
    return <FormattedMessage id={id} />;
  }

  static translateToString(id, intl) {
    return intl.formatMessage({
      id: `${id}`
    });
  }

  static convertNewPeriodToValidBackendPeriod(period, event) {
    const weekDays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    let weekDay = 8;
    let openingHour = [];
    let sortedEvents = [];
    if (event) {
      sortedEvents = event.sort((a, b) => {
        return (a.start > b.start) ? 1 : ((b.start > a.start) ? -1 : 0);
      });
    }
    for (let i = 0; i < sortedEvents.length; i++) {
      const dayOpening = sortedEvents[i];
      if (dayOpening.start instanceof moment) {
        dayOpening.start = moment(dayOpening.start).toDate();
        dayOpening.end = moment(dayOpening.end).toDate();
      }
      if (weekDay !== dayOpening.start.getDay()) {
        weekDay = dayOpening.start.getDay();
        openingHour = [];
        if (dayOpening.allDay) {
          period.openingDays.push({
            weekdays: {
              day: weekDays[weekDay],
            },
            openingDay: {
              allDay: dayOpening.allDay,
              open: true
            }
          });
        } else {
          period.openingDays.push({
            weekdays: {
              day: weekDays[weekDay],
            },
            openingDay: {
              openingHour,
              allDay: dayOpening.allDay,
              open: true
            }
          });
        }
      }
      openingHour.push({
        startTime: dayOpening.start.getHours() + ':' + dayOpening.start.getMinutes(),
        endTime: dayOpening.end.getHours() + ':' + dayOpening.end.getMinutes()
      });
    }
    return period;
  }
}

export default CalendarUtils;
