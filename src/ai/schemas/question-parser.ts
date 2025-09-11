import { z } from 'genkit';

export const ParseQuestionInputSchema = z.object({
  rawQuestionText: z.string().describe('The raw, unstructured text containing the question, options, answer, and potentially other details, OR a full passage for an RC question.'),
});
export type ParseQuestionInput = z.infer<typeof ParseQuestionInputSchema>;


const SubQuestionSchema = z.object({
  questionText: z.string().describe("The text of the sub-question based on the passage."),
  options: z.array(z.object({ text: z.string() })).min(2).describe("An array of possible answer options for the sub-question."),
  correctOptionIndex: z.number().int().min(0).describe("The 0-based index of the correct answer for the sub-question."),
  explanation: z.string().optional().describe("A detailed explanation for the sub-question's correct answer."),
  marks: z.number().optional().default(1).describe("Marks for the sub-question."),
});


export const ParsedQuestionOutputSchema = z.object({
  questionText: z.string().optional().describe('The main text of the question (for Standard type).'),
  options: z.array(z.object({ text: z.string() })).optional().describe('An array of possible answer options (for Standard type).'),
  correctOptionIndex: z.number().int().min(0).optional().describe('The 0-based index of the correct answer in the options array (for Standard type).'),
  
  passage: z.string().optional().describe("The full text of the reading passage (for Reading Comprehension type)."),
  subQuestions: z.array(SubQuestionSchema).optional().describe("An array of sub-questions based on the passage (for Reading Comprehension type)."),

  subject: z.string().optional().describe('The subject of the question (e.g., Quantitative Aptitude).'),
  topic: z.string().optional().describe('The specific topic of the question (e.g., Time and Work).'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().describe('The difficulty level of the question.'),
  explanation: z.string().optional().describe('A detailed explanation for the correct answer (for Standard type) or overall context (for RC type).'),
});
export type ParsedQuestionOutput = z.infer<typeof ParsedQuestionOutputSchema>;
