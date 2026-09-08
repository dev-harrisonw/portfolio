export const kebabCase = (str: string) =>
  str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();

export const kebabArray = (arr: any[]) => arr.map((item) => kebabCase(item));

/** Parse YYYY-MM (or YYYY-MM-DD) as local month start. */
export const parseYearMonth = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
};

export const formatMonthYear = (value: string) =>
  parseYearMonth(value).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

export const formatDuration = (start: string, end?: string | null) => {
  const startDate = parseYearMonth(start);
  const endDate = end ? parseYearMonth(end) : new Date();

  let months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  // Inclusive month count (LinkedIn-style)
  months += 1;
  if (months < 1) months = 1;

  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  if (years > 0 && remMonths > 0) {
    return `${years} yr${years === 1 ? "" : "s"} ${remMonths} mo${
      remMonths === 1 ? "" : "s"
    }`;
  }
  if (years > 0) {
    return `${years} yr${years === 1 ? "" : "s"}`;
  }
  return `${remMonths} mo${remMonths === 1 ? "" : "s"}`;
};

export const formatDateRange = (start: string, end?: string | null) => {
  const startLabel = formatMonthYear(start);
  const endLabel = end ? formatMonthYear(end) : "Present";
  return `${startLabel} – ${endLabel} · ${formatDuration(start, end)}`;
};

export const randomNumberText = (finalNum: string, setNumber) => {
  let count = 0;
  let newNum = "";
  const interval = setInterval(() => {
    count++;
    for (let i = 0; i < finalNum.length; i++) {
      newNum += Math.floor(Math.random() * 10);
    }
    setNumber(newNum);
    newNum = "";
    if (count === 20) {
      clearInterval(interval);

      setNumber("404");
    }
  }, 80);
};
