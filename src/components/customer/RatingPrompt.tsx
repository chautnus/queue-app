"use client";

import { useState } from "react";

const STARS = [1, 2, 3, 4, 5];

type Props = {
  ticketId: string;
  onDone: () => void;
};

export default function RatingPrompt({ ticketId, onDone }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;

    await fetch(`/api/tickets/${ticketId}/rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });

    setSubmitted(true);
    setTimeout(onDone, 2000);
  };

  if (submitted) {
    return (
      <div className="bg-green-50 rounded-2xl border border-green-200 p-6 text-center">
        <div className="text-4xl mb-2">🙏</div>
        <p className="font-semibold text-green-800">Thank you for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 text-center mb-1">
        How was your experience?
      </h3>
      <p className="text-sm text-gray-500 text-center mb-5">
        Rate your service quality
      </p>

      <div className="flex justify-center gap-2 mb-4">
        {STARS.map((s) => (
          <button
            key={s}
            onClick={() => setRating(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className="text-4xl transition-transform hover:scale-110"
          >
            <span
              className={
                s <= (hover || rating) ? "text-yellow-400" : "text-gray-200"
              }
            >
              ★
            </span>
          </button>
        ))}
      </div>

      {rating > 0 && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional comments..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />
      )}

      <div className="flex gap-3">
        <button
          onClick={onDone}
          className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 text-sm"
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={!rating}
          className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40 text-sm"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
