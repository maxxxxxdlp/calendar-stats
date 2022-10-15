import { useAsyncState } from '../../hooks/useAsyncState';
import { ajax } from '../../utils/ajax';
import React from 'react';
import { filterArray, GetOrSet, RA } from '../../utils/types';
import { formatUrl } from '../../utils/queryString';
import { sortFunction, split, toggleItem } from '../../utils/utils';
import { listen } from '../../utils/events';
import { AuthContext } from './AuthContext';
import {
  generateBackground,
  generateBorder,
  hexToRgb,
  randomColor,
  rgbToString,
} from '../../utils/colors';

type RawCalendarListEntry = Pick<
  gapi.client.calendar.CalendarListEntry,
  'id' | 'summary' | 'primary' | 'backgroundColor'
>;

type CalendarListEntry = Omit<RawCalendarListEntry, 'backgroundColor'> & {
  readonly shortId: number;
  readonly backgroundColor: string;
  readonly borderColor: string;
};

const calendarIdResolver: Set<string> = new Set();

export function CalendarsSpy({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element {
  const { authenticated } = React.useContext(AuthContext);
  const [calendars] = useAsyncState<
    RA<CalendarListEntry & { readonly shortId: number }>
  >(
    React.useCallback(async () => {
      if (!authenticated) return undefined;
      const response = await ajax(
        formatUrl(
          'https://www.googleapis.com/calendar/v3/users/me/calendarList',
          {
            minAccessRole: 'reader',
            fields: 'items(id,summary,primary,backgroundColor)',
            prettyPrint: false.toString(),
          }
        )
      );
      const results = await response.json();
      const rawCalendars = results.items as RA<RawCalendarListEntry>;
      const calendars = rawCalendars.map((calendar) => {
        calendarIdResolver.add(calendar.id);
        const shortId = Array.from(calendarIdResolver).indexOf(calendar.id);
        const rgbColor = hexToRgb(calendar.backgroundColor ?? randomColor());
        return {
          ...calendar,
          backgroundColor: rgbToString(generateBackground(rgbColor)),
          borderColor: rgbToString(generateBorder(rgbColor)),
          shortId,
        };
      });
      const [secondary, primary] = split(
        calendars,
        ({ primary }) => primary === true
      ).map((calendars) =>
        Array.from(calendars).sort(sortFunction(({ summary }) => summary))
      );
      return [...primary, ...secondary];
    }, [authenticated]),
    false
  );

  const [visibleCalendars, setVisibleCalendars] = React.useState<RA<string>>(
    []
  );

  useVisibilityChangeSpy(calendars, setVisibleCalendars);

  const filteredCalendars = React.useMemo(
    () => calendars?.filter(({ id }) => visibleCalendars.includes(id)),
    [calendars, visibleCalendars]
  );
  return (
    <CalendarsContext.Provider value={filteredCalendars}>
      {children}
    </CalendarsContext.Provider>
  );
}

export const CalendarsContext = React.createContext<
  RA<CalendarListEntry & { readonly shortId: number }> | undefined
>(undefined);
CalendarsContext.displayName = 'CalendarsContext';

function useVisibilityChangeSpy(
  calendars: React.ContextType<typeof CalendarsContext>,
  handleChange: GetOrSet<RA<string>>[1]
): void {
  const [sideBar] = useAsyncState(
    React.useCallback(async () => {
      const sideBar = await awaitElement(
        () => document.querySelector('[role="complementary"]') ?? undefined
      );
      if (sideBar === undefined) console.error('Unable to locate the sidebar');
      else
        await awaitElement(
          () => sideBar.querySelector('input[type="checkbox"]') ?? undefined
        );
      return sideBar;
    }, []),
    false
  );
  React.useEffect(() => {
    if (calendars === undefined || sideBar === undefined) return;

    handleChange(
      filterArray(
        Array.from(
          sideBar.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
          parseCheckbox
        )
      )
        .filter(([_calendarId, checked]) => checked)
        .map(([calendarId]) => calendarId)
    );

    function parseCheckbox(
      checkbox: HTMLInputElement
    ): readonly [id: string, checked: boolean] | undefined {
      if (calendars === undefined) return undefined;
      const calendarName = checkbox.ariaLabel;
      const calendar =
        calendars.find(({ summary }) => summary === calendarName) ??
        /*
         * Summary for the primary calendar does not match what is displayed
         * in the UI
         */
        calendars.find(({ primary }) => primary);
      if (calendar === undefined) {
        console.error('Unable to locate the calendar', calendarName);
        return;
      }
      return [calendar.id, checkbox.checked];
    }

    return listen(sideBar, 'click', ({ target }) => {
      const element = target as HTMLInputElement;
      if (element.tagName !== 'INPUT' || element.type !== 'checkbox') return;
      const calendarId = parseCheckbox(element)?.[0];
      if (calendarId === undefined) return;
      handleChange((visibleCalendars) =>
        toggleItem(visibleCalendars, calendarId)
      );
    });
  }, [calendars, sideBar]);
}

/**
 * Poll regularly until a desired element has been added to the DOM
 */
async function awaitElement<T>(
  callback: () => T | undefined,
  pollInterval = 10,
  limit = 100
): Promise<T | undefined> {
  const result = callback();
  if (limit === 0) return undefined;
  if (result === undefined)
    return new Promise((resolve) =>
      setTimeout(
        () => resolve(awaitElement(callback, pollInterval, limit - 1)),
        pollInterval
      )
    );
  return result;
}
