import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { ROLE_LABEL } from "@/lib/roles";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Profile" };

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value || "—"}</dd>
    </>
  );
}

async function ProfileSection() {
  const sessionUser = await requireUser();
  const profile = await getProfile(sessionUser.id);
  if (!profile) redirect("/login");

  return (
    <div className="profile view-stack">
      <PageHeader title="Profile" subtitle="Your account details and security" />
      <section className="card profile-head">
        <AvatarUploader name={profile.name} avatarUrl={profile.avatarUrl} />
        <div className="profile-identity">
          <h1 className="profile-name">{profile.name}</h1>
          <p className="profile-email">{profile.email}</p>
          <div className="profile-tags">
            <span className="badge bn">{ROLE_LABEL[profile.role]}</span>
            {profile.jobTitle ? <span className="badge bn">{profile.jobTitle}</span> : null}
            {profile.department ? (
              <span className="badge bn">{profile.department}</span>
            ) : null}
            {profile.username ? <span className="profile-handle">@{profile.username}</span> : null}
          </div>
        </div>
      </section>

      <div className="profile-grid">
        <section className="card">
          <h2 className="ct">Your details</h2>
          <dl className="profile-details">
            <Detail label="Name" value={profile.name} />
            <Detail label="Email" value={profile.email} />
            <Detail label="Role" value={ROLE_LABEL[profile.role]} />
            <Detail label="Job title" value={profile.jobTitle} />
            <Detail label="Department" value={profile.department} />
            <Detail label="Phone" value={profile.phone} />
            <Detail label="Bio" value={profile.bio} />
          </dl>
        </section>

        <section className="card">
          <h2 className="ct">Edit profile</h2>
          <ProfileForm profile={profile} />
        </section>
      </div>

      <section className="card">
        <h2 className="ct">Change password</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="empty">Loading…</div>}>
      <ProfileSection />
    </Suspense>
  );
}
