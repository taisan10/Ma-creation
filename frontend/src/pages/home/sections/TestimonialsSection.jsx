// export default function TestimonialsSection({
//   cms = {},
//   faqs = [],
//   stats = [],
//   industries = [],
// }) {
//   return (
//     <section
//       data-font-section="home.testimonials"
//       id="testimonials"
//       className="section"
//     >
//       <div className="wrap">
//         <div className="max-w-[680px] mb-10">
//           <span className="eyebrow">Client Experience</span>
//           <h2 className="h2 mt-3">Proof through real client stories</h2>
//           <p className="lede mt-4">
//             Use verified client testimonials here as they become available. The
//             structure is ready for names, company, result and story.
//           </p>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//           {(cms.testimonials?.length
//             ? cms.testimonials
//             : [
//                 {
//                   name: "Client Story 01",
//                   company: "Manufacturing",
//                   quote:
//                     "Registration, catalog setup and bidding support in one workflow.",
//                   result: "Faster onboarding",
//                 },
//                 {
//                   name: "Client Story 02",
//                   company: "Healthcare",
//                   quote:
//                     "The team helped organise documentation and keep the account moving.",
//                   result: "Cleaner compliance",
//                 },
//                 {
//                   name: "Client Story 03",
//                   company: "Services",
//                   quote:
//                     "Training plus ongoing support made the portal easier for our team to manage.",
//                   result: "Better team confidence",
//                 },
//               ]
//           ).map((t, i) => (
//             <div key={t.name || i} className="card">
//               <div className="flex items-center justify-between">
//                 <span className="badge">Verified story slot</span>
//                 <span className="font-mono text-[11px] text-primary">
//                   0{i + 1}
//                 </span>
//               </div>
//               <p className="mt-5 font-display text-lg leading-7">“{t.quote}”</p>
//               <div className="mt-6 pt-4 border-t border-ink/10">
//                 <div className="font-semibold text-sm">{t.name}</div>
//                 <div className="text-xs text-muted mt-1">
//                   {t.company} · {t.result}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }


export default function TestimonialsSection({
  cms = {},
  faqs = [],
  stats = [],
  industries = [],
}) {
  // YouTube URL se video ID nikaalne ka helper
  function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  }

  return (
    <section
      data-font-section="home.testimonials"
      id="testimonials"
      className="section"
    >
      <div className="wrap">
        <div className="max-w-[680px] mb-10">
          <span className="eyebrow">Client Experience</span>
          <h2 className="h2 mt-3">Proof through real client stories</h2>
          <p className="lede mt-4">
            Use verified client testimonials here as they become available. The
            structure is ready for names, company, result and story.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(cms.testimonials?.length
            ? cms.testimonials
            : [
                {
                  name: "Client Story 01",
                  company: "Manufacturing",
                  quote:
                    "Registration, catalog setup and bidding support in one workflow.",
                  result: "Faster onboarding",
                  youtubeUrl: "",
                },
                {
                  name: "Client Story 02",
                  company: "Healthcare",
                  quote:
                    "The team helped organise documentation and keep the account moving.",
                  result: "Cleaner compliance",
                  youtubeUrl: "",
                },
                {
                  name: "Client Story 03",
                  company: "Services",
                  quote:
                    "Training plus ongoing support made the portal easier for our team to manage.",
                  result: "Better team confidence",
                  youtubeUrl: "",
                },
              ]
          ).map((t, i) => {
            const embedUrl = getYouTubeEmbedUrl(t.youtubeUrl);
            return (
              <div key={t.name || i} className="card">
                <div className="flex items-center justify-between">
                  <span className="badge">Verified story slot</span>
                  <span className="font-mono text-[11px] text-primary">
                    0{i + 1}
                  </span>
                </div>

                {embedUrl ? (
                  <div className="mt-5 aspect-video rounded overflow-hidden">
                    <iframe
                      src={embedUrl}
                      title={t.name}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <p className="mt-5 font-display text-lg leading-7">
                    “{t.quote}”
                  </p>
                )}

                <div className="mt-6 pt-4 border-t border-ink/10">
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted mt-1">
                    {t.company} · {t.result}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}