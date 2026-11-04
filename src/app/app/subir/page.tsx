import { Page, TitleRow } from "@/components/app/Page";
import { requireUser } from "@/lib/auth";
import { effectivePlan } from "@/lib/plans";
import type { Subject } from "@/lib/types";
import { Uploader } from "./Uploader";

export const metadata = { title: "Subir clase" };

export default async function UploadPage({ searchParams }: { searchParams: Promise<{ materia?: string }> }) {
  const { profile, supabase } = await requireUser();
  const { materia } = await searchParams;
  const { data } = await supabase.from("subjects").select("*").eq("user_id", profile.id).order("name");
  const plan = effectivePlan(profile.plan, profile.plan_expires_at);

  return (
    <Page>
      <TitleRow title="Subir una clase" subtitle="Repaso prepara el resumen, las fichas, el quiz y las preguntas de desarrollo." />
      <Uploader
        userId={profile.id}
        subjects={(data ?? []) as Subject[]}
        initialSubject={materia?.slice(0, 80) ?? ""}
        allowRecordings={plan.recordingMinutesPerMonth > 0}
        maxPdfPages={plan.maxPdfPages}
      />
    </Page>
  );
}
