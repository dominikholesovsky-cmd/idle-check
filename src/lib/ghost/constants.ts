export const PRICE_USD = 4.99;
export const SUPPORT_EMAIL = "idlecheckapp@gmail.com";
export const MISSING_CAR_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  "Missing car or engine",
)}&body=${encodeURIComponent("Hi, I could not find my car or engine:")}`;

// Exact wording of the optional marketing checkbox. Stored as consent text when the user opts in.
export const MARKETING_CONSENT_TEXT =
  "Send me occasional tips for buying used cars. Unsubscribe anytime.";
