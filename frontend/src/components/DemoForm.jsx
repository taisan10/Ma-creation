import { useState } from "react";
import { api } from "../lib/api";
import { Button } from "./ui/Button";
import { Card, CardContent } from "./ui/Card";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";

export default function DemoForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function handleSubmit(e, type) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSubmitted(false);
    const form = new FormData(e.currentTarget);
    try {
      await api("/leads", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          company: form.get("company"),
          message: form.get("msg"),
          type,
        }),
      });
      setSubmitted(true);
      e.currentTarget.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <Card className="shadow-card">
      <CardContent className="p-7">
        <form
          onSubmit={(e) =>
            handleSubmit(e, e.nativeEvent.submitter?.dataset.type || "demo")
          }
        >
          <div className="mb-4">
            <label className="field-label" htmlFor="name">
              Full name
            </label>
            <Input
              id="name"
              name="name"
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="phone">
                Contact number
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="field-label" htmlFor="company">
              Company name
            </label>
            <Input
              id="company"
              name="company"
              placeholder="Your business / firm name"
            />
          </div>
          <div className="mb-5">
            <label className="field-label" htmlFor="msg">
              Message
            </label>
            <Textarea
              id="msg"
              name="msg"
              rows={4}
              placeholder="Tell us what you need help with"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              type="submit"
              data-type="demo"
              variant="gold"
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Sending…" : "Book Free Live Demo"}
            </Button>
            <Button
              type="submit"
              data-type="callback"
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Arrange Call Back
            </Button>
          </div>
          {submitted && (
            <div
              role="status"
              className="mt-5 bg-accent/20 border border-goldlight rounded px-4 py-4 text-[13.5px] text-ink/70"
            >
              <strong className="text-ink">Request submitted.</strong> Our team
              can now follow up from the admin lead queue.
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="mt-5 rounded border border-rust/30 bg-rust/5 px-4 py-3 text-sm text-rust"
            >
              {error}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
