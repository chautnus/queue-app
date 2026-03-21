"use client";

import { useState, useEffect } from "react";

type Props = {
  onComplete: (token: string, answer: number) => void;
  onBack: () => void;
};

export default function CaptchaVerify({ onComplete, onBack }: Props) {
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
        Xac minh ban la nguoi
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Tra loi phep tinh de tiep tuc.
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
            placeholder="Dap an"
            autoFocus
          />

          {error && (
            <p className="text-sm text-red-600 text-center">
              Sai dap an. Thu lai.
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 btn-outline"
            >
              Quay lai
            </button>
            <button
              type="submit"
              disabled={!answer}
              className="flex-1 py-3 btn-primary"
            >
              Tiep tuc
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
