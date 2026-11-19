export const TEST_KINDS = ["fat", "sat"] as const;

export const CHECK_LABELS: Record<string, string> = {
  survey: "Site survey",
  fat: "FAT",
  install: "Installation",
  commis: "Commissioning",
  sat: "SAT",
  training: "Training",
  tools: "Tools",
  parts: "Service parts",
  warranty: "Warranty support",
};

export const WBS = [
  ["Approve technical spec", "Design Engineer", 0, 5, null],
  ["Issue purchase orders", "Procurement Officer", 2, 10, null],
  ["Workshop assembly", "Workshop Lead", 12, 15, 1],
  ["Factory acceptance test", "Quality Manager", 27, 3, 2],
  ["Site installation", "Site Manager", 30, 10, 3],
  ["Commissioning and SAT", "Commissioning Engineer", 40, 5, 4],
  ["Compile handover pack", "Project Manager", 45, 3, 5],
  ["Site survey and previsit", "Site Manager", 0, 5, null],
] as const;

export const SURVEY_ITEMS = [
  "Site access and working hours confirmed",
  "Installation location identified and dimensions measured",
  "Power supply available (voltage, phase, capacity)",
  "Earthing and bonding available",
  "Water supply and drainage (if applicable)",
  "Environmental conditions (dust, humidity, temperature)",
  "Civil works and foundations required",
  "Cable routes and containment surveyed",
  "Safety, permits and induction requirements",
  "Client contacts and site rules recorded",
  "Photos of existing installation taken",
];

export const FAT_ITEMS = [
  "Visual and mechanical inspection",
  "Insulation resistance (MΩ)",
  "Earth continuity (Ω)",
  "I/O point check",
  "Protection tests",
  "Functional test",
];

export const INSTALL_ITEMS = [
  "Site survey and access confirmed",
  "Equipment delivered and positioned",
  "Mechanical installation and anchoring",
  "Cable containment and glanding",
  "Power and signal cabling terminated",
  "Earthing and bonding installed",
  "Labelling and as-built markup",
];

export const COMMIS_ITEMS = [
  "Pre-commissioning checks (insulation, continuity)",
  "Power-up and supply verification",
  "Instrument calibration and loop checks",
  "I/O and interlock testing",
  "Control sequence and alarm testing",
  "Performance run and readings recorded",
  "Punch list recorded and agreed",
];

export const SAT_ITEMS = [
  "Mechanical installation verified",
  "Power-up and wiring check",
  "Field I/O check",
  "Commissioning tests",
  "Performance readings",
  "Operator training",
];

export const TRAINING_ITEMS = [
  "Operator training",
  "Maintenance staff training",
  "Safety briefing",
  "O&M manual walkthrough",
  "Training attendance register signed",
];

export const TOOLS_ITEMS = [
  "Special tools supplied",
  "Calibration tools and certificates",
  "Lifting and rigging gear",
  "Spare keys and access cards",
];

export const PARTS_ITEMS = [
  "Recommended spares list issued",
  "Consumables on site (fuses, filters, seals)",
  "Critical spares on site",
  "Spares labelled and stored",
];

export const WARRANTY_ITEMS = [
  "Warranty terms issued to client",
  "Warranty start date recorded",
  "Service contacts and escalation list",
  "First service visit scheduled",
  "Remote support access agreed",
];

export const CHECKLIST_SEEDS: Record<string, string[]> = {
  survey: SURVEY_ITEMS,
  fat: FAT_ITEMS,
  install: INSTALL_ITEMS,
  commis: COMMIS_ITEMS,
  sat: SAT_ITEMS,
  training: TRAINING_ITEMS,
  tools: TOOLS_ITEMS,
  parts: PARTS_ITEMS,
  warranty: WARRANTY_ITEMS,
};

export const HANDOVER_DOCS = [
  "Supplier certificates",
  "FAT report",
  "SAT report",
  "As-built drawings",
  "O&M manuals",
  "Warranty terms",
];

export const PARAM_GROUPS = [
  "Structural",
  "Electrical",
  "Control and instrumentation",
  "Mechanical and process",
  "Environmental",
  "Features",
  "Other",
];

export const PARAM_SUGGESTIONS = [
  "Enclosure rating (IP)",
  "Weight (kg)",
  "Material",
  "Supply frequency (Hz)",
  "Rated current (A)",
  "Fault level (kA)",
  "Earthing system",
  "PLC make and model",
  "HMI",
  "Communication protocols",
  "I/O count",
  "Ambient temperature range",
  "Flow rate",
  "Pump head",
  "Motor rating",
  "Cable entry",
  "Colour and finish",
  "Certification",
];

export const VISIT_TYPES = [
  "Previsit",
  "Site survey",
  "Revisit",
  "Installation",
  "Commissioning",
  "Other",
];
export const VISIT_STATUSES = ["Planned", "Done", "Cancelled"];

export const ATTACHMENT_ACCEPT = "image/*,.pdf,.csv,.txt,.md,.json";
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

const DOCUMENT_MIME = new Set([
  "application/pdf",
  "text/csv",
  "text/plain",
  "text/markdown",
  "application/json",
]);

const EXTENSION_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
  csv: "text/csv",
  txt: "text/plain",
  md: "text/markdown",
  json: "application/json",
};

export function attachmentMime(file: { name: string; type: string }): string {
  if (file.type) return file.type.toLowerCase();
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME[extension] ?? "";
}

export function isAllowedAttachmentMime(mime: string): boolean {
  return (
    (mime.startsWith("image/") && mime !== "image/svg+xml") ||
    DOCUMENT_MIME.has(mime)
  );
}

export const CHECK_KINDS = [
  "survey",
  "fat",
  "install",
  "commis",
  "sat",
  "training",
  "tools",
  "parts",
  "warranty",
] as const;
