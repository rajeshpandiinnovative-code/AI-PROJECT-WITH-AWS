/**
 * Module-specific MCQs for UniversalModuleWorkbench challenge tab.
 * Each bank has 4 questions aligned to the module’s blueprint focus.
 */

export type ModuleChallengeQuestion = {
  id: number;
  prompt: string;
  options: [string, string, string, string];
  answer: string;
  explanation: string;
};

const four = (
  questions: Omit<ModuleChallengeQuestion, "id">[],
): ModuleChallengeQuestion[] => questions.map((q, i) => ({ ...q, id: i + 1 }));

export const MODULE_CHALLENGE_BANKS: Record<string, ModuleChallengeQuestion[]> = {
  "speed-tricks": four([
    {
      prompt: "When pacing a timed section, what should you do first?",
      options: [
        "Attempt questions strictly in order only",
        "Skim marks-per-minute and budget time per block",
        "Spend equal time on every question",
        "Skip reading instructions to save time",
      ],
      answer: "Skim marks-per-minute and budget time per block",
      explanation: "Quick budgeting aligns effort with marks and avoids getting stuck early.",
    },
    {
      prompt: "If you are stuck past your time budget on one question, the best move is:",
      options: ["Keep pushing until solved", "Flag and move on", "Guess randomly", "Leave the exam"],
      answer: "Flag and move on",
      explanation: "Protecting overall coverage usually beats one stubborn item in competitive timing.",
    },
    {
      prompt: "Which shortcut habit most improves arithmetic speed safely?",
      options: [
        "Always use the longest accurate method",
        "Pick the shortest valid method you can verify quickly",
        "Avoid estimation entirely",
        "Copy neighbors’ steps",
      ],
      answer: "Pick the shortest valid method you can verify quickly",
      explanation: "Speed tricks must remain correct—quick verification beats blind shortcuts.",
    },
    {
      prompt: "In the last minute of a section you should prioritize:",
      options: [
        "Starting a new hard problem",
        "Legibility checks on diagrams only",
        "Quick wins: bubbling pending MCQs and reviewing flagged items",
        "Redoing entire rough work",
      ],
      answer: "Quick wins: bubbling pending MCQs and reviewing flagged items",
      explanation: "Harvest easy marks and secure attempts before time expires.",
    },
  ]),

  "memory-techniques": four([
    {
      prompt: "Which practice strengthens long-term retention most?",
      options: [
        "Only reread notes passively",
        "Spaced retrieval with short self-tests",
        "One marathon cram session",
        "Highlighting without recall",
      ],
      answer: "Spaced retrieval with short self-tests",
      explanation: "Active recall spaced over days beats passive rereading for durable memory.",
    },
    {
      prompt: "Chunking helps memory by:",
      options: [
        "Ignoring patterns",
        "Grouping items into fewer meaningful units",
        "Studying longer without breaks",
        "Avoiding mnemonics",
      ],
      answer: "Grouping items into fewer meaningful units",
      explanation: "Chunks reduce cognitive load and make recall faster.",
    },
    {
      prompt: "A strong memory hook usually combines:",
      options: [
        "Random letters only",
        "Vivid image + story linking to the concept",
        "Copying the textbook verbatim",
        "Avoiding examples",
      ],
      answer: "Vivid image + story linking to the concept",
      explanation: "Elaboration and imagery glue abstract facts to recall cues.",
    },
    {
      prompt: "After learning new facts today, when should you review?",
      options: [
        "Only next month",
        "Soon (same day) + within 48 hours",
        "Never review until exam week",
        "Only if you feel bored",
      ],
      answer: "Soon (same day) + within 48 hours",
      explanation: "Early spaced reviews interrupt forgetting curves.",
    },
  ]),

  "handwriting-improvement": four([
    {
      prompt: "What most improves evaluator readability under time pressure?",
      options: [
        "Tiny cram-packed lines",
        "Uniform letter height and consistent spacing",
        "Decorative loops on every letter",
        "Random margin sizes",
      ],
      answer: "Uniform letter height and consistent spacing",
      explanation: "Predictable structure reduces misreads and scoring friction.",
    },
    {
      prompt: "When writing math steps for exams, best practice is:",
      options: [
        "Skip equals signs to save space",
        "One clear step per line with aligned symbols",
        "Mix rough and fair work randomly",
        "Write diagonally across the page",
      ],
      answer: "One clear step per line with aligned symbols",
      explanation: "Structured steps help partial credit and self-checking.",
    },
    {
      prompt: "To balance speed and neatness, you should:",
      options: [
        "Never plan layout",
        "Leave quick margins and baseline guides mentally before starting",
        "Use ultra-thin pen only",
        "Avoid paragraphs entirely",
      ],
      answer: "Leave quick margins and baseline guides mentally before starting",
      explanation: "A simple layout plan prevents messy corrections.",
    },
    {
      prompt: "Underline key terms best when:",
      options: [
        "Every word is underlined",
        "Straight single underlines on defined terms only",
        "You triple-underline randomly",
        "You circle entire paragraphs",
      ],
      answer: "Straight single underlines on defined terms only",
      explanation: "Signal keywords without cluttering the answer.",
    },
  ]),

  "neet-jee-daily-mcqs": four([
    {
      prompt: "Daily MCQ practice is most effective when you:",
      options: [
        "Only track total attempts",
        "Tag errors by chapter/concept and revise weak tags",
        "Never review solutions",
        "Always guess to finish faster",
      ],
      answer: "Tag errors by chapter/concept and revise weak tags",
      explanation: "Diagnosis turns volume into targeted improvement.",
    },
    {
      prompt: "Early in preparation, guessing heavily tends to:",
      options: [
        "Build reliable intuition immediately",
        "Hide real gaps and distort accuracy signals",
        "Replace theory study",
        "Guarantee rank improvement",
      ],
      answer: "Hide real gaps and distort accuracy signals",
      explanation: "First build concept accuracy; use guessing strategically later.",
    },
    {
      prompt: "After a timed MCQ set, priority one should be:",
      options: [
        "Start another set immediately without review",
        "Analyze each wrong and ambiguous option",
        "Memorize entire solutions verbatim only",
        "Ignore PYQs",
      ],
      answer: "Analyze each wrong and ambiguous option",
      explanation: "Option-level review fixes reasoning, not just outcomes.",
    },
    {
      prompt: "For physics/math numeric traps, a strong habit is:",
      options: [
        "Skip units",
        "Dimensional sanity check before marking",
        "Trust calculator blindly",
        "Round aggressively mid-calculation",
      ],
      answer: "Dimensional sanity check before marking",
      explanation: "Units and orders-of-magnitude catch common slips.",
    },
  ]),

  "tnpsc-prep": four([
    {
      prompt: "TNPSC success usually requires blending:",
      options: [
        "Only national news",
        "Static facts + current affairs links",
        "Only optional subjects",
        "Random trivia",
      ],
      answer: "Static facts + current affairs links",
      explanation: "State exams reward connecting syllabus facts to recent context.",
    },
    {
      prompt: "For bilingual terminology, a practical habit is:",
      options: [
        "Ignore Tamil keywords",
        "Keep a small parallel list (Tamil/English) for high-frequency terms",
        "Translate everything mid-exam",
        "Use only one language in notes",
      ],
      answer: "Keep a small parallel list (Tamil/English) for high-frequency terms",
      explanation: "Parallel mapping speeds comprehension in mixed papers.",
    },
    {
      prompt: "Short daily revision blocks help because:",
      options: [
        "They replace mock tests entirely",
        "They fight forgetting on scattered factual topics",
        "They remove need for sleep",
        "They guarantee exact repeats next year",
      ],
      answer: "They fight forgetting on scattered factual topics",
      explanation: "Distributed recall beats one-off cram for wide syllabi.",
    },
    {
      prompt: "When selecting questions to attempt first:",
      options: [
        "Always start from last page",
        "Skim for comfort topics with reliable payoff",
        "Spend equal time per question blindly",
        "Avoid PYQ patterns",
      ],
      answer: "Skim for comfort topics with reliable payoff",
      explanation: "Secure confidence and marks early; manage harder items next.",
    },
  ]),

  "rank-predictor": four([
    {
      prompt: "Rank trajectory is best inferred from:",
      options: [
        "One lucky mock score",
        "Trend across multiple comparable tests",
        "Social media polls",
        "Peer gossip",
      ],
      answer: "Trend across multiple comparable tests",
      explanation: "Signal needs consistency; single spikes are noisy.",
    },
    {
      prompt: "Variance across weak topics suggests:",
      options: [
        "Ignore weak topics",
        "Instability—prioritize targeted remediation",
        "You should guess more",
        "Theory is irrelevant",
      ],
      answer: "Instability—prioritize targeted remediation",
      explanation: "High variance means outcomes depend on item mix—reduce weak-topic randomness.",
    },
    {
      prompt: "When comparing percentiles across tests, you should:",
      options: [
        "Ignore difficulty differences",
        "Normalize by test difficulty/cohort when possible",
        "Trust raw marks only",
        "Compare only with friends",
      ],
      answer: "Normalize by test difficulty/cohort when possible",
      explanation: "Percentiles depend on paper hardness—context matters.",
    },
    {
      prompt: "A weekly plan based on rank signals should:",
      options: [
        "Never change",
        "Adjust after reviewing errors and trend",
        "Only add new subjects randomly",
        "Drop mocks entirely",
      ],
      answer: "Adjust after reviewing errors and trend",
      explanation: "Plans should respond to evidence, not vibes.",
    },
  ]),

  "weak-area-detection": four([
    {
      prompt: "First step after labeling a topic weak is:",
      options: [
        "Avoid it until exams",
        "Diagnose: concept gap vs careless vs speed issue",
        "Only watch videos",
        "Copy solved examples once",
      ],
      answer: "Diagnose: concept gap vs careless vs speed issue",
      explanation: "Different root causes need different fixes.",
    },
    {
      prompt: "Patching a weak topic fully before switching topics helps because:",
      options: [
        "Syllabus shrinks magically",
        "It prevents half-fixed gaps that fail under mixed papers",
        "Coaching requires it legally",
        "You never need revision",
      ],
      answer: "It prevents half-fixed gaps that fail under mixed papers",
      explanation: "Partial fixes collapse when questions combine concepts.",
    },
    {
      prompt: "Re-testing a patched weak topic within ~72 hours:",
      options: [
        "Is useless",
        "Strengthens consolidation before forgetting returns",
        "Replaces sleep",
        "Guarantees full marks forever",
      ],
      answer: "Strengthens consolidation before forgetting returns",
      explanation: "Timely retrieval after remediation locks learning.",
    },
    {
      prompt: "Error logs work best when they record:",
      options: [
        "Only final answers",
        "Mistake type, trigger pattern, and corrected rule",
        "Random doodles",
        "Teacher blame only",
      ],
      answer: "Mistake type, trigger pattern, and corrected rule",
      explanation: "Actionable logs convert errors into prevention next time.",
    },
  ]),

  "voice-tutor": four([
    {
      prompt: "Explaining aloud helps learning mainly by:",
      options: [
        "Replacing practice",
        "Exposing gaps in reasoning and strengthening retrieval",
        "Avoiding examples",
        "Making noise only",
      ],
      answer: "Exposing gaps in reasoning and strengthening retrieval",
      explanation: "Teaching-style explanation forces coherent understanding.",
    },
    {
      prompt: "A strong 60-second explanation structure is:",
      options: [
        "Jargon first, definition never",
        "Plain definition → example → one-line takeaway",
        "Read the textbook faster",
        "List unrelated facts",
      ],
      answer: "Plain definition → example → one-line takeaway",
      explanation: "Simple framing plus example aids listener and self-check.",
    },
    {
      prompt: "Using a counterexample is useful when:",
      options: [
        "You want to confuse everyone",
        "You need to clarify boundaries of a rule",
        "You never give examples",
        "You skip definitions",
      ],
      answer: "You need to clarify boundaries of a rule",
      explanation: "Counterexamples sharpen where a method applies.",
    },
    {
      prompt: "If you stumble while explaining, you should:",
      options: [
        "Memorize unrelated script",
        "Pause, restate simply, and fix the gap with one extra example",
        "Switch topics abruptly",
        "Stop studying forever",
      ],
      answer: "Pause, restate simply, and fix the gap with one extra example",
      explanation: "Stumbles mark real learning opportunities—patch immediately.",
    },
  ]),

  "public-speaking": four([
    {
      prompt: "A strong opening hook should:",
      options: [
        "Apologize for speaking",
        "State one clear purpose or question for the audience",
        "List your resume for 5 minutes",
        "Whisper without eye contact",
      ],
      answer: "State one clear purpose or question for the audience",
      explanation: "Hooks orient listeners and earn attention fast.",
    },
    {
      prompt: "Pauses are preferable to filler words because:",
      options: [
        "They waste more time",
        "They sound confident and give listeners processing time",
        "Judges hate silence",
        "They replace content",
      ],
      answer: "They sound confident and give listeners processing time",
      explanation: "Controlled silence beats um/uh clutter.",
    },
    {
      prompt: "Closing strongly means:",
      options: [
        "Introducing brand-new arguments",
        "One memorable line + clear call-to-action or recap",
        "Stopping mid-sentence",
        "Thanking only",
      ],
      answer: "One memorable line + clear call-to-action or recap",
      explanation: "Last impression anchors recall.",
    },
    {
      prompt: "Managing nervous energy starts best with:",
      options: [
        "No preparation",
        "Breathing reset + practiced opening lines",
        "Avoiding rehearsal",
        "Caffeine overload only",
      ],
      answer: "Breathing reset + practiced opening lines",
      explanation: "Physiological calm + muscle memory reduce panic spikes.",
    },
  ]),

  "coding-for-kids": four([
    {
      prompt: "Before coding logic, you should clarify:",
      options: ["Screen brightness only", "Input, steps (process), output", "Font choice", "Wallpaper"],
      answer: "Input, steps (process), output",
      explanation: "IPO framing is the backbone of algorithms.",
    },
    {
      prompt: "Breaking a problem into tiny steps helps because:",
      options: [
        "It removes need to test",
        "Each step can be checked and debugged independently",
        "More steps always mean slower code",
        "Computers dislike loops",
      ],
      answer: "Each step can be checked and debugged independently",
      explanation: "Decomposition makes errors local and fixable.",
    },
    {
      prompt: "Testing with one simple example input is meant to:",
      options: [
        "Replace thinking",
        "Verify your logic matches expected behavior early",
        "Prove infinite cases",
        "Avoid pseudocode",
      ],
      answer: "Verify your logic matches expected behavior early",
      explanation: "Concrete traces catch mistakes cheaply.",
    },
    {
      prompt: "If-then reasoning expresses:",
      options: [
        "Random choices",
        "Conditions and decisions in sequence",
        "Only graphics",
        "Hardware brands",
      ],
      answer: "Conditions and decisions in sequence",
      explanation: "Conditionals model real-world branching logic.",
    },
  ]),

  robotics: four([
    {
      prompt: "A basic robot loop often follows:",
      options: [
        "Output only",
        "Sense → decide/act → feedback",
        "Random motion forever",
        "Ignore sensors",
      ],
      answer: "Sense → decide/act → feedback",
      explanation: "Closed-loop control adapts to the environment.",
    },
    {
      prompt: "Prototyping quickly matters because:",
      options: [
        "Final design never changes",
        "Early tests reveal constraints before heavy optimization",
        "Sensors are illegal",
        "CAD replaces hardware",
      ],
      answer: "Early tests reveal constraints before heavy optimization",
      explanation: "Iterate with evidence, then refine.",
    },
    {
      prompt: "Defining input clearly prevents:",
      options: [
        "Creativity",
        "Ambiguous sensor interpretation and unstable behavior",
        "Motors",
        "Wheels",
      ],
      answer: "Ambiguous sensor interpretation and unstable behavior",
      explanation: "Explicit thresholds and units stabilize programs.",
    },
    {
      prompt: "Measuring after each design change helps:",
      options: [
        "Avoid iteration",
        "Know whether the change actually improved performance",
        "Skip documentation",
        "Eliminate safety",
      ],
      answer: "Know whether the change actually improved performance",
      explanation: "Evidence-driven iteration beats guessing.",
    },
  ]),

  "financial-literacy": four([
    {
      prompt: "A healthy monthly flow starts with:",
      options: [
        "Spend first, save leftovers",
        "Define needs vs wants and budget savings early",
        "Ignore small expenses",
        "Borrow for routine wants",
      ],
      answer: "Define needs vs wants and budget savings early",
      explanation: "Pay-yourself-first prevents leakage.",
    },
    {
      prompt: "Emergency funds exist to:",
      options: [
        "Fund impulse buys",
        "Cover surprises without high-interest debt",
        "Replace income forever",
        "Avoid banks",
      ],
      answer: "Cover surprises without high-interest debt",
      explanation: "Buffers protect learning and household stability.",
    },
    {
      prompt: "Tracking small expenses weekly matters because:",
      options: [
        "They never add up",
        "Leaks compound silently into big gaps",
        "Cash has no record",
        "Digital money is fake",
      ],
      answer: "Leaks compound silently into big gaps",
      explanation: "Micro-spend visibility fixes blind spots.",
    },
    {
      prompt: "Comparing loans, the key habit is:",
      options: [
        "Look at EMI only",
        "Check total cost, fees, and APR-like annual burden",
        "Choose longest tenure blindly",
        "Ignore fine print",
      ],
      answer: "Check total cost, fees, and APR-like annual burden",
      explanation: "Headline EMI hides fees and term traps.",
    },
  ]),

  "focus-exercises": four([
    {
      prompt: "Deep-focus blocks work best when:",
      options: [
        "Phone is within reach",
        "Phone is away and distractions are batch-processed after the block",
        "Multitasking social feeds",
        "No goal for the block",
      ],
      answer: "Phone is away and distractions are batch-processed after the block",
      explanation: "Environment design beats willpower in long sessions.",
    },
    {
      prompt: "Starting with the hardest task uses:",
      options: [
        "Evening energy peak always",
        "Fresh attention when cognitive fuel is highest",
        "Random ordering",
        "Only easy tasks",
      ],
      answer: "Fresh attention when cognitive fuel is highest",
      explanation: "Hard-first avoids procrastination eating the day.",
    },
    {
      prompt: "A planned break after ~25–30 minutes helps by:",
      options: [
        "Destroying flow always",
        "Resetting attention and preventing burnout errors",
        "Replacing sleep forever",
        "Adding social media scrolling mid-task",
      ],
      answer: "Resetting attention and preventing burnout errors",
      explanation: "Paced recovery sustains quality across sessions.",
    },
    {
      prompt: "Two short focus sessions beat one marathon when:",
      options: [
        "You never take breaks",
        "Attention quality drops late—split preserves accuracy",
        "You dislike chairs",
        "Timer apps are banned",
      ],
      answer: "Attention quality drops late—split preserves accuracy",
      explanation: "Match human attention curves.",
    },
  ]),

  "exam-stress-management": four([
    {
      prompt: "A night-before checklist reduces anxiety by:",
      options: [
        "Adding surprises",
        "Reducing last-minute decisions and panic spikes",
        "Replacing study entirely",
        "Guaranteeing perfect scores",
      ],
      answer: "Reducing last-minute decisions and panic spikes",
      explanation: "Predictable logistics calm the nervous system.",
    },
    {
      prompt: "Breath control during panic primarily:",
      options: [
        "Raises heart rate more",
        "Downshifts fight-or-flight activation",
        "Stops thinking permanently",
        "Replaces knowing content",
      ],
      answer: "Downshifts fight-or-flight activation",
      explanation: "Physiology-first resets clarity for problem solving.",
    },
    {
      prompt: "Replacing “I will fail” with process cues works because:",
      options: [
        "Words never matter",
        "It redirects attention to controllable next actions",
        "Judges read minds",
        "Negative talk helps speed",
      ],
      answer: "It redirects attention to controllable next actions",
      explanation: "Self-talk that focuses on steps beats outcome catastrophizing.",
    },
    {
      prompt: "Mock tests reduce stress mainly when used to:",
      options: [
        "Torture confidence",
        "Simulate timing and build predictable routines",
        "Memorize exact questions",
        "Avoid sleep",
      ],
      answer: "Simulate timing and build predictable routines",
      explanation: "Familiarity lowers novelty panic on exam day.",
    },
  ]),

  "habit-tracker": four([
    {
      prompt: "New habits stick better when attached to:",
      options: [
        "Random times daily",
        "An existing routine anchor (after brushing, before dinner)",
        "Willpower spikes only",
        "Punishment only",
      ],
      answer: "An existing routine anchor (after brushing, before dinner)",
      explanation: "Habit stacking piggybacks stable cues.",
    },
    {
      prompt: "Tiny starting targets help because:",
      options: [
        "Big leaps never fail",
        "They reduce friction so streaks begin reliably",
        "They replace goals",
        "They avoid measurement",
      ],
      answer: "They reduce friction so streaks begin reliably",
      explanation: "Consistency first—scale after the habit exists.",
    },
    {
      prompt: "Missing one day should usually mean:",
      options: [
        "Quit forever",
        "Reset gently next day without guilt spiral",
        "Double punishment",
        "Hide the tracker",
      ],
      answer: "Reset gently next day without guilt spiral",
      explanation: "Shame loops kill streaks more than missed days.",
    },
    {
      prompt: "Weekly habit reviews should focus on:",
      options: [
        "Blame only",
        "Friction points (what made skip days easy)",
        "Deleting all goals",
        "Ignoring data",
      ],
      answer: "Friction points (what made skip days easy)",
      explanation: "Reduce friction, not motivation speeches.",
    },
  ]),

  "screen-time-monitor": four([
    {
      prompt: "Healthy digital balance starts with:",
      options: [
        "Unlimited scroll",
        "Defined intentional slots for study vs entertainment",
        "Deleting all devices",
        "Only night usage",
      ],
      answer: "Defined intentional slots for study vs entertainment",
      explanation: "Boundaries beat vague “use less.”",
    },
    {
      prompt: "Offline revision after online sessions helps because:",
      options: [
        "Paper is always slower",
        "It strengthens recall without dependency on cues from feeds",
        "Wi‑Fi improves memory",
        "Screens never distract",
      ],
      answer: "It strengthens recall without dependency on cues from feeds",
      explanation: "Dual coding + fewer distractions aids consolidation.",
    },
    {
      prompt: "App-wise limits matter because:",
      options: [
        "All apps are equal distractions",
        "Different apps hijack attention differently—target the leak",
        "Timers never work",
        "Parents should decide everything",
      ],
      answer: "Different apps hijack attention differently—target the leak",
      explanation: "Precision beats blanket bans.",
    },
    {
      prompt: "Evening screen audits help you:",
      options: [
        "Judge yourself cruelly",
        "See where time leaked versus intent",
        "Remove sleep",
        "Boost infinite scrolling",
      ],
      answer: "See where time leaked versus intent",
      explanation: "Measurement enables intentional fixes tomorrow.",
    },
  ]),
};
