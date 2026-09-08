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
  )}&body=${encodeURIComponent(summary || "Hi Harrison — I'd like to talk about a project.")}`;

  return (
    <div className="rounded-xl border border-fun-gray bg-black/20 overflow-hidden text-left">
      <div className="border-b border-fun-gray px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-bold">Project assistant</p>
          <p className="text-xs text-fun-gray">
            A quick guided chat — full AI streaming lands next.
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
              onClick={() => setStepIndex(5)}
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
            <a
              href={mailto}
              className="inline-flex rounded-full bg-fun-pink px-5 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              Send via email
            </a>
            <p className="text-xs text-fun-gray">
              Opens your mail client with this summary. A stored lead inbox
              arrives with the admin portal.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default HireAssistant;
