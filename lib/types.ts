export interface AttachmentMeta {
  id: string;
  projectId: string;
  scope: string;
  checkItemId: string | null;
  name: string;
  mimeType: string;
  size: number;
  isImage: boolean;
  uploadedBy: string;
  createdAt: string;
}

export interface ReviewView {
  id: string;
  version: number;
  date: string;
  author: string;
  status: string;
  text: string;
}

export interface CheckItemView {
  id: string;
  kind: string;
  item: string;
  reading: string;
  result: string;
  note: string;
  status: number;
  sortOrder: number;
  reviews: ReviewView[];
  attachments: AttachmentMeta[];
}

export interface TaskView {
  id: string;
  name: string;
  role: string;
  owner: string;
  startDate: string;
  endDate: string;
  status: number;
  sortOrder: number;
  dependsOnId: string | null;
}

export interface PurchaseOrderView {
  id: string;
  item: string;
  supplier: string;
  needBy: string;
  promisedBy: string;
  cost: number;
  status: number;
  waybill: string;
}

export interface StageReviewView extends ReviewView {
  key: string;
}

export interface HandoverDocView {
  id: string;
  slot: string;
  ref: string;
  ready: boolean;
  sortOrder: number;
}

export interface CostLineView {
  id: string;
  code: string;
  budget: number;
  actual: number;
}

export interface ParamView {
  id: string;
  groupName: string;
  name: string;
  value: string;
  unit: string;
}

export interface SiteVisitView {
  id: string;
  date: string;
  type: string;
  who: string;
  purpose: string;
  notes: string;
  status: string;
}

export interface NoteView {
  key: string;
  text: string;
}

export interface ProjectView {
  id: string;
  name: string;
  client: string;
  type: string;
  contract: number;
  stage: number;
  specDim: string;
  specVolt: string;
  specKw: string;
  specStd: string;
  specNotes: string;
  signedBy: string;
  signedAt: string | null;
  extra: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  tasks: TaskView[];
  purchaseOrders: PurchaseOrderView[];
  checkItems: CheckItemView[];
  stageReviews: StageReviewView[];
  docs: HandoverDocView[];
  costLines: CostLineView[];
  params: ParamView[];
  visits: SiteVisitView[];
  attachments: AttachmentMeta[];
  notes: NoteView[];
}

export interface ProjectOption {
  id: string;
  name: string;
  client: string;
  type: string;
  stage: number;
  contract: number;
}

export interface SettingsView {
  projectTypes: string[];
  taskRoles: string[];
}

export interface ActionResult {
  error?: string;
  message?: string;
  blockers?: string[];
  busy?: boolean;
}

export interface ProfileView {
  id: string;
  name: string;
  username: string;
  email: string;
  role: import("./roles").Role;
  phone: string;
  jobTitle: string;
  department: string;
  bio: string;
  avatarUrl: string | null;
}

export type ProfileField = "name" | "phone" | "jobTitle" | "department" | "bio";

export interface ProfileState {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Partial<Record<ProfileField | "avatar", string>>;
}

export type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";

export interface PasswordState {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Partial<Record<PasswordField, string>>;
}
