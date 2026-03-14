"use client";

import { useState, useEffect } from "react";

type Props = {
  onComplete: (token: string) => void;
  onBack: () => void;
};

export default function CaptchaVerify({ onComplete, onBack }: Props) {
  const [question, setQuestion] = useState("");
  const [token, setToken] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/captcha")
      .then((r) => r.json())
      .then((data) => {
        setQuestion(data.question);
        setToken(data.token);
        setLoading(false);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const decoded = JSON.parse(
        Buffer.from(token, "base64url").toString("utf-8")
      );
      const expected =
        decoded.op === "+" ? decoded.a + decoded.b : decoded.a - decoded.b;

      if (parseInt(answer) === expected) {
        onComplete(token);
      } else {
        setError(true);
        setAnswer("");
        // Refresh question
        fetch("/api/captcha")
          .then((r) => r.json())
          .then((data) => {
            setQuestion(data.question);
            setToken(data.token);
            setError(false);
          });
      }
    } catch {
      setError(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Human Verification
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Please answer this simple question to continue.
      </p>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{question}</p>
          </div>

          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full px-4 py-3 text-center text-xl font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your answer"
            autoFocus
          />

          {error && (
            <p className="text-sm text-red-600 text-center">
              Wrong answer. Try again.
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!answer}
              className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
