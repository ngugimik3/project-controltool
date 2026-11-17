import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function rows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.map(record).filter((row): row is Record<string, unknown> => row !== null);
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function flag(value: unknown): boolean {
  return value === true;
}

function date(value: unknown, field: string): Date {
  const parsed = new Date(text(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date for ${field}.`);
  }
  return parsed;
}

function optionalDate(value: unknown, field: string): Date | null {
  if (value === null || value === undefined || value === "") return null;
  return date(value, field);
}

export async function buildBackup() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      tasks: true,
      purchaseOrders: true,
      checkItems: { include: { reviews: true } },
      stageReviews: true,
      docs: true,
      costLines: true,
      params: true,
      visits: true,
      attachments: true,
      notes: true,
    },
  });

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: projects.map((project) => ({
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
      signedAt: project.signedAt?.toISOString() ?? null,
      extra: project.extra,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      tasks: project.tasks.map((task) => ({
        id: task.id,
        name: task.name,
        role: task.role,
        owner: task.owner,
        startDate: task.startDate.toISOString(),
        endDate: task.endDate.toISOString(),
        status: task.status,
        sortOrder: task.sortOrder,
        dependsOnId: task.dependsOnId,
      })),
      purchaseOrders: project.purchaseOrders.map((po) => ({
        id: po.id,
        item: po.item,
        supplier: po.supplier,
        needBy: po.needBy.toISOString(),
        promisedBy: po.promisedBy.toISOString(),
        cost: po.cost,
        status: po.status,
        waybill: po.waybill,
        createdAt: po.createdAt.toISOString(),
      })),
      checkItems: project.checkItems.map((item) => ({
        id: item.id,
        kind: item.kind,
        item: item.item,
        reading: item.reading,
        result: item.result,
        note: item.note,
        status: item.status,
        sortOrder: item.sortOrder,
        reviews: item.reviews.map((review) => ({
          id: review.id,
          version: review.version,
          date: review.date.toISOString(),
          author: review.author,
          status: review.status,
          text: review.text,
        })),
      })),
      stageReviews: project.stageReviews.map((review) => ({
        id: review.id,
        key: review.key,
        version: review.version,
        date: review.date.toISOString(),
        author: review.author,
        status: review.status,
        text: review.text,
      })),
      docs: project.docs.map((doc) => ({
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
        date: visit.date.toISOString(),
        type: visit.type,
        who: visit.who,
        purpose: visit.purpose,
        notes: visit.notes,
        status: visit.status,
      })),
      attachments: project.attachments.map((attachment) => ({
        id: attachment.id,
        scope: attachment.scope,
        checkItemId: attachment.checkItemId,
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
        isImage: attachment.isImage,
        data: Buffer.from(attachment.data).toString("base64"),
        uploadedBy: attachment.uploadedBy,
        createdAt: attachment.createdAt.toISOString(),
      })),
      notes: project.notes.map((note) => ({ key: note.key, text: note.text })),
    })),
  };
}

export async function importBackup(payload: unknown, actor: string): Promise<number> {
  const root = record(payload);
  if (!root || !Array.isArray(root.projects)) {
    throw new Error("That is not a valid Project Control backup.");
  }
  const projects = rows(root.projects);
  if (!projects.length) throw new Error("The backup contains no projects.");

  await prisma.$transaction(
    async (tx) => {
      await tx.project.deleteMany();

      for (const project of projects) {
        const projectId = randomUUID();
        const projectTasks = rows(project.tasks);
        const taskIds = new Map<string, string>();
        projectTasks.forEach((task, index) => {
          taskIds.set(text(task.id, `task-${index}`), randomUUID());
        });
        const projectChecks = rows(project.checkItems);
        const checkIds = new Map<string, string>();
        projectChecks.forEach((item, index) => {
          checkIds.set(text(item.id, `check-${index}`), randomUUID());
        });

        await tx.project.create({
          data: {
            id: projectId,
            name: text(project.name, "Untitled project"),
            client: text(project.client),
            type: text(project.type),
            contract: number(project.contract),
            stage: Math.max(0, Math.min(9, Math.round(number(project.stage)))),
            specDim: text(project.specDim),
            specVolt: text(project.specVolt),
            specKw: text(project.specKw),
            specStd: text(project.specStd),
            specNotes: text(project.specNotes),
            signedBy: text(project.signedBy),
            signedAt: optionalDate(project.signedAt, "signedAt"),
            extra: (record(project.extra) ?? {}) as object,
            createdAt: date(project.createdAt ?? new Date(), "createdAt"),
            updatedAt: date(project.updatedAt ?? new Date(), "updatedAt"),
          },
        });

        if (projectTasks.length) {
          await tx.task.createMany({
            data: projectTasks.map((task, index) => {
              const oldId = text(task.id, `task-${index}`);
              const dependency = text(task.dependsOnId);
              return {
                id: taskIds.get(oldId) ?? randomUUID(),
                projectId,
                name: text(task.name, "Untitled task"),
                role: text(task.role, "Unassigned"),
                owner: text(task.owner),
                startDate: date(task.startDate, "task startDate"),
                endDate: date(task.endDate, "task endDate"),
                status: Math.max(0, Math.min(3, Math.round(number(task.status)))),
                sortOrder: Math.round(number(task.sortOrder)),
                dependsOnId: dependency ? taskIds.get(dependency) ?? null : null,
              };
            }),
          });
        }

        const purchaseOrders = rows(project.purchaseOrders);
        if (purchaseOrders.length) {
          await tx.purchaseOrder.createMany({
            data: purchaseOrders.map((po) => ({
              id: randomUUID(),
              projectId,
              item: text(po.item, "Untitled item"),
              supplier: text(po.supplier),
              needBy: date(po.needBy, "purchase order needBy"),
              promisedBy: date(po.promisedBy, "purchase order promisedBy"),
              cost: number(po.cost),
              status: Math.max(0, Math.min(8, Math.round(number(po.status)))),
              waybill: text(po.waybill),
              createdAt: date(po.createdAt ?? new Date(), "purchase order createdAt"),
            })),
          });
        }

        if (projectChecks.length) {
          await tx.checkItem.createMany({
            data: projectChecks.map((item, index) => ({
              id: checkIds.get(text(item.id, `check-${index}`)) ?? randomUUID(),
              projectId,
              kind: text(item.kind, "survey"),
              item: text(item.item, "Untitled item"),
              reading: text(item.reading),
              result: text(item.result),
              note: text(item.note),
              status: Math.max(0, Math.min(3, Math.round(number(item.status)))),
              sortOrder: Math.round(number(item.sortOrder)),
            })),
          });

          const reviews = projectChecks.flatMap((item, index) => {
            const checkItemId = checkIds.get(text(item.id, `check-${index}`));
            return rows(item.reviews)
              .filter(() => Boolean(checkItemId))
              .map((review, reviewIndex) => ({
                id: randomUUID(),
                checkItemId: checkItemId as string,
                version: Math.max(1, Math.round(number(review.version, reviewIndex + 1))),
                date: date(review.date, "review date"),
                author: text(review.author),
                status: text(review.status, "In progress"),
                text: text(review.text),
              }));
          });
          if (reviews.length) await tx.checkItemReview.createMany({ data: reviews });
        }

        const stageReviews = rows(project.stageReviews);
        if (stageReviews.length) {
          await tx.stageReview.createMany({
            data: stageReviews.map((review, index) => ({
              id: randomUUID(),
              projectId,
              key: text(review.key, "survey"),
              version: Math.max(1, Math.round(number(review.version, index + 1))),
              date: date(review.date, "stage review date"),
              author: text(review.author),
              status: text(review.status, "In progress"),
              text: text(review.text),
            })),
          });
        }

        const docs = rows(project.docs);
        if (docs.length) {
          await tx.handoverDoc.createMany({
            data: docs.map((doc) => ({
              id: randomUUID(),
              projectId,
              slot: text(doc.slot, "Document"),
              ref: text(doc.ref),
              ready: flag(doc.ready),
              sortOrder: Math.round(number(doc.sortOrder)),
            })),
          });
        }

        const costLines = rows(project.costLines);
        if (costLines.length) {
          await tx.costLine.createMany({
            data: costLines.map((line) => ({
              id: randomUUID(),
              projectId,
              code: text(line.code, "Uncoded"),
              budget: number(line.budget),
              actual: number(line.actual),
            })),
          });
        }

        const params = rows(project.params);
        if (params.length) {
          await tx.param.createMany({
            data: params.map((param) => ({
              id: randomUUID(),
              projectId,
              groupName: text(param.groupName, "Other"),
              name: text(param.name, "Parameter"),
              value: text(param.value),
              unit: text(param.unit),
            })),
          });
        }

        const visits = rows(project.visits);
        if (visits.length) {
          await tx.siteVisit.createMany({
            data: visits.map((visit) => ({
              id: randomUUID(),
              projectId,
              date: date(visit.date, "visit date"),
              type: text(visit.type, "Other"),
              who: text(visit.who),
              purpose: text(visit.purpose),
              notes: text(visit.notes),
              status: text(visit.status, "Planned"),
            })),
          });
        }

        const attachments = rows(project.attachments);
        if (attachments.length) {
          await tx.attachment.createMany({
            data: attachments.map((attachment) => {
              const data = Buffer.from(text(attachment.data), "base64");
              const oldCheckId = text(attachment.checkItemId);
              return {
                id: randomUUID(),
                projectId,
                scope: text(attachment.scope, "survey"),
                checkItemId: oldCheckId ? checkIds.get(oldCheckId) ?? null : null,
                name: text(attachment.name, "attachment"),
                mimeType: text(attachment.mimeType, "application/octet-stream"),
                size: data.length,
                isImage: flag(attachment.isImage),
                data,
                uploadedBy: text(attachment.uploadedBy),
                createdAt: date(attachment.createdAt ?? new Date(), "attachment createdAt"),
              };
            }),
          });
        }

        const notes = rows(project.notes);
        if (notes.length) {
          await tx.note.createMany({
            data: notes.map((note) => ({
              id: randomUUID(),
              projectId,
              key: text(note.key, "survey"),
              text: text(note.text),
            })),
          });
        }
      }
    },
    { timeout: 120_000 },
  );

  const { logActivity } = await import("./activity");
  await logActivity(actor, `Imported backup (${projects.length} project(s))`);
  return projects.length;
}
