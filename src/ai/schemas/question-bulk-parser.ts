import { z } from 'genkit';

export const BulkParseQuestionsInputSchema = z.object({
  rawQuestionsText: z.string().describe('A large string containing multiple questions, separated by "---".'),
});
export type BulkParseQuestionsInput = z.infer<typeof BulkParseQuestionsInputSchema>;

export const ParsedQuestionSchema = z.object({
  questionText: z.string().describe('The main text of the question.'),
  options: z.array(z.object({ text: z.string() })).describe('An array of possible answer options.'),
  correctOptionIndex: z.number().int().min(0).describe('The 0-based index of the correct answer in the options array.'),
  topic: z.string().optional().describe('The specific topic of the question (e.g., Time and Work).'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('The difficulty level of the question.'),
  explanation: z.string().optional().describe('A detailed explanation for the correct answer.'),
  marks: z.number().optional().default(1).describe('Marks for the question.'),
});

export const BulkParsedQuestionsOutputSchema = z.object({
    questions: z.array(ParsedQuestionSchema).describe("An array of structured question objects parsed from the raw text.")
});
export type BulkParsedQuestionsOutput = z.infer<typeof BulkParsedQuestionsOutputSchema>;
