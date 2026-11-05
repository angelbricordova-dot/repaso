import { Page, TitleRow } from "@/components/app/Page";
import { ShareWhatsApp } from "@/components/landing/ShareWhatsApp";
import { requireUser } from "@/lib/auth";
import { BRAND, SITE_URL } from "@/lib/brand";
import { createAdminClient } from "@/lib/supabase/admin";
import { REFERRAL_REWARD, REFERRED_REWARD } from "@/lib/plans";
import { CopyLink } from "./CopyLink";

export const metadata = { title: "Invitar y ganar" };

export default async function InvitePage() {
  const { profile } = await requireUser();
  const db = createAdminClient();
  const { data } = await db.from("profiles").select("referral_rewarded").eq("referred_by", profile.id);
  const invited = data?.length ?? 0;
  const paid = (data ?? []).filter((r) => r.referral_rewarded).length;
  const link = `${SITE_URL}/registro?ref=${profile.referral_code ?? ""}`;
  const message = `Te paso ${BRAND}: mandas la tarea con una foto y te la entregan resuelta a la hora que la necesitas. La primera es gratis y con mi enlace te regalan ${REFERRED_REWARD} tarea extra al pagar tu plan:`;

  return (
    <Page>
      <TitleRow title="Invitar y ganar" subtitle={`Por cada amigo que pague su primer plan, te regalamos ${REFERRAL_REWARD} tareas. A tu amigo le damos ${REFERRED_REWARD} extra.`} />

      <section aria-label="Tu enlace" className="rounded-[22px] bg-beige p-5 md:p-7">
        <p className="text-[14px] font-semibold text-[#4a4130]">Tu código</p>
        <p className="num mt-1 font-[family-name:var(--font-display)] text-[44px] font-bold leading-none tracking-[0.04em]">{profile.referral_code}</p>
        <div className="mt-5">
          <CopyLink link={link} />
        </div>
        <ShareWhatsApp url={link} text={message} label="Mandar por WhatsApp" className="btn btn-ink mt-3 w-full sm:w-auto" />
      </section>

      <section aria-label="Tus invitaciones" className="mt-6 grid grid-cols-3 gap-[2px] overflow-hidden rounded-[18px]">
        {[
          { label: "Se registraron", value: invited },
          { label: "Ya pagaron", value: paid },
          { label: "Tareas ganadas", value: paid * REFERRAL_REWARD },
        ].map((k) => (
          <div key={k.label} className="flex min-h-[104px] flex-col justify-between bg-surface p-4">
            <p className="text-[13px] text-ink-soft">{k.label}</p>
            <p className="num font-[family-name:var(--font-display)] text-[30px] font-bold leading-none">{k.value}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="ideas" className="mt-8">
        <h2 id="ideas" className="text-[17px] font-bold">
          Dónde compartirlo
        </h2>
        <ul className="mt-3 flex flex-col gap-2 text-[15px] leading-[1.5] text-ink-soft">
          <li>— En el grupo de WhatsApp de tu salón o de tu sección, la semana de entregas.</li>
          <li>— En tu estado de WhatsApp o en tus historias de Instagram.</li>
          <li>— A los representantes, en el grupo de padres del colegio.</li>
        </ul>
      </section>
    </Page>
  );
}
