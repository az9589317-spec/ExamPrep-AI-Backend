// src/ai/flows/parse-question-from-text.ts
'use server';
/**
 * @fileOverview An AI flow to parse unstructured text into a structured question object.
 * 
 * - parseQuestionFromText - A function that takes a raw string and parses it into a question.
 */

import { ai } from '@/ai/genkit';
import { 
    ParseQuestionInputSchema, 
    ParsedQuestionOutputSchema,
    type ParseQuestionInput,
    type ParsedQuestionOutput
} from '@/ai/schemas/question-parser';


export async function parseQuestionFromText(input: ParseQuestionInput): Promise<ParsedQuestionOutput> {
  return parseQuestionFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseQuestionPrompt',
  input: { schema: ParseQuestionInputSchema },
  output: { schema: ParsedQuestionOutputSchema },
  prompt: `You are an expert system designed to parse unstructured text and convert it into a structured question format.
Analyze the following text and extract the required fields. The user can provide either a standard multiple-choice question or a full passage for a Reading Comprehension (RC) question.

***INSTRUCTIONS***

1.  **Detect Question Type**: First, determine if the provided text is a standard question or a Reading Comprehension passage.
    *   If it's a short block with a question, options, and an answer, treat it as a **Standard** question.
    *   If it's a longer paragraph or article, treat it as a **Reading Comprehension** question.

2.  **For Standard Questions**:
    *   Extract the 'questionText'.
    *   Extract the list of multiple-choice 'options'. These might be numbered (1, 2, 3), lettered (A, B, C), or just listed.
    *   Determine the correct 0-based 'correctOptionIndex' from the indicated answer (e.g., "Answer: C", "Correct: 2").
    *   Extract 'subject', 'topic', 'difficulty', and 'explanation' if available.
    *   The 'passage' and 'subQuestions' fields should be null or omitted.

3.  **For Reading Comprehension (RC) Questions**:
    *   The entire provided text is the 'passage'. Put it in the 'passage' field.
    *   From the passage, you must **GENERATE 3 to 5 relevant sub-questions**.
    *   For each sub-question, you must generate:
        *   'questionText' (the sub-question itself).
        *   'options' (an array of 4 plausible options).
        *   'correctOptionIndex' (the 0-based index of the correct option).
        *   'explanation' for the sub-question's answer.
        *   'marks' (default to 1).
    *   The 'questionText' (main) and 'options' (main) fields should be null or omitted for RC types.

Your JSON output must conform to the ParsedQuestionOutput schema.

---
Raw Text to Parse:
'''
{{{rawQuestionText}}}
'''
---
`,
});

const parseQuestionFromTextFlow = ai.defineFlow(
  {
    name: 'parseQuestionFromTextFlow',
    inputSchema: ParseQuestionInputSchema,
    outputSchema: ParsedQuestionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
