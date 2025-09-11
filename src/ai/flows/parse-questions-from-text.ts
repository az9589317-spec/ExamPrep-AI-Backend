// src/ai/flows/parse-questions-from-text.ts
'use server';
/**
 * @fileOverview An AI flow to parse a block of unstructured text containing multiple questions into an array of structured question objects.
 * 
 * - parseQuestionsFromText - A function that takes a raw string and parses it into multiple questions.
 */

import { ai } from '@/ai/genkit';
import { 
    BulkParseQuestionsInputSchema, 
    BulkParsedQuestionsOutputSchema,
    type BulkParseQuestionsInput,
    type BulkParsedQuestionsOutput
} from '@/ai/schemas/question-bulk-parser';


export async function parseQuestionsFromText(input: BulkParseQuestionsInput): Promise<BulkParsedQuestionsOutput> {
  return parseQuestionsFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseQuestionsPrompt',
  input: { schema: BulkParseQuestionsInputSchema },
  output: { schema: BulkParsedQuestionsOutputSchema },
  prompt: `You are an expert system designed to parse a large block of unstructured text and convert it into an array of structured question objects.
The questions in the raw text are separated by "---" on a new line.

For each question you find, you must extract the following fields:
1. The question itself ('questionText').
2. A list of multiple-choice options ('options'). These might be numbered (1, 2, 3, 4), lettered (A, B, C, D), or just listed.
3. The correct answer. This could be indicated by "Answer: C", "Correct: 2", "Ans: Option A", or similar phrasing. Your task is to determine the correct 0-based index of this answer from the options list you create.
4. The topic of the question ('topic').
5. The difficulty level ('difficulty'), which must be 'easy', 'medium', or 'hard'.
6. A detailed explanation for the answer ('explanation').
7. The marks for the question ('marks'). Default to 1 if not specified.

Analyze the following text block and extract all the questions into a JSON array.

Raw Text to Parse:
'''
{{{rawQuestionsText}}}
'''

Your JSON output must conform to the BulkParsedQuestionsOutput schema. Ensure your entire output is a single JSON object with a "questions" key containing the array.
`,
});

const parseQuestionsFromTextFlow = ai.defineFlow(
  {
    name: 'parseQuestionsFromTextFlow',
    inputSchema: BulkParseQuestionsInputSchema,
    outputSchema: BulkParsedQuestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output || !output.questions) {
      throw new Error("The AI model failed to return a valid questions array.");
    }
    return output;
  }
);
