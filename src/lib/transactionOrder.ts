type SortableTransaction = {
  date: string;
  createdAt?: string | null;
};

const toBusinessDate = (value?: string | null) => {
  if (!value) return "";
  return value.slice(0, 10);
};

const toTimestamp = (value?: string | null) => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export function compareByBusinessDateAndCreationAsc<T extends SortableTransaction>(a: T, b: T) {
  const businessDateDiff = toTimestamp(toBusinessDate(a.date)) - toTimestamp(toBusinessDate(b.date));
  if (businessDateDiff !== 0) return businessDateDiff;

  return toTimestamp(a.createdAt) - toTimestamp(b.createdAt);
}