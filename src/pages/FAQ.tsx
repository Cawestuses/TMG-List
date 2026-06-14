import { useTranslation } from "react-i18next";

export default function FAQ() {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-heading font-black tracking-tight mb-2">{t("faq.title")}</h1>
        <p className="text-zinc-400">{t("faq.subtitle")}</p>
      </div>

      <div className="space-y-4">
        {[
          { q: t("faq.q1"), a: t("faq.a1") },
          { q: t("faq.q2"), a: t("faq.a2") },
          { q: t("faq.q3"), a: t("faq.a3") },
          { q: t("faq.q4"), a: t("faq.a4") },
        ].map((item, i) => (
          <div key={i} className="glass-card border border-white/5 rounded-xl p-6 hover:bg-white/5 transition-colors cursor-pointer group">
            <h3 className="text-sm font-bold mb-2 text-amber-400 uppercase tracking-widest">{item.q}</h3>
            <p className="text-white/60 leading-relaxed text-sm font-medium">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
