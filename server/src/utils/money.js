// Money is stored as integer paisa (1 NPR = 100 paisa) to avoid float
// rounding errors (§7 design note). These helpers convert for I/O.
export const toPaisa = (npr) => Math.round(Number(npr) * 100);
export const toNpr = (paisa) => Number(paisa) / 100;
export const formatNpr = (paisa) =>
  `Rs. ${(Number(paisa) / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
