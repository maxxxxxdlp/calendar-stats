import { defaultCustomViewSize, exportsForTests } from '../CurrentViewContext';
import { theories } from '../../../tests/utils';
import { mockTime, testTime } from '../../../tests/helpers';

const { parsePath } = exportsForTests;

mockTime();

const year = testTime.getFullYear();
const month = testTime.getMonth();
const day = testTime.getDate();

theories(parsePath, [
  {
    in: ['/calendar/u/0/r/day/', defaultCustomViewSize, 0, 'day'],
    out: {
      view: 'day',
      selectedDay: new Date(year, month, day),
      firstDay: new Date(year, month, day),
      lastDay: new Date(year, month, day + 1),
    },
  },
  {
    in: ['/calendar/u/0/r/week/', defaultCustomViewSize, 0, 'day'],
    out: {
      view: 'week',
      selectedDay: new Date(year, month, day),
      firstDay: new Date(year, month, day - 3),
      lastDay: new Date(year, month, day + 4),
    },
  },
  {
    in: ['/calendar/u/0/r/week/2022/12/31/', defaultCustomViewSize, 0, 'day'],
    out: {
      view: 'week',
      selectedDay: new Date(2022, 11, 31),
      firstDay: new Date(2022, 11, 25),
      lastDay: new Date(2023, 0, 1),
    },
  },
  {
    in: ['/calendar/u/0/r/week/2022/12/31/', defaultCustomViewSize, 1, 'week'],
    out: {
      view: 'week',
      selectedDay: new Date(2022, 11, 31),
      firstDay: new Date(2022, 11, 26),
      lastDay: new Date(2023, 0, 2),
    },
  },
  {
    in: ['/calendar/u/0/r/week/2023/3/12/', defaultCustomViewSize, 1, 'week'],
    out: {
      view: 'week',
      selectedDay: new Date(2023, 2, 12),
      firstDay: new Date(2023, 2, 6),
      lastDay: new Date(2023, 2, 13),
    },
  },
  {
    in: ['/calendar/u/0/r/week/2022/12/31/', defaultCustomViewSize, 6, 'week'],
    out: {
      view: 'week',
      selectedDay: new Date(2022, 11, 31),
      firstDay: new Date(2022, 11, 31),
      lastDay: new Date(2023, 0, 7),
    },
  },
  {
    in: [
      '/calendar/u/0/r/month/2020/12/31/',
      defaultCustomViewSize,
      0,
      'month',
    ],
    out: {
      view: 'month',
      selectedDay: new Date(2020, 11, 31),
      firstDay: new Date(2020, 11, 1),
      lastDay: new Date(2020, 11, 31),
    },
  },
  {
    in: [
      '/calendar/u/0/r/customday/2020/12/10/',
      defaultCustomViewSize,
      0,
      'month',
    ],
    out: {
      view: 'customday',
      selectedDay: new Date(2020, 11, 10),
      firstDay: new Date(2020, 11, 10),
      lastDay: new Date(2020, 11, 14),
    },
  },
  {
    in: ['/calendar/u/0/r/customweek/2020/12/10/', 14, 0, 'customday'],
    out: {
      view: 'customweek',
      selectedDay: new Date(2020, 11, 10),
      firstDay: new Date(2020, 11, 6),
      lastDay: new Date(2020, 11, 20),
    },
  },
  {
    in: ['/calendar/u/0/r/customweek/2020/12/10/', 14, 2, 'customweek'],
    out: {
      view: 'customweek',
      selectedDay: new Date(2020, 11, 10),
      firstDay: new Date(2020, 11, 8),
      lastDay: new Date(2020, 11, 22),
    },
  },
  {
    in: ['/calendar/u/0/r/year/2023/', defaultCustomViewSize, 0, 'year'],
    out: {
      view: 'year',
      selectedDay: new Date(2023, month, day),
      firstDay: new Date(2023, 0, 1),
      lastDay: new Date(2024, 0, 1),
    },
  },
]);
