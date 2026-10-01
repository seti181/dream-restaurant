// Little celebrations: stars that pop in one by one, and confetti for good news.
// All CSS animation, light enough for a budget tablet. See project.md section 9.

import { useState } from 'react';

/** A 1–5 star rating whose stars pop in one after another. */
export function StarRow({ stars, delay = 0 }: { stars: number; delay?: number }) {
  return (
    <span className="star-row" aria-label={`${stars} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="star-pop" style={{ animationDelay: `${delay + i * 0.08}s` }}>
          {i < stars ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

const CONFETTI_COLOURS = ['#b5452f', '#e9a23b', '#2f6f8f', '#3c7a3a', '#7b4f9d', '#f4c531'];

/** Confetti falling over the screen once. It never blocks a tap. */
export function Confetti({ pieces = 28 }: { pieces?: number }) {
  // Placed once when it appears; the animation does the rest.
  const [confetti] = useState(() =>
    Array.from({ length: pieces }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2.2 + Math.random() * 1.5,
      colour: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
      turn: Math.round(Math.random() * 720 - 360),
    })),
  );
  return (
    <div className="confetti" aria-hidden="true">
      {confetti.map((piece, i) => (
        <span
          key={i}
          style={{
            left: `${piece.left}%`,
            background: piece.colour,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            ['--turn' as string]: `${piece.turn}deg`,
          }}
        />
      ))}
    </div>
  );
}
