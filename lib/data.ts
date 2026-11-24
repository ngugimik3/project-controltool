import { cache } from "react";
import { cookies } from "next/headers";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { DEFAULT_PROJECT_TYPES } from "./constants";
import type {
  AttachmentMeta,
  CheckItemView,
  HandoverDocView,
  ProjectOption,
  ProjectView,
  ReviewView,
  SettingsView,
} from "./types";

export const PROJECT_COOKIE = "pct_project";

const attachmentSelect = {
  id: true,
  projectId: true,
  scope: true,
  checkItemId: true,
  name: true,
  mimeType: true,
  size: true,
  isImage: true,
  uploadedBy: true,
  createdAt: true,
} as const;

function dateOnly(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function mapReview(review: {
  id: string;
  version: number;
  date: Date;
  author: string;
  status: string;
  text: string;
}): ReviewView {
  return {
    id: review.id,
    version: review.version,
    date: dateOnly(review.date),
    author: review.author,
    status: review.status,
    text: review.text,
  };
}

function mapAttachment(attachment: {
  id: string;
  projectId: string;
  scope: string;
  checkItemId: string | null;
  name: string;
  mimeType: string;
  size: number;
  isImage: boolean;
  uploadedBy: string;
  createdAt: Date;
}): AttachmentMeta {
  return {
    id: attachment.id,
    projectId: attachment.projectId,
    scope: attachment.scope,
    checkItemId: attachment.checkItemId,
    name: attachment.name,
    mimeType: attachment.mimeType,
    size: attachment.size,
    isImage: attachment.isImage,
    uploadedBy: attachment.uploadedBy,
    createdAt: attachment.createdAt.toISOString(),
  };
}

const projectInclude = {
  tasks: { orderBy: [{ sortOrder: "asc" }, { startDate: "asc" }] },
  purchaseOrders: { orderBy: { createdAt: "asc" } },
  checkItems: {
    orderBy: { sortOrder: "asc" },
    include: {
      reviews: { orderBy: { version: "asc" } },
      attachments: { select: attachmentSelect },
    },
  },
  stageReviews: { orderBy: [{ key: "asc" }, { version: "asc" }] },
  docs: { orderBy: { sortOrder: "asc" } },
  costLines: { orderBy: { id: "asc" } },
  params: { orderBy: { id: "asc" } },
  visits: { orderBy: { date: "asc" } },
  attachments: { select: attachmentSelect },
  notes: true,
} satisfies Prisma.ProjectInclude;

type ProjectRow = Prisma.ProjectGetPayload<{ include: typeof projectInclude }>;

function mapProject(project: ProjectRow): ProjectView {
  return {
    id: project.id,
    name: project.name,
    client: project.client,
    type: project.type,
    contract: project.contract,
    stage: project.stage,
    specDim: project.specDim,
    specVolt: project.specVolt,
    specKw: project.specKw,
    specStd: project.specStd,
    specNotes: project.specNotes,
    signedBy: project.signedBy,
    signedAt: iso(project.signedAt),
    extra: (project.extra ?? {}) as Record<string, unknown>,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    tasks: project.tasks.map((task) => ({
      id: task.id,
      name: task.name,
      role: task.role,
      owner: task.owner,
      startDate: dateOnly(task.startDate),
      endDate: dateOnly(task.endDate),
      status: task.status,
      sortOrder: task.sortOrder,
      dependsOnId: task.dependsOnId,
    })),
    purchaseOrders: project.purchaseOrders.map((po) => ({
      id: po.id,
      item: po.item,
      supplier: po.supplier,
      needBy: dateOnly(po.needBy),
      promisedBy: dateOnly(po.promisedBy),
      cost: po.cost,
      status: po.status,
      waybill: po.waybill,
    })),
    checkItems: project.checkItems.map<CheckItemView>((check) => ({
      id: check.id,
      kind: check.kind,
      item: check.item,
      reading: check.reading,
      result: check.result,
      note: check.note,
      status: check.status,
      sortOrder: check.sortOrder,
      reviews: check.reviews.map(mapReview),
      attachments: check.attachments.map(mapAttachment),
    })),
    stageReviews: project.stageReviews.map((review) => ({
      ...mapReview(review),
      key: review.key,
    })),
    docs: project.docs.map<HandoverDocView>((doc) => ({
      id: doc.id,
      slot: doc.slot,
      ref: doc.ref,
      ready: doc.ready,
      sortOrder: doc.sortOrder,
    })),
    costLines: project.costLines.map((line) => ({
      id: line.id,
      code: line.code,
      budget: line.budget,
      actual: line.actual,
    })),
    params: project.params.map((param) => ({
      id: param.id,
      groupName: param.groupName,
      name: param.name,
      value: param.value,
      unit: param.unit,
    })),
    visits: project.visits.map((visit) => ({
      id: visit.id,
      date: dateOnly(visit.date),
      type: visit.type,
      who: visit.who,
      purpose: visit.purpose,
      notes: visit.notes,
      status: visit.status,
    })),
    attachments: project.attachments.map(mapAttachment),
    notes: project.notes.map((note) => ({ key: note.key, text: note.text })),
  };
}

export const getProjects = cache(async (): Promise<ProjectView[]> => {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "asc" },
    include: projectInclude,
  });
  return projects.map(mapProject);
});

export const getProjectById = cache(
  async (projectId: string): Promise<ProjectView | null> => {
    if (!projectId) return null;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: projectInclude,
    });
    return project ? mapProject(project) : null;
  },
);

export async function getProjectOptions(): Promise<ProjectOption[]> {
  const projects = await getProjects();
  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    client: p.client,
    type: p.type,
    stage: p.stage,
    contract: p.contract,
  }));
}

export const getSelectedProject = cache(async (): Promise<ProjectView | null> => {
  const [projects, cookieStore] = await Promise.all([getProjects(), cookies()]);
  const selectedId = cookieStore.get(PROJECT_COOKIE)?.value;
  return projects.find((p) => p.id === selectedId) ?? projects[0] ?? null;
});

export async function getProject(projectId: string): Promise<ProjectView | null> {
  return getProjectById(projectId);
}

export const getSettings = cache(async (): Promise<SettingsView> => {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["projectTypes", "taskRoles"] } },
  });
  const values = new Map(rows.map((row) => [row.key, row.value]));
  const projectTypes = values.get("projectTypes");
  const taskRoles = values.get("taskRoles");
  return {
    projectTypes:
      Array.isArray(projectTypes) && projectTypes.every((v) => typeof v === "string")
        ? (projectTypes as string[])
        : [...DEFAULT_PROJECT_TYPES],
    taskRoles:
      Array.isArray(taskRoles) && taskRoles.every((v) => typeof v === "string")
        ? (taskRoles as string[])
        : [],
  };
});

export async function getActivity(limit = 100) {
  const rows = await prisma.activityLog.findMany({
    orderBy: { ts: "desc" },
    take: limit,
  });
  return rows.map((row) => ({
    id: row.id,
    ts: row.ts.toISOString(),
    userName: row.userName,
    action: row.action,
  }));
}

export async function getUsers() {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  return users.map((user) => ({
    ...user,
    lastLoginAt: iso(user.lastLoginAt),
    createdAt: user.createdAt.toISOString(),
  }));
}

export type AttachmentRow = {
  id: string;
  projectId: string;
  scope: string;
  checkItemId: string | null;
  name: string;
  mimeType: string;
  size: number;
  isImage: boolean;
  data: Uint8Array;
};

export async function getAttachment(id: string): Promise<AttachmentRow | null> {
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) return null;
  return attachment;
}

export type UserRow = Awaited<ReturnType<typeof getUsers>>[number];
export type ActivityRow = Awaited<ReturnType<typeof getActivity>>[number];
