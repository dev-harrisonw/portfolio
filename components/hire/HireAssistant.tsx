import React, { useMemo, useState } from "react";
import { budgetBands, services, timelines } from "@/data/content/services";

type Answers = {
  serviceId?: string;
  timeline?: string;
  budget?: string;
  details?: string;
  email?: string;
};

const steps = ["type", "timeline", "budget", "details", "contact", "done"] as const;

function HireAssistant() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [aiInput, setAiInput] = useState("");
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const step = steps[stepIndex];

  const service = useMemo(
    () => services.find((s) => s.id === answers.serviceId),
    [answers.serviceId]
  );

  const summary = useMemo(() => {
    return [
      service ? `Project type: ${service.title}` : null,
      answers.timeline ? `Timeline: ${answers.timeline}` : null,
      answers.budget ? `Budget: ${answers.budget}` : null,
      answers.details ? `Notes: ${answers.details}` : null,
      answers.email ? `Email: ${answers.email}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }, [answers, service]);

  const mailto = `mailto:me@harrisonwarburton.com?subject=${encodeURIComponent(
    "Project enquiry"
  )}&body=${encodeURIComponent(
    summary || "Hi Harrison — I'd like to talk about a project."
  )}`;

  const askAi = async () => {
    setAiLoading(true);
    setAiReply(null);
    try {
      const res = await fetch("/api/hire/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: aiInput || "What can you help me build?",
          answers,
        }),
      });
      const data = await res.json();
      setAiReply(data.reply || data.error || "No reply");
    } catch {
      setAiReply("Could not reach the assistant right now.");
    }
    setAiLoading(false);
  };

  const persistLead = async () => {
    if (!answers.email) return;
    setSaveError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: answers.email,
          service: service?.title,
          timeline: answers.timeline,
          budget: answers.budget,
          details: answers.details,
          summary,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error || "Could not save enquiry");
        return;
      }
      setSaved(true);
    } catch {
      setSaveError("Could not save enquiry");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-fun-gray bg-black/20 overflow-hidden text-left">
        <div className="border-b border-fun-gray px-4 py-3">
          <p className="font-bold">Ask the assistant</p>
          <p className="text-xs text-fun-gray">Optional — skip this and use the steps below.</p>
        </div>
        <div className="p-4 space-y-3">
          <textarea
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            rows={2}
            placeholder="e.g. I need a booking site for my club…"
            className="w-full rounded-lg bg-bg border border-fun-gray px-3 py-2 text-sm text-white outline-none focus:border-fun-pink"
          />
          <button
            type="button"
            onClick={askAi}
            disabled={aiLoading}
            className="rounded-full border border-fun-pink text-fun-pink px-4 py-2 text-sm font-bold hover:bg-fun-pink hover:text-white transition-colors disabled:opacity-40"
          >
            {aiLoading ? "Thinking…" : "Ask"}
          </button>
          {aiReply && (
            <pre className="rounded-lg bg-bg border border-fun-gray p-3 text-sm text-white/90 whitespace-pre-wrap font-sans">
              {aiReply}
            </pre>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-fun-gray bg-black/20 overflow-hidden text-left">
        <div className="border-b border-fun-gray px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-bold">Guided enquiry</p>
            <p className="text-xs text-fun-gray">
              Structured answers → email + admin leads inbox
            </p>
          </div>
          <span className="text-xs text-fun-gray">
            Step {Math.min(stepIndex + 1, steps.length - 1)}/{steps.length - 1}
          </span>
        </div>

        <div className="p-4 md:p-6 space-y-4 min-h-[280px]">
          {step === "type" && (
            <>
              <p className="text-lg">
                Nice — I&apos;ll help you get a website (or app) moving. What are
                you after?
              </p>
              <div className="grid gap-2">
                {services.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setAnswers((a) => ({ ...a, serviceId: item.id }));
                      setStepIndex(1);
                    }}
                    className="rounded-lg border border-fun-gray px-4 py-3 text-left hover:border-fun-pink transition-colors"
                  >
                    <span className="font-semibold block">{item.title}</span>
                    <span className="text-sm text-fun-gray">{item.blurb}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "timeline" && (
            <>
              <p className="text-lg">When do you want this live?</p>
              <div className="flex flex-wrap gap-2">
                {timelines.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setAnswers((a) => ({ ...a, timeline: item }));
                      setStepIndex(2);
                    }}
                    className="rounded-full border border-fun-gray px-4 py-2 text-sm hover:border-fun-pink hover:text-fun-pink transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "budget" && (
            <>
              <p className="text-lg">Rough budget band?</p>
              <div className="flex flex-wrap gap-2">
                {budgetBands.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setAnswers((a) => ({ ...a, budget: item }));
                      setStepIndex(3);
                    }}
                    className="rounded-full border border-fun-gray px-4 py-2 text-sm hover:border-fun-pink hover:text-fun-pink transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "details" && (
            <>
              <p className="text-lg">Anything else I should know?</p>
              <textarea
                value={answers.details || ""}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, details: e.target.value }))
                }
                rows={4}
                placeholder="Goals, reference sites, must-haves…"
                className="w-full rounded-lg bg-bg border border-fun-gray px-3 py-2 text-sm text-white outline-none focus:border-fun-pink"
              />
              <button
                type="button"
                onClick={() => setStepIndex(4)}
                className="rounded-full bg-fun-pink px-5 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                Continue
              </button>
            </>
          )}

          {step === "contact" && (
            <>
              <p className="text-lg">Where should I reply?</p>
              <input
                type="email"
                value={answers.email || ""}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, email: e.target.value }))
                }
                placeholder="you@company.com"
                className="w-full rounded-lg bg-bg border border-fun-gray px-3 py-2 text-sm text-white outline-none focus:border-fun-pink"
              />
              <button
                type="button"
                disabled={!answers.email}
                onClick={async () => {
                  await persistLead();
                  setStepIndex(5);
                }}
                className="rounded-full bg-fun-pink px-5 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
              >
                Review enquiry
              </button>
            </>
          )}

          {step === "done" && (
            <>
              <p className="text-lg font-semibold text-fun-pink">
                Looking good — here&apos;s your summary.
              </p>
              <pre className="rounded-lg bg-bg border border-fun-gray p-3 text-xs text-fun-gray whitespace-pre-wrap font-monospace">
                {summary}
              </pre>
              {saved && (
                <p className="text-sm text-fun-pink">
                  Enquiry saved — I&apos;ll also see it in the admin inbox.
                </p>
              )}
              {saveError && (
                <p className="text-sm text-red-400">{saveError}</p>
              )}
              <div className="flex flex-wrap gap-3">
                <a
                  href={mailto}
                  className="inline-flex rounded-full bg-fun-pink px-5 py-2 text-sm font-bold text-white hover:opacity-90"
                >
                  Send via email
                </a>
                {!saved && (
                  <button
                    type="button"
                    onClick={persistLead}
                    className="rounded-full border border-fun-pink text-fun-pink px-5 py-2 text-sm font-bold"
                  >
                    Save to inbox
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default HireAssistant;
