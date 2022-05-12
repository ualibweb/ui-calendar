import dayjs from "dayjs";
import calendarPlugin from "dayjs/plugin/calendar";
import devHelper from "dayjs/plugin/devHelper";
import localizedFormat from "dayjs/plugin/localizedFormat";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

const dayjsCal = dayjs
  .extend(calendarPlugin)
  // .extend(devHelper)
  .extend(isBetween)
  .extend(isSameOrAfter)
  .extend(isSameOrBefore)
  .extend(localizedFormat);

export const WEEKDAYS = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};
export const WEEKDAY_INDEX = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];
export const WEEKDAY_STRINGS = {
  SUNDAY: "Sunday",
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
};

export function getWeekdayIndexRange(start, end) {
  let startIndex = WEEKDAYS[start];
  const endIndex = WEEKDAYS[end];

  const days = [startIndex];
  while (startIndex != endIndex) {
    startIndex = (startIndex + 1) % 7;
    days.push(startIndex);
  }

  return days;
}

export function getWeekdayRange(start, end) {
  return getWeekdayIndexRange(start, end).map((i) => WEEKDAY_INDEX[i]);
}

export function getRelativeDateTime(date, referenceDate) {
  return dayjsCal(dayjs(date).toISOString()).calendar(referenceDate, {
    sameDay: "[at] LT",
    nextDay: "[tomorrow at] LT",
    nextWeek: "dddd [at] LT",
    sameElse: "L",
  });
}

export function getRelativeWeekdayTime(weekday, time, referenceDate) {
  if (referenceDate.day() === WEEKDAYS[weekday]) {
    return `${time}`;
  }
  if ((referenceDate.day() + 1) % 7 === WEEKDAYS[weekday]) {
    return `tomorrow at ${time}`;
  }
  return `${WEEKDAY_STRINGS[weekday]} at ${time}`;
}

function weekdayIsBetween(testWeekdayNumber, start, end) {
  let startIndex = WEEKDAYS[start];
  let endIndex = WEEKDAYS[end];

  // handles wraparounds, eg FRI (5) -> MON (1) converts to FRI (5) -> MON (8)
  // ensures startIndex <= endIndex
  if (startIndex > endIndex) {
    endIndex += 7;
  }
  // potentially shifts the bounds by a week to handle examples like above, if SUN (0) is queried
  if (startIndex > testWeekdayNumber) {
    startIndex -= 7;
    endIndex -= 7;
  }

  return startIndex <= testWeekdayNumber && testWeekdayNumber <= endIndex;
}

function getDateMatches(testDate, calendar) {
  const openings = calendar.openings.filter((opening) =>
    weekdayIsBetween(testDate.day(), opening.startDay, opening.endDay)
  );
  const exceptions = calendar.exceptions.filter((exception) =>
    testDate.isBetween(
      dayjs(exception.startDate),
      dayjs(exception.endDate),
      "day",
      "[]"
    )
  );
  return { openings, exceptions };
}

function getCurrentExceptionalOpening(testDateTime, exception) {
  for (const opening of exception.openings) {
    if (
      testDateTime.isBetween(
        `${opening.startDate} ${opening.startTime}`,
        `${opening.endDate} ${opening.endTime}`,
        "minute",
        "[]"
      )
    ) {
      return opening;
    }
  }
  return null;
}

function getNextExceptionalOpening(testDateTime, exception) {
  let min = null;
  let minDate = null;
  for (const opening of exception.openings) {
    if (
      testDateTime.isSame(`${opening.startDate}`, "day") &&
      testDateTime.isBefore(
        `${opening.startDate} ${opening.startTime}`,
        "minute"
      ) &&
      (min === null ||
        minDate.isAfter(`${opening.startDate} ${opening.startTime}`))
    ) {
      min = opening;
      minDate = `${opening.startDate} ${opening.startTime}`;
    }
  }
  return min;
}

function getExceptionalStatus(testDateTime, exception) {
  // fully closed exception
  if (exception.openings.length === 0) {
    return `Closed (${exception.name})`;
  }

  const currentOpening = getCurrentExceptionalOpening(testDateTime, exception);
  // not currently open
  if (currentOpening === null) {
    const nextOpening = getNextExceptionalOpening(testDateTime, exception);
    // no future openings in exception
    if (nextOpening === null) {
      return `Closed (${exception.name})`;
    } else {
      // future opening found
      return `Closed (${exception.name}), opening ${getRelativeDateTime(
        `${nextOpening.startDate} ${nextOpening.startTime}`,
        testDateTime
      )}`;
    }
  } else {
    // currently open
    return `Open (${exception.name}), closing ${getRelativeDateTime(
      `${currentOpening.endDate} ${currentOpening.endTime}`,
      testDateTime
    )}`;
  }
}

function getCurrentNormalOpening(testDateTime, openings) {
  const currentWeekday = testDateTime.day();
  for (const opening of openings) {
    const startWeekday = WEEKDAYS[opening.startDay];
    const endWeekday = WEEKDAYS[opening.endDay];
    //ok
    const startTimeRel = dayjs(
      `${testDateTime.format("YYYY-MM-DD")} ${opening.startTime}`
    );
    const endTimeRel = dayjs(
      `${testDateTime.format("YYYY-MM-DD")} ${opening.endTime}`
    );

    // between both ends
    if (currentWeekday !== startWeekday && currentWeekday !== endWeekday) {
      return opening;
    }
    // first day of interval
    if (
      currentWeekday === startWeekday &&
      currentWeekday !== endWeekday &&
      testDateTime.isSameOrAfter(startTimeRel)
    ) {
      return opening;
    }
    // last day of interval
    if (
      currentWeekday !== startWeekday &&
      currentWeekday === endWeekday &&
      testDateTime.isSameOrBefore(endTimeRel)
    ) {
      return opening;
    }

    // single-day interval
    if (
      currentWeekday === startWeekday &&
      currentWeekday === endWeekday &&
      testDateTime.isSameOrAfter(startTimeRel) &&
      testDateTime.isSameOrBefore(endTimeRel)
    ) {
      return opening;
    }
  }
  return null;
}

function getNextNormalOpening(testDateTime, openings) {
  let min = null;
  let minDate = null;

  // no need to handle the potential for the next one being before the current day
  // therefore, we only check startDay = current day and minimize startDay within that subset
  for (const opening of openings) {
    if (
      WEEKDAYS[opening.startDay] == testDateTime.day() &&
      (min === null ||
        minDate.isAfter(
          `${testDateTime.format("YYYY-MM-DD")} ${opening.startTime}`
        ))
    ) {
      min = opening;
      minDate = `${testDateTime.format("YYYY-MM-DD")} ${opening.startTime}`;
    }
  }

  return min;
}

function getNormalOpeningStatus(testDateTime, openings) {
  // no openings on that day
  if (openings.length === 0) {
    return `Closed`;
  }

  const currentOpening = getCurrentNormalOpening(testDateTime, openings);
  // not currently open
  if (currentOpening === null) {
    const nextOpening = getNextNormalOpening(testDateTime, openings);
    // no future openings that day
    if (nextOpening === null) {
      return `Closed`;
    } else {
      // future opening found
      return `Closed, opening ${getRelativeWeekdayTime(
        nextOpening.startDay,
        nextOpening.startTime,
        testDateTime
      )}`;
    }
  } else {
    // currently open
    return `Open until ${getRelativeWeekdayTime(
      currentOpening.endDay,
      currentOpening.endTime,
      testDateTime
    )}`;
  }
}

// this function will not consider things more than one day away, unless currently in an opening
export function getStatus(testDateTime, calendar) {
  const { openings, exceptions } = getDateMatches(testDateTime, calendar);

  if (exceptions.length !== 0) {
    return getExceptionalStatus(testDateTime, exceptions[0]);
  }
  return getNormalOpeningStatus(testDateTime, openings);
}
