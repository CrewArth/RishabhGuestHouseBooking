/**
 * Array of calendar months for use in dropdowns.
 * value: 1-based month number (matches JS Date.getMonth() + 1 and MongoDB $month)
 */
export const MONTHS = [
  { value: 1,  label: 'January'   },
  { value: 2,  label: 'February'  },
  { value: 3,  label: 'March'     },
  { value: 4,  label: 'April'     },
  { value: 5,  label: 'May'       },
  { value: 6,  label: 'June'      },
  { value: 7,  label: 'July'      },
  { value: 8,  label: 'August'    },
  { value: 9,  label: 'September' },
  { value: 10, label: 'October'   },
  { value: 11, label: 'November'  },
  { value: 12, label: 'December'  },
];

/** Returns the label for a given 1-based month number. */
export const getMonthLabel = (value) =>
  MONTHS.find((m) => m.value === Number(value))?.label ?? '';
