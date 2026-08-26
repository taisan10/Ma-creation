// import DemoForm from '../../../components/DemoForm'

// export default function DemoSection({ cms = {}, faqs = [], stats = [], industries = [] }) {
//   return (

//       <section data-font-section="home.demo" id="demo" className="bg-paper2 section">
//         <div className="wrap grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-start">
//           <div>
//             <span className="eyebrow">Get Started</span>
//             <h2 className="h2 mt-3 text-[26px] md:text-[32px]">Book your free GeM consultancy &amp; live demo</h2>
//             <p className="mt-4 text-ink/70 max-w-[48ch]">
//               Connect with our GeM experts for personalised guidance. Tell us a little about your business and we&rsquo;ll arrange a live walkthrough of the portal.
//             </p>

//             <div className="flex gap-4 items-center mt-8">
//               <div className="w-16 h-16 rounded-full bg-ink text-paper flex items-center justify-center font-display text-2xl shrink-0">C</div>
//               <div>
//                 <p className="font-semibold">Chanchal</p>
//                 <p className="text-[13px] text-ink/70">Founder &amp; GeM Consultant — leads every onboarding call personally</p>
//               </div>
//             </div>

//             <ul className="mt-7 space-y-2.5 text-sm text-ink/70">
//               <li>✓ Response within 24 hours of your request</li>
//               <li>✓ No obligation — the first consultation is free</li>
//               <li>✓ Pan‑India, in your language</li>
//             </ul>
//           </div>

//           <DemoForm />
//         </div>
//       </section>

      
//   )
// }



import DemoForm from '../../../components/DemoForm'

export default function DemoSection({ cms = {}, faqs = [], stats = [], industries = [] }) {
  return (

      <section data-font-section="home.demo" id="demo" className="bg-paper2 section">
        <div className="wrap grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-start">
          <div>
            <span className="eyebrow">Get Started</span>
            <h2 className="h2 mt-3 text-[26px] md:text-[32px]"> Book Your Free GeM Expert Consultation Call Now</h2>
            <p className="mt-4 text-ink/70 max-w-[48ch]">
              ⭐ Are you a Business owner, startup, or individual wanting to sell to the government? Any person can book a free expert call today!
            </p>
            <p className="mt-3 text-ink/70 max-w-[48ch]">
              ⭐ Please fill out the form below with your correct details. Our GeM experts will study your business profile. We will contact you within 24 to 48 hrs to give you detailed, personalized guidance.
            </p>

            <div className="flex gap-4 items-center mt-8">
              <div className="w-16 h-16 rounded-full bg-ink text-paper flex items-center justify-center font-display text-2xl shrink-0">C</div>
              <div>
                <p className="font-semibold">Chanchal</p>
                <p className="text-[13px] text-ink/70">Founder &amp; GeM Consultant — leads every onboarding call personally</p>
              </div>
            </div>

            <ul className="mt-7 space-y-2.5 text-sm text-ink/70">
              <li>⭐ 100% Free: No hidden charges for your first consultation.</li>
              <li>⭐ Expert Advice: Get detailed guidance based on your business type.</li>
              <li>⭐ Fast Response: Our team will connect with you within 24–48 hours.</li>
            </ul>

            {/* <p className="mt-6 text-sm font-semibold text-ink">✨ Here are the key 🔐 points mentioned in the form are as follows:-</p>
            <ul className="mt-3 space-y-2.5 text-sm text-ink/70">
              <li>⭐ Name of Business</li>
              <li>⭐ Phone no</li>
              <li>⭐ Location</li>
              <li>⭐ In which category you work like Furniture, cleaning, construction etc.</li>
              <li>⭐ What you want
                <ul className="mt-1.5 ml-4 space-y-1">
                  <li>1.) Learn Training</li>
                  <li>2.) Want Working</li>
                  <li>3.) Only Guidance</li>
                </ul>
              </li>
              <li>⭐ You are a Beginner or Experienced One</li>
            </ul> */}
          </div>

          <DemoForm />
        </div>
      </section>

      
  )
}