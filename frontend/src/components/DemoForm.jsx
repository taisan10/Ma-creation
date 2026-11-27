import { useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  Compass,
  GraduationCap,
  Lock,
  PhoneCall,
  Plus,
  RotateCcw,
} from "lucide-react";
import { api } from "../lib/api";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";

const DRAFT_KEY = "mac_demo_inquiry_draft_v1";

const CATEGORY_OPTIONS = [
  { value: "products", label: "Products / Goods Supply" },
  { value: "services", label: "Services & Manpower" },
  { value: "it_electronics", label: "IT, Software & Electronics" },
  { value: "furniture", label: "Furniture & Office Equipment" },
  { value: "construction", label: "Construction & Civil Works" },
  { value: "cleaning", label: "Cleaning & Facility Management" },
  { value: "healthcare", label: "Healthcare & Medical Supplies" },
  { value: "other", label: "Other Category" },
];

const NEED_OPTIONS = [
  {
    value: "learn_training",
    title: "GeM Training",
    detail: "Listing & bidding",
    icon: GraduationCap,
  },
  {
    value: "want_working",
    title: "Managed Ops",
    detail: "Done-for-you work",
    icon: Briefcase,
  },
  {
    value: "only_guidance",
    title: "1-on-1 Advisory",
    detail: "Strategy & OEM",
    icon: Compass,
  },
];

const EXPERIENCE_OPTIONS = [
  {
    value: "beginner",
    title: "New to GeM",
    detail: "Not registered yet",
  },
  {
    value: "experienced",
    title: "Already on GeM",
    detail: "Active account",
  },
];

const FORMAT_OPTIONS = [
  {
    value: "demo",
    label: "Live portal demo",
  },
  {
    value: "callback",
    label: "Phone callback",
  },
];

const INITIAL_VALUES = {
  need: "",
  experience: "beginner",
  name: "",
  phone: "",
  location: "",
  category: "",
  otherCategory: "",
  business: "",
  email: "",
  message: "",
  type: "demo",
};

const PHONE_CHAR_RE = /^[+\d\s().-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

function loadDraft() {
  if (typeof window === "undefined") return INITIAL_VALUES;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return INITIAL_VALUES;
    const parsed = JSON.parse(raw);
    return { ...INITIAL_VALUES, ...(parsed && typeof parsed === "object" ? parsed : {}) };
  } catch {
    return INITIAL_VALUES;
  }
}

function validateSingleField(field, values) {
  const name = values.name.trim();
  const phone = values.phone.trim();
  const digits = phone.replace(/\D/g, "");
  const location = values.location.trim();
  const email = values.email.trim();
  const otherCategory = values.otherCategory.trim();
  const message = values.message.trim();

  switch (field) {
    case "need":
      return values.need ? "" : "Choose how we can help you on GeM.";
    case "experience":
      return values.experience ? "" : "Select your current GeM portal status.";
    case "name":
      if (name.length < 2) return "Enter your full name (at least 2 characters).";
      if (name.length > 80) return "Full name must be 80 characters or fewer.";
      return "";
    case "phone":
      if (!phone || !PHONE_CHAR_RE.test(phone) || digits.length < 8 || digits.length > 15 || phone.length > 20) {
        return "Enter a valid phone number (8–15 digits, e.g. +91 98765 43210).";
      }
      return "";
    case "location":
      if (!location) return "Enter your city or state for regional GeM guidance.";
      if (location.length > 120) return "City / State must be 120 characters or fewer.";
      return "";
    case "category":
      return values.category ? "" : "Select the category closest to your work.";
    case "otherCategory":
      if (values.category === "other" && !otherCategory) {
        return "Briefly name your product or service category.";
      }
      return "";
    case "email":
      if (email && !EMAIL_RE.test(email)) {
        return "Enter a valid email address or leave this field blank.";
      }
      return "";
    case "message":
      if (message.length > 1000) return "Notes must be 1,000 characters or fewer.";
      return "";
    default:
      return "";
  }
}

const VALIDATED_FIELDS = [
  "need",
  "experience",
  "name",
  "phone",
  "location",
  "category",
  "otherCategory",
  "email",
  "message",
];

function validateAllFields(values) {
  const errors = {};
  for (const field of VALIDATED_FIELDS) {
    const msg = validateSingleField(field, values);
    if (msg) errors[field] = msg;
  }
  return errors;
}

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-danger">
      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

export default function DemoForm({ helpline = "+91-8387937000" }) {
  const initial = loadDraft();
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorSummary, setErrorSummary] = useState("");
  const [showOptional, setShowOptional] = useState(
    Boolean(initial.business?.trim() || initial.email?.trim() || initial.message?.trim())
  );
  const [submittedLead, setSubmittedLead] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const submittingRef = useRef(false);
  const formRef = useRef(null);
  const cardRef = useRef(null);
  const statusHeadingRef = useRef(null);

  const needLegendId = useId();
  const statusLegendId = useId();
  const formatLegendId = useId();
  const optionalPanelId = useId();

  useEffect(() => {
    if (typeof window === "undefined" || submittedLead) return;
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    } catch {
      /* ignore storage quota/privacy restrictions */
    }
  }, [values, submittedLead]);

  const optionalCount = [values.business, values.email, values.message].filter((v) =>
    v.trim()
  ).length;

  function updateField(field, nextValue) {
    const nextValues = {
      ...values,
      [field]: nextValue,
      ...(field === "category" && nextValue !== "other" ? { otherCategory: "" } : {}),
    };
    setValues(nextValues);

    if (touched[field] || fieldErrors[field]) {
      const msg = validateSingleField(field, nextValues);
      setFieldErrors((prev) => {
        const copy = { ...prev };
        if (msg) copy[field] = msg;
        else delete copy[field];
        if (field === "category" && nextValue !== "other") delete copy.otherCategory;
        return copy;
      });
    }
    if (errorSummary) setErrorSummary("");
    if (serverError) setServerError("");
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const msg = validateSingleField(field, values);
    setFieldErrors((prev) => {
      const copy = { ...prev };
      if (msg) copy[field] = msg;
      else delete copy[field];
      return copy;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submittingRef.current) return;

    const errors = validateAllFields(values);
    const errorKeys = Object.keys(errors);

    if (errorKeys.length > 0) {
      setFieldErrors(errors);
      setTouched(Object.fromEntries(VALIDATED_FIELDS.map((k) => [k, true])));
      setErrorSummary(
        `Please check ${errorKeys.length} highlighted ${errorKeys.length === 1 ? "field" : "fields"} below.`
      );
      if (errors.email || errors.message) {
        setShowOptional(true);
      }
      requestAnimationFrame(() => {
        const firstKey = errorKeys[0];
        const target = formRef.current?.querySelector(`[name="${firstKey}"]`);
        target?.focus();
      });
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFieldErrors({});
    setErrorSummary("");
    setServerError("");

    const trimmedName = values.name.trim();
    const normalizedPhone = values.phone.trim().replace(/\s+/g, " ");
    const trimmedBusiness = values.business.trim();
    const trimmedLocation = values.location.trim();
    const trimmedEmail = values.email.trim();
    const trimmedMessage = values.message.trim();
    const resolvedCategory =
      values.category === "other"
        ? `Other: ${values.otherCategory.trim()}`.slice(0, 80)
        : values.category;

    const payload = {
      name: trimmedName,
      phone: normalizedPhone,
      business: trimmedBusiness,
      company: trimmedBusiness,
      location: trimmedLocation,
      category: resolvedCategory,
      need: values.need,
      experience: values.experience,
      message: trimmedMessage,
      type: values.type,
      ...(trimmedEmail ? { email: trimmedEmail } : {}),
    };

    try {
      await api("/leads", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      try {
        window.sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setSubmittedLead({
        name: trimmedName,
        phone: normalizedPhone,
        type: values.type,
      });
      setValues(INITIAL_VALUES);
      setTouched({});
      setShowOptional(false);
      requestAnimationFrame(() => {
        statusHeadingRef.current?.focus();
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    } catch (err) {
      setServerError(
        err?.message ||
          "Unable to submit your request right now. Please try again or call our helpline."
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function handleResetConfirmation() {
    setSubmittedLead(null);
    requestAnimationFrame(() => {
      const firstInput = formRef.current?.querySelector('input[name="need"]');
      firstInput?.focus();
    });
  }

  const callHref = `tel:${helpline.replace(/\s+/g, "")}`;

  return (
    <Card
      ref={cardRef}
      className="demo-form rounded-2xl border border-ink/20 bg-card overflow-hidden shadow-[0_1px_2px_rgba(11,31,58,0.06),0_20px_44px_-22px_rgba(11,31,58,0.22)]"
    >
      {submittedLead ? (
        <div role="status" aria-live="polite" className="p-6 sm:p-8 space-y-5">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-full bg-secondary/[0.12] border border-secondary/30 text-secondary flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3
                ref={statusHeadingRef}
                tabIndex={-1}
                className="font-display text-xl font-semibold text-ink outline-none"
              >
                {submittedLead.type === "callback"
                  ? "Callback Request Confirmed"
                  : "Free Demo Request Confirmed"}
              </h3>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink/80">
                Thank you, <strong className="text-ink">{submittedLead.name}</strong>. Our GeM
                advisory desk has received your brief and will reach you at{" "}
                <strong className="text-ink">{submittedLead.phone}</strong> within 24 hours.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-ink/15 bg-paper px-4 py-3.5 text-[13.5px] text-ink/80 flex flex-wrap items-center justify-between gap-3">
            <span>Have an urgent bid deadline today?</span>
            <a
              href={callHref}
              className="inline-flex items-center gap-1.5 font-semibold text-primaryDark hover:text-primary underline-offset-4 hover:underline"
            >
              <PhoneCall className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Call {helpline}</span>
            </a>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleResetConfirmation}
            className="w-full sm:w-auto min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Submit another inquiry</span>
          </Button>
        </div>
      ) : (
        <form ref={formRef} noValidate onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-5 sm:px-7 pt-4 sm:pt-5 pb-3.5 border-b border-ink/10 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-[19px] sm:text-[20px] font-semibold tracking-[-0.015em] text-ink">
                Book your free GeM consultation
              </h3>
              <p className="text-[12.5px] text-muted mt-0.5">
                Fields marked <span className="text-danger font-medium">*</span> help us pair the right advisor.
              </p>
            </div>
            <span className="shrink-0 inline-flex items-center rounded-full bg-paper border border-ink/15 px-2.5 py-1 text-[11.5px] font-medium text-ink/75">
              ~30 sec · No spam
            </span>
          </div>

          <div className="px-5 sm:px-7 py-3.5 space-y-3.5">
            {errorSummary && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-lg border border-danger/35 bg-danger/[0.05] px-3.5 py-2.5 text-[13px] font-medium text-danger flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{errorSummary}</span>
              </div>
            )}

            {/* 1. Goal-First Intent Selector */}
            <fieldset>
              <legend id={needLegendId} className="field-label">
                What do you need help with? <span aria-hidden="true" className="text-danger">*</span>
              </legend>
              <div
                role="radiogroup"
                aria-labelledby={needLegendId}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.need)}
                aria-describedby={fieldErrors.need ? "demo-need-error" : undefined}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
              >
                {NEED_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const checked = values.need === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`group relative flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1.5 rounded-xl border px-3.5 py-2.5 min-h-[48px] cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:border-primary ${
                        checked
                          ? "border-primary bg-primary/[0.06]"
                          : fieldErrors.need
                          ? "border-danger/50 bg-danger/[0.02] hover:border-danger"
                          : "border-ink/30 bg-card hover:border-ink/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="need"
                        value={option.value}
                        checked={checked}
                        onChange={(e) => updateField("need", e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex sm:w-full items-center justify-between gap-2 shrink-0">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                            checked
                              ? "border-primary/30 bg-primary text-white"
                              : "border-ink/15 bg-paper text-ink/75 group-hover:text-ink"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                        </span>
                        <span
                          aria-hidden="true"
                          className={`hidden sm:inline-flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                            checked
                              ? "border-primary bg-primary text-white"
                              : "border-ink/35 bg-card"
                          }`}
                        >
                          {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 sm:flex-none">
                        <span
                          className={`block text-[13.5px] font-semibold leading-tight ${
                            checked ? "text-primaryDark" : "text-ink"
                          }`}
                        >
                          {option.title}
                        </span>
                        <span className="block text-[12px] text-muted leading-snug mt-0.5">
                          {option.detail}
                        </span>
                      </div>
                      <span
                        aria-hidden="true"
                        className={`sm:hidden inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          checked
                            ? "border-primary bg-primary text-white"
                            : "border-ink/35 bg-card"
                        }`}
                      >
                        {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                    </label>
                  );
                })}
              </div>
              <FieldError id="demo-need-error" message={fieldErrors.need} />
            </fieldset>

            {/* 2. Bespoke Segmented GeM Portal Status */}
            <fieldset>
              <legend id={statusLegendId} className="field-label">
                Current GeM portal status <span aria-hidden="true" className="text-danger">*</span>
              </legend>
              <div
                role="radiogroup"
                aria-labelledby={statusLegendId}
                aria-required="true"
                aria-invalid={Boolean(fieldErrors.experience)}
                aria-describedby={fieldErrors.experience ? "demo-experience-error" : undefined}
                className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 rounded-xl border border-ink/25 bg-paper p-1"
              >
                {EXPERIENCE_OPTIONS.map((option) => {
                  const checked = values.experience === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center justify-between gap-2.5 rounded-lg px-3.5 py-2 min-h-[44px] cursor-pointer transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${
                        checked
                          ? "bg-card border border-primary/40 shadow-sm"
                          : "border border-transparent hover:bg-card/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="experience"
                        value={option.value}
                        checked={checked}
                        onChange={(e) => updateField("experience", e.target.value)}
                        className="sr-only"
                      />
                      <span className="min-w-0">
                        <span
                          className={`block text-[13.5px] font-semibold leading-tight ${
                            checked ? "text-primaryDark" : "text-ink"
                          }`}
                        >
                          {option.title}
                        </span>
                        <span className="block text-[11.5px] text-muted leading-snug mt-0.5">
                          {option.detail}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={`h-2.5 w-2.5 rounded-full shrink-0 transition-colors ${
                          checked ? "bg-primary ring-4 ring-primary/15" : "bg-ink/20"
                        }`}
                      />
                    </label>
                  );
                })}
              </div>
              <FieldError id="demo-experience-error" message={fieldErrors.experience} />
            </fieldset>

            {/* 3. Balanced 2x2 Contact & Category Grid */}
            <div className="pt-3.5 border-t border-ink/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label" htmlFor="demo-name">
                  Full name <span aria-hidden="true" className="text-danger">*</span>
                </label>
                <Input
                  id="demo-name"
                  name="name"
                  value={values.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                  placeholder="e.g. Rajesh Verma"
                  autoComplete="name"
                  maxLength={80}
                  required
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "demo-name-error" : undefined}
                />
                <FieldError id="demo-name-error" message={fieldErrors.name} />
              </div>

              <div>
                <label className="field-label" htmlFor="phone">
                  Phone number <span aria-hidden="true" className="text-danger">*</span>
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  value={values.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  maxLength={28}
                  required
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={fieldErrors.phone ? "demo-phone-error" : undefined}
                />
                <FieldError id="demo-phone-error" message={fieldErrors.phone} />
              </div>

              <div>
                <label className="field-label" htmlFor="location">
                  City / State <span aria-hidden="true" className="text-danger">*</span>
                </label>
                <Input
                  id="location"
                  name="location"
                  value={values.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  onBlur={() => handleBlur("location")}
                  placeholder="e.g. Jaipur, Rajasthan"
                  autoComplete="address-level2"
                  maxLength={120}
                  required
                  aria-invalid={Boolean(fieldErrors.location)}
                  aria-describedby={fieldErrors.location ? "demo-location-error" : undefined}
                />
                <FieldError id="demo-location-error" message={fieldErrors.location} />
              </div>

              <div>
                <label className="field-label" htmlFor="category">
                  Business category <span aria-hidden="true" className="text-danger">*</span>
                </label>
                <div className="relative">
                  <select
                    id="category"
                    name="category"
                    value={values.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    onBlur={() => handleBlur("category")}
                    required
                    aria-invalid={Boolean(fieldErrors.category)}
                    aria-describedby={fieldErrors.category ? "demo-category-error" : undefined}
                    className={`field-input pr-10 cursor-pointer ${
                      values.category ? "text-ink" : "text-ink/60"
                    }`}
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="text-ink">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/70"
                    aria-hidden="true"
                  />
                </div>
                <FieldError id="demo-category-error" message={fieldErrors.category} />
              </div>

              {values.category === "other" && (
                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="otherCategory">
                    Specify your category <span aria-hidden="true" className="text-danger">*</span>
                  </label>
                  <Input
                    id="otherCategory"
                    name="otherCategory"
                    value={values.otherCategory}
                    onChange={(e) => updateField("otherCategory", e.target.value)}
                    onBlur={() => handleBlur("otherCategory")}
                    placeholder="e.g. Solar equipment, Transport, Packaging"
                    maxLength={70}
                    required
                    aria-invalid={Boolean(fieldErrors.otherCategory)}
                    aria-describedby={
                      fieldErrors.otherCategory ? "demo-other-category-error" : undefined
                    }
                  />
                  <FieldError
                    id="demo-other-category-error"
                    message={fieldErrors.otherCategory}
                  />
                </div>
              )}
            </div>

            {/* 4. Progressive Disclosure for Optional Details */}
            <div>
              <button
                type="button"
                aria-expanded={showOptional}
                aria-controls={optionalPanelId}
                onClick={() => setShowOptional((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 -ml-2.5 min-h-[44px] text-[13px] font-medium text-primaryDark hover:text-primary hover:bg-primary/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Plus
                  className={`w-4 h-4 transition-transform duration-200 ${
                    showOptional ? "rotate-45" : ""
                  }`}
                  aria-hidden="true"
                />
                <span>
                  {showOptional
                    ? "Hide optional firm name, email & notes"
                    : "Add firm name, email or notes (optional)"}
                </span>
                {!showOptional && optionalCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primaryDark">
                    {optionalCount} added
                  </span>
                )}
              </button>

              {showOptional && (
                <div
                  id={optionalPanelId}
                  className="mt-2.5 rounded-xl border border-ink/15 bg-paper/70 p-3.5 sm:p-4 space-y-3.5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="field-label" htmlFor="business">
                        Business / firm name{" "}
                        <span className="text-muted font-normal">(optional)</span>
                      </label>
                      <Input
                        id="business"
                        name="business"
                        value={values.business}
                        onChange={(e) => updateField("business", e.target.value)}
                        placeholder="e.g. Shree Balaji Traders"
                        autoComplete="organization"
                        maxLength={120}
                      />
                    </div>

                    <div>
                      <label className="field-label" htmlFor="demo-email">
                        Email address{" "}
                        <span className="text-muted font-normal">(optional)</span>
                      </label>
                      <Input
                        id="demo-email"
                        name="email"
                        type="email"
                        value={values.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        onBlur={() => handleBlur("email")}
                        placeholder="name@company.com"
                        autoComplete="email"
                        maxLength={120}
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? "demo-email-error" : undefined}
                      />
                      <FieldError id="demo-email-error" message={fieldErrors.email} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <label className="field-label" htmlFor="msg">
                        Additional notes{" "}
                        <span className="text-muted font-normal">(optional)</span>
                      </label>
                      {values.message.length > 0 && (
                        <span
                          aria-live="polite"
                          className="text-[11.5px] tabular-nums text-muted"
                        >
                          {values.message.length}/1000
                        </span>
                      )}
                    </div>
                    <Textarea
                      id="msg"
                      name="message"
                      rows={2}
                      value={values.message}
                      onChange={(e) => updateField("message", e.target.value)}
                      onBlur={() => handleBlur("message")}
                      maxLength={1000}
                      placeholder="Products you supply, tender deadlines, or preferred call window"
                      aria-invalid={Boolean(fieldErrors.message)}
                      aria-describedby={fieldErrors.message ? "demo-msg-error" : undefined}
                    />
                    <FieldError id="demo-msg-error" message={fieldErrors.message} />
                  </div>
                </div>
              )}
            </div>

            {/* 5. Call Format Preference + Single Dominant Primary CTA */}
            <div className="pt-3.5 border-t border-ink/10 space-y-3">
              <fieldset className="flex flex-wrap items-center justify-between gap-2.5">
                <legend id={formatLegendId} className="text-[13px] font-medium text-ink">
                  Preferred session format
                </legend>
                <div
                  role="radiogroup"
                  aria-labelledby={formatLegendId}
                  className="grid grid-cols-2 w-full sm:w-auto sm:inline-flex gap-1.5 rounded-lg border border-ink/20 bg-paper p-1"
                >
                  {FORMAT_OPTIONS.map((opt) => {
                    const selected = values.type === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`rounded-md px-3 py-2 min-h-[44px] sm:min-h-[36px] inline-flex items-center justify-center text-center text-[12.5px] font-medium cursor-pointer transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${
                          selected
                            ? "bg-card text-primaryDark shadow-sm border border-primary/35"
                            : "text-ink/75 border border-transparent hover:text-ink"
                        }`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={opt.value}
                          checked={selected}
                          onChange={(e) => updateField("type", e.target.value)}
                          className="sr-only"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <Button
                type="submit"
                variant="gold"
                className="w-full min-h-[48px] text-[15px] shadow-[0_10px_22px_-10px_rgb(var(--primary-rgb)/0.55)]"
                disabled={submitting}
              >
                <span>
                  {submitting
                    ? values.type === "callback"
                      ? "Requesting Call Back…"
                      : "Booking Free Live Demo…"
                    : values.type === "callback"
                    ? "Request Free Call Back"
                    : "Book Free Live Demo"}
                </span>
                {!submitting && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
              </Button>

              {serverError && (
                <div
                  role="alert"
                  className="rounded-lg border border-danger/35 bg-danger/[0.05] px-4 py-3 text-sm text-danger space-y-1"
                >
                  <p>{serverError}</p>
                  <p className="text-xs text-ink/80">
                    Prefer talking immediately?{" "}
                    <a
                      href={callHref}
                      className="font-semibold text-primaryDark underline underline-offset-2"
                    >
                      Call {helpline}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Grounded Trust Footer */}
          <div className="bg-paper border-t border-ink/15 px-5 sm:px-7 py-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-ink/75">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-secondary shrink-0" aria-hidden="true" />
              <span>Private &amp; confidential · Never shared</span>
            </span>
            <a
              href={callHref}
              className="inline-flex items-center gap-1.5 font-semibold text-primaryDark hover:text-primary underline-offset-4 hover:underline"
            >
              <PhoneCall className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{helpline}</span>
            </a>
          </div>
        </form>
      )}
    </Card>
  );
}
