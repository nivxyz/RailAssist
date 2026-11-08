import { type ContactOption, contactHref } from "@/lib/contacts";
import { t } from "@/lib/i18n";
import type { LangCode } from "@/lib/types";
import { LinkIcon, PhoneIcon, PinIcon } from "../Icons";

/** Call / open / ask-at buttons so the passenger can arrange help themselves. */
export function GetIt({ contacts, lang }: { contacts: ContactOption[]; lang: LangCode }) {
  return (
    <div className="mt-2 space-y-2">
      {contacts.map((c) => {
        const href = contactHref(c);
        if (c.kind === "counter" || !href)
          return (
            <div key={c.kind + c.value} className="flex items-start gap-2 text-[15px] leading-snug text-ink">
              <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
              <span>
                <span className="text-muted">{t(lang, "askAt")} </span>
                <b className="font-semibold">{c.i18nKey ? t(lang, c.i18nKey) : c.value}</b>
              </span>
            </div>
          );
        const isPhone = c.kind === "phone";
        return (
          <a
            key={c.kind + c.value}
            href={href}
            target={isPhone ? undefined : "_blank"}
            rel={isPhone ? undefined : "noopener noreferrer"}
            className="flex items-center gap-3 rounded-xl border-2 border-brand-800 bg-card px-3 py-2.5 text-brand-800 transition hover:bg-brand-50 active:scale-[0.98]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-800 text-white">
              {isPhone ? <PhoneIcon className="h-5 w-5" /> : <LinkIcon className="h-5 w-5" />}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[17px] font-bold">
                {isPhone ? t(lang, "callNumber", { number: c.value }) : c.label}
              </span>
              <span className="block truncate text-sm text-muted">
                {isPhone ? c.label : c.value.replace(/^https:\/\//, "").replace(/\/$/, "")}
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
