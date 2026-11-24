import ExcelJS from "exceljs";

export const EXCEL = {
  navy: "0F2A44",
  steel: "1F4E79",
  mist: "E8EEF5",
  line: "D0D7E2",
  ink: "1A1A1A",
  muted: "5B6777",
  white: "FFFFFF",
  good: "166534",
  goodBg: "DCFCE7",
  warn: "9A3412",
  warnBg: "FFEDD5",
  bad: "991B1B",
  badBg: "FEE2E2",
  totalBg: "F1F5F9",
} as const;

export function projectSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "project"
  );
}

export function createWorkbook(title: string): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Project Control";
  workbook.lastModifiedBy = "Project Control";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.title = title;
  return workbook;
}

export async function workbookResponse(
  workbook: ExcelJS.Workbook,
  filename: string,
): Promise<Response> {
  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function styleTitle(cell: ExcelJS.Cell, text: string) {
  cell.value = text;
  cell.font = { name: "Calibri", size: 18, bold: true, color: { argb: `FF${EXCEL.navy}` } };
  cell.alignment = { vertical: "middle", horizontal: "left" };
}

export function styleSection(cell: ExcelJS.Cell, text: string) {
  cell.value = text;
  cell.font = { name: "Calibri", size: 12, bold: true, color: { argb: `FF${EXCEL.steel}` } };
}

export function styleMetaLabel(cell: ExcelJS.Cell, text: string) {
  cell.value = text;
  cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: `FF${EXCEL.muted}` } };
}

export function styleMetaValue(cell: ExcelJS.Cell, value: ExcelJS.CellValue) {
  cell.value = value;
  cell.font = { name: "Calibri", size: 11, color: { argb: `FF${EXCEL.ink}` } };
}

export function styleHeaderRow(row: ExcelJS.Row, columns: number) {
  row.height = 22;
  for (let col = 1; col <= columns; col += 1) {
    const cell = row.getCell(col);
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: `FF${EXCEL.white}` } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: `FF${EXCEL.navy}` },
    };
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    cell.border = {
      bottom: { style: "thin", color: { argb: `FF${EXCEL.navy}` } },
    };
  }
}

export function styleBodyRow(row: ExcelJS.Row, columns: number, zebra: boolean) {
  for (let col = 1; col <= columns; col += 1) {
    const cell = row.getCell(col);
    cell.font = { name: "Calibri", size: 10, color: { argb: `FF${EXCEL.ink}` } };
    cell.alignment = { vertical: "middle" };
    if (zebra) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: `FF${EXCEL.mist}` },
      };
    }
    cell.border = {
      bottom: { style: "hair", color: { argb: `FF${EXCEL.line}` } },
    };
  }
}

export function paintStatus(cell: ExcelJS.Cell, kind: "good" | "warn" | "bad" | "neutral") {
  if (kind === "neutral") return;
  const map = {
    good: { fg: EXCEL.good, bg: EXCEL.goodBg },
    warn: { fg: EXCEL.warn, bg: EXCEL.warnBg },
    bad: { fg: EXCEL.bad, bg: EXCEL.badBg },
  } as const;
  const colors = map[kind];
  cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: `FF${colors.fg}` } };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: `FF${colors.bg}` },
  };
}

export function autoFit(sheet: ExcelJS.Worksheet, min = 10, max = 42) {
  sheet.columns.forEach((column) => {
    let width = min;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const raw =
        typeof cell.value === "object" && cell.value && "text" in cell.value
          ? String((cell.value as { text: string }).text)
          : cell.value == null
            ? ""
            : String(cell.value);
      width = Math.min(max, Math.max(width, raw.length + 2));
    });
    column.width = width;
  });
}

export function money(cell: ExcelJS.Cell, value: number) {
  cell.value = value;
  cell.numFmt = "#,##0.00";
  cell.alignment = { horizontal: "right", vertical: "middle" };
}

export function integer(cell: ExcelJS.Cell, value: number) {
  cell.value = value;
  cell.numFmt = "0";
  cell.alignment = { horizontal: "right", vertical: "middle" };
}

export function percent(cell: ExcelJS.Cell, value: number) {
  cell.value = value / 100;
  cell.numFmt = "0.0%";
  cell.alignment = { horizontal: "right", vertical: "middle" };
}
