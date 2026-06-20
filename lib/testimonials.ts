export type Testimonial = {
  name: string;
  role: string;
  company?: string;
  quote: string;
  initial?: string;
  avatar?: string;
  verified?: boolean;
  betaTester?: boolean;
  source?: string;
};

// Add real user testimonials here as they come in.
// The section on the landing page hides automatically when this array is empty.
// Accepted roles: "Beta Tester", "Freelancer", "Solo Founder", or any freeform role.
//
// Example entry (copy, fill in, and uncomment):
// {
//   name: 'Alex K.',
//   role: 'Freelance designer',
//   quote: 'Replaced my Trello setup in a day. The client project template alone was worth switching.',
//   initial: 'AK',
//   verified: true,
//   betaTester: true,
//   source: 'email',
// },
export const testimonials: Testimonial[] = [];
