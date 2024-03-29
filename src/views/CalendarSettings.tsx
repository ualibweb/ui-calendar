import { ErrorBoundary } from "@folio/stripes-components";
import { Settings, SettingsProps } from "@folio/stripes-smart-components";
import React, { FunctionComponent } from "react";
import { FormattedMessage } from "react-intl";
import AllCalendarView from "./AllCalendarView";
import CurrentAssignmentView from "./CurrentAssignmentView";
import MonthlyCalendarPickerView from "./MonthlyCalendarPickerView";

export type CalendarSettingsProps = SettingsProps;

export const CalendarSettings: FunctionComponent<CalendarSettingsProps> = (
  props: CalendarSettingsProps
) => {
  return (
    <ErrorBoundary>
      <Settings
        {...props}
        navPaneWidth="30%"
        pages={[
          {
            route: "all/",
            label: <FormattedMessage id="ui-calendar.allCalendarView.title" />,
            component: props.stripes.connect(AllCalendarView, {
              dataKey: "ui-calendar",
            }),
            perm: "ui-calendar.view",
          },
          {
            route: "active/",
            label: (
              <FormattedMessage id="ui-calendar.currentAssignmentView.title" />
            ),
            component: props.stripes.connect(CurrentAssignmentView, {
              dataKey: "ui-calendar",
            }),
            perm: "ui-calendar.view",
          },
          {
            route: "monthly/",
            label: (
              <FormattedMessage id="ui-calendar.monthlyCalendarView.title" />
            ),
            component: props.stripes.connect(MonthlyCalendarPickerView, {
              dataKey: "ui-calendar",
            }),
            perm: "ui-calendar.view",
          },
        ]}
        paneTitle={<FormattedMessage id="ui-calendar.meta.title" />}
      />
    </ErrorBoundary>
  );
};

export default CalendarSettings;
