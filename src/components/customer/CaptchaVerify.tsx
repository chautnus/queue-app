"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

type Props = {
  onComplete: (token: string, answer: number) => void;
  onBack: () => void;
};

export default function CaptchaVerify({ onComplete, onBack }: Props) {
  const t = useTranslations("customer");
  const tc = useTranslations("common");
  const [question, setQuestion] = useState("");
  const [token, setToken] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCaptcha = () => {
    setLoading(true);
    fetch("/api/captcha")
      .then((r) => r.json())
      .then((data) => {
        setQuestion(data.question);
        setToken(data.token);
        setLoading(false);
        setError(false);
      });
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(answer);
    if (isNaN(num)) {
      setError(true);
      return;
    }
    // Pass token + answer to parent — server will validate
    onComplete(token, num);
  };

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">
        {t("captcha_title")}
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        {t("captcha_desc")}
      </p>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{question}</p>
          </div>

          <input
            type="number"
            value={answer}
            onChange={(e) => { setAnswer(e.target.value); setError(false); }}
            className="input text-center text-xl font-bold"
            placeholder={t("captcha_answer")}
            autoFocus
          />

          {error && (
            <p className="text-sm text-red-600 text-center">
              {t("captcha_wrong")}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 btn-outline"
            >
              {tc("back")}
            </button>
            <button
              type="submit"
              disabled={!answer}
              className="flex-1 py-3 btn-primary"
            >
              {tc("continue")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
