/**
 * Static responses when `NEXT_PUBLIC_API_MODE=mock` — simulates CBSE / state-board style
 * Class 10–12 grading and study aids without calling Google Generative Language or Vision APIs.
 */

const MOCK_TAG = "[Credit-safe mock — Pinnacle Software Solution / AI Academy Pro]";

export const MOCK_NOTES_BODY = `${MOCK_TAG}

Summary:
Photosynthesis is the process by which green plants synthesize glucose from CO₂ and water using sunlight, releasing oxygen.

Key Points:
• Chlorophyll in chloroplasts absorbs light energy.
• Light reaction: photolysis of water, NADPH and ATP formation.
• Dark reaction (Calvin cycle): fixation of CO₂ into 3-carbon sugars.

Formula/Definitions:
6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (with light and chlorophyll).

Common Mistakes:
Confusing stomata only with transpiration; forgetting that RuBisCO fixes CO₂ in the stroma.

One-Minute Revision:
“Light makes ATP+NADPH; Calvin uses them to build sugar.”`;

export const MOCK_HOMEWORK_BODY = `${MOCK_TAG}

Concept:
Quadratic equations ax² + bx + c = 0 represent parabolic graphs; roots are x-intercepts.

Step-by-step:
1) Write in standard form. 2) Factor or use discriminant D = b² − 4ac. 3) x = (−b ± √D) / 2a.

Common mistake:
Dropping the ± when taking square roots.

Try this next:
Solve x² − 5x + 6 = 0 by factoring (answer: x = 2, 3).`;

export const MOCK_VEDIC_BODY = `${MOCK_TAG}

(1) Concept: Nikhilam (base) multiplication for numbers near a power of 10 — complements to the base simplify cross-terms.
(2) Example: 97 × 93 → base 100; complements −3 and −7; answer 9021.
(3) Practice: 98 × 96 = ? Hint: (−2)(−4) cross term, 100 − 2 − 4 = 94 → 9408.`;

export function buildMockQuizBlock(topic: string, subject: string, questionCount: number) {
  return {
    quiz: Array.from({ length: questionCount }, (_, idx) => {
      const n = idx + 1;
      return {
        question: `${MOCK_TAG} ${subject} (Class 10/12 style): ${topic} — practice ${n}. Which step shows correct exam technique?`,
        options: [
          "Read the rubric and mark scheme first",
          "Skip units in numerical answers",
          "Leave diagrams unlabelled",
          "Ignore significant figures",
        ],
        answer: "Read the rubric and mark scheme first",
        explanation: "Board marking rewards structured working, correct units, and labelled diagrams.",
      };
    }),
  };
}

export const MOCK_IMAGE_CAPTION = `${MOCK_TAG} No binary image is returned in mock mode — use production mode for inline image data.`;
