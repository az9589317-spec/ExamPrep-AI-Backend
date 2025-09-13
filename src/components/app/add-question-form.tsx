
"use client";

import { useForm, useFieldArray, useWatch, useFormContext } from "react-hook-form";
import { useTransition, useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addQuestionAction, parseQuestionAction, parseAndSaveQuestionsAction } from "@/app/admin/actions";
import { Separator } from "../ui/separator";
import type { Exam, Question } from "@/lib/data-structures";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { v4 as uuidv4 } from "uuid";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";


const subQuestionSchema = z.object({
    id: z.string().default(() => uuidv4()),
    questionText: z.string().min(1, "Sub-question text is required."),
    options: z.array(z.object({ text: z.string().min(1, "Option text cannot be empty.") })).min(2, "At least two options are required."),
    correctOptionIndex: z.coerce.number({required_error: "You must select a correct answer."}).min(0),
    explanation: z.string().optional(),
    marks: z.coerce.number().min(0.25, "Marks must be at least 0.25.").optional().default(1),
});

const addQuestionSchema = z.object({
  questionType: z.enum(['Standard', 'Reading Comprehension']),
  subject: z.string().min(1, "Subject is required."),
  topic: z.string().min(1, "Topic is required."),
  difficulty: z.enum(["easy", "medium", "hard"]),
  explanation: z.string().optional(),
  examId: z.string(),
  questionId: z.string().optional(),
  
  // Fields that depend on questionType
  marks: z.coerce.number().min(0.25, "Marks must be at least 0.25.").optional(),
  questionText: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  options: z.array(z.object({ text: z.string() })).optional(),
  correctOptionIndex: z.coerce.number().optional(),
  passage: z.string().optional(),
  subQuestions: z.array(subQuestionSchema).optional(),
}).superRefine((data, ctx) => {
    if (data.questionType === 'Standard') {
        if (!data.marks || data.marks < 0.25) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Marks must be at least 0.25.",
                path: ['marks'],
            });
        }
        if (!data.questionText || data.questionText.length < 10) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Question text is required and must be at least 10 characters.",
                path: ['questionText'],
            });
        }
        if (!data.options || data.options.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "At least two options are required.",
                path: ['options'],
            });
        }
        if (data.options?.some(opt => !opt.text || opt.text.trim() === '')) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "All option fields must be filled out.",
                path: ['options'],
            });
        }
        if (data.correctOptionIndex === undefined || data.correctOptionIndex < 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "You must select a correct answer.",
                path: ['correctOptionIndex'],
            });
        }
    }
    if (data.questionType === 'Reading Comprehension') {
        if (!data.passage || data.passage.length < 20) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Passage is required and must be at least 20 characters.",
                path: ['passage'],
            });
        }
        if (!data.subQuestions || data.subQuestions.length < 1) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "At least one sub-question is required for a passage.",
                path: ['subQuestions'],
            });
        }
    }
});


type FormValues = z.infer<typeof addQuestionSchema>;

interface AddQuestionFormProps {
    exam: Exam | null;
    initialData?: Question;
    defaultSection?: string;
    onFinished: () => void;
}

function AiPassageParser({ onParse }: { onParse: (data: any) => void }) {
    const { toast } = useToast();
    const [isParsing, setIsParsing] = useState(false);
    const [aiInput, setAiInput] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleParseWithAI = async () => {
        if (!aiInput) {
            toast({ variant: "destructive", title: "Input Required", description: "Please paste the passage text." });
            return;
        }
        setIsParsing(true);
        try {
            const result = await parseQuestionAction(aiInput);
            if (result.success && result.data) {
                onParse(result.data);
                toast({ title: "Success!", description: "AI has populated the form with the parsed passage and questions." });
                setIsDialogOpen(false);
                setAiInput("");
            } else {
                toast({ variant: 'destructive', title: 'Parsing Failed', description: result.error || "The AI could not parse the passage." });
            }
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error', description: "An unexpected error occurred during parsing." });
        }
        finally {
            setIsParsing(false);
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Fill with AI
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Generate RC Questions with AI</DialogTitle>
                    <DialogDescription>
                        Paste a passage below. The AI will analyze it and generate relevant sub-questions, options, and answers for you.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <Textarea
                        placeholder="Paste the entire reading comprehension passage here..."
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        className="h-64"
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="button" onClick={handleParseWithAI} disabled={isParsing}>
                        {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        {isParsing ? 'Analyzing Passage...' : 'Generate Questions'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function AiBulkUploader({
    examId,
    sectionName,
    onFinished,
}: {
    examId: string;
    sectionName: string;
    onFinished: () => void;
}) {
    const { toast } = useToast();
    const [isParsing, setIsParsing] = useState(false);
    const [aiInput, setAiInput] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleParseWithAI = async () => {
        if (!aiInput) {
            toast({ variant: "destructive", title: "Input Required", description: "Please paste the question text into the AI parser box." });
            return;
        }
        setIsParsing(true);
        try {
            const result = await parseAndSaveQuestionsAction({
                rawQuestionsText: aiInput,
                examId: examId,
                subject: sectionName,
            });

            if (result.success) {
                toast({ title: "Success!", description: `${result.count} questions were added to the "${sectionName}" section.` });
                setAiInput("");
                setIsDialogOpen(false);
                onFinished(); // This will trigger a re-fetch of questions
            } else {
                toast({ variant: 'destructive', title: 'Bulk Import Failed', description: result.error || "Couldn't parse and save the questions." });
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: "An unexpected error occurred during bulk import." });
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-9 gap-1 w-full md:w-auto">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add with AI
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Bulk Add Questions with AI</DialogTitle>
                    <DialogDescription>
                        Paste up to 30 questions for the <span className="font-bold text-primary">{sectionName}</span> section.
                        Separate each question with "---" on a new line. The AI will parse and save them all at once.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Textarea
                        placeholder={`Question 1...\nAnswer: A\nExplanation: ...\n---\nQuestion 2...\nAnswer: C\nExplanation: ...`}
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        className="h-64"
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="button" onClick={handleParseWithAI} disabled={isParsing}>
                        {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        {isParsing ? 'Parsing & Saving...' : `Parse & Save Questions`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export function AddQuestionForm({ exam, initialData, defaultSection, onFinished }: AddQuestionFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(addQuestionSchema),
  });

  useEffect(() => {
    if (!exam) return;

    let defaultValues: FormValues;

    if (initialData) {
        // We are editing an existing question
        defaultValues = {
            ...initialData,
            examId: exam.id,
            questionId: initialData.id,
            subject: initialData.subject || exam.sections?.[0]?.name || "",
            options: initialData.options?.map(o => ({ text: o.text || '' })) || [{ text: "" }, { text: "" }],
            marks: initialData.marks || 1,
            subQuestions: initialData.subQuestions?.map(sq => ({
                ...sq,
                options: sq.options?.map(opt => ({ text: opt.text || '' })) || [{ text: "" }, { text: "" }],
                marks: sq.marks || 1,
            })) || [],
            topic: initialData.topic || "",
            difficulty: initialData.difficulty || "medium",
            explanation: initialData.explanation || "",
            passage: initialData.passage || "",
            questionText: initialData.questionText || "",
            imageUrl: initialData.imageUrl || "",
        };
    } else {
        // We are creating a new question
        defaultValues = {
            questionType: "Standard",
            questionText: "",
            imageUrl: "",
            options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
            correctOptionIndex: undefined,
            passage: "",
            subQuestions: [],
            subject: defaultSection || exam.sections?.[0]?.name || "",
            topic: "",
            difficulty: "medium",
            explanation: "",
            marks: 1,
            examId: exam.id,
            questionId: undefined,
        };
    }
    form.reset(defaultValues);

  }, [initialData, exam, form, defaultSection]);
  
  const questionType = useWatch({ control: form.control, name: 'questionType' });

  const { fields: optionFields, append: appendOption, remove: removeOption, replace: replaceOptions } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const { fields: subQuestionFields, append: appendSubQuestion, remove: removeSubQuestion, replace: replaceSubQuestions } = useFieldArray({
    control: form.control,
    name: "subQuestions",
  });

  const handleAiParse = (parsedData: any) => {
    if (parsedData.passage) {
      form.setValue('passage', parsedData.passage);
    }
    if (parsedData.subQuestions && parsedData.subQuestions.length > 0) {
      replaceSubQuestions(parsedData.subQuestions);
    }
    if (parsedData.topic) {
        form.setValue('topic', parsedData.topic);
    }
    if (parsedData.difficulty) {
        form.setValue('difficulty', parsedData.difficulty);
    }
  };
  
  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await addQuestionAction(data);
      if (result?.errors && Object.keys(result.errors).length > 0) {
         Object.entries(result.errors).forEach(([key, value]) => {
            if (value && key in form.getValues()) {
                form.setError(key as keyof FormValues, { message: value[0] });
            }
         });
         toast({ variant: 'destructive', title: 'Error', description: 'Please correct the errors in the form.' });
      } else if(result?.message) {
        toast({ title: 'Success!', description: result.message });
        onFinished();
      }
    });
  };

  if (!exam) {
    return (
        <div className="space-y-8 p-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
            <div className="flex justify-end">
                <Skeleton className="h-10 w-24" />
            </div>
        </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
            control={form.control}
            name="questionType"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'Standard'}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Standard">Standard (MCQ)</SelectItem>
                            <SelectItem value="Reading Comprehension">Reading Comprehension</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        {questionType === 'Standard' && (
            <Card>
                <CardHeader>
                    <CardTitle>Standard Question Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                    control={form.control}
                    name="questionText"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Question Text</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Enter the question..." {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" /> Image URL (Optional)
                            </FormLabel>
                            <FormControl>
                                <Input placeholder="https://example.com/image.png" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormDescription>
                                Add a URL for an image to be displayed with the question.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormItem>
                    <div className="mb-4">
                        <FormLabel>Options and Correct Answer</FormLabel>
                        <FormDescription>
                        Enter the options below and select the correct one.
                        </FormDescription>
                    </div>
                    <FormField
                        control={form.control}
                        name="correctOptionIndex"
                        render={({ field }) => (
                        <FormControl>
                            <RadioGroup
                            onValueChange={(value) => field.onChange(parseInt(value, 10))}
                            className="space-y-4"
                            value={field.value !== undefined ? String(field.value) : undefined}
                            >
                            {optionFields.map((item, index) => (
                                <FormField
                                key={item.id}
                                control={form.control}
                                name={`options.${index}.text`}
                                render={({ field: optionField }) => (
                                    <FormItem className="flex items-center gap-4">
                                    <FormControl>
                                        <RadioGroupItem value={index.toString()} id={`option-radio-${index}`} />
                                    </FormControl>
                                    <Label htmlFor={`option-radio-${index}`} className="flex-1">
                                        <Input placeholder={`Option ${index + 1}`} {...optionField} value={optionField.value || ''} />
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => removeOption(index)}
                                        disabled={optionFields.length <= 2}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    </FormItem>
                                )}
                                />
                            ))}
                            </RadioGroup>
                        </FormControl>
                        )}
                    />
                    <FormMessage className="mt-4">{form.formState.errors.correctOptionIndex?.message || form.formState.errors.options?.message}</FormMessage>
                    <FormMessage className="mt-4">{form.formState.errors.options?.root?.message}</FormMessage>
                    </FormItem>

                    <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => appendOption({ text: "" })}
                    >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Option
                    </Button>
                </CardContent>
            </Card>
        )}

        {questionType === 'Reading Comprehension' && (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Reading Comprehension Details</CardTitle>
                    <AiPassageParser onParse={handleAiParse} />
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="passage"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Passage</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Enter the full passage here..." {...field} value={field.value || ''} rows={10} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" /> Image URL (Optional)
                            </FormLabel>
                            <FormControl>
                                <Input placeholder="https://example.com/image.png" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormDescription>
                                Add a URL for an image to be displayed with the passage.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Separator />
                    
                    <div className="space-y-4">
                        <Label>Sub-Questions</Label>
                        {subQuestionFields.map((field, index) => (
                            <Card key={field.id} className="p-4 bg-muted/50">
                                <div className="flex justify-between items-start mb-4">
                                    <Label className="text-base pt-2">Sub-Question {index + 1}</Label>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSubQuestion(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name={`subQuestions.${index}.questionText`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Question Text</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Enter the sub-question..." {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`subQuestions.${index}.marks`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Marks</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.25" placeholder="e.g., 1 or 2" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <SubQuestionOptions subQuestionIndex={index} />
                                    <FormField
                                        control={form.control}
                                        name={`subQuestions.${index}.explanation`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Detailed Explanation</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Provide a detailed explanation for this sub-question..." {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </Card>
                        ))}
                         <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => appendSubQuestion({ id: uuidv4(), questionText: "", options: [{text: ""}, {text: ""}, {text: ""}, {text: ""}], correctOptionIndex: 0, explanation: "", marks: 1 })}
                            >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Sub-Question
                        </Button>
                        <FormMessage>{form.formState.errors.subQuestions?.message}</FormMessage>
                    </div>
                </CardContent>
            </Card>
        )}
        
        <Card>
            <CardHeader>
                <CardTitle>Categorization &amp; Details</CardTitle>
            </CardHeader>
             <CardContent className="grid grid-cols-1 gap-8 md:grid-cols-4">
                 <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel>Section (Subject)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a section" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {exam.sections.map(section => (
                                <SelectItem key={section.id} value={section.name}>{section.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel>Topic</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Time and Work" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel>Difficulty</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'medium'}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 {questionType === 'Standard' && (
                    <FormField
                        control={form.control}
                        name="marks"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Marks</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.25" placeholder="e.g., 1 or 2" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <FormField
                    control={form.control}
                    name="explanation"
                    render={({ field }) => (
                        <FormItem className="md:col-span-4">
                        <FormLabel>Overall Explanation (Optional)</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Provide a detailed solution or explanation." {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>
                            Add an image URL to the explanation above.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

        <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Question"}
            </Button>
        </div>
      </form>
    </Form>
  );
}

// Helper component to avoid re-rendering the entire form when sub-question options change.
function SubQuestionOptions({ subQuestionIndex }: { subQuestionIndex: number }) {
    const { control, formState: { errors } } = useFormContext<FormValues>();
    
    const { fields: subQuestionOptionFields, append, remove } = useFieldArray({
        control: control,
        name: `subQuestions.${subQuestionIndex}.options`
    });
    
    const subQuestionErrors = errors.subQuestions?.[subQuestionIndex];

    return (
        <div className="mt-4 pl-4 border-l-2">
            <Label>Options</Label>
            <FormField
                control={control}
                name={`subQuestions.${subQuestionIndex}.correctOptionIndex`}
                render={({ field }) => (
                    <FormControl>
                        <RadioGroup
                            onValueChange={(value) => field.onChange(parseInt(value, 10))}
                            className="space-y-4 mt-2"
                            value={field.value !== undefined ? String(field.value) : undefined}
                        >
                            {subQuestionOptionFields.map((item, optionIndex) => (
                                <FormField
                                    key={item.id}
                                    control={control}
                                    name={`subQuestions.${subQuestionIndex}.options.${optionIndex}.text`}
                                    render={({ field: optionField }) => (
                                        <FormItem className="flex items-center gap-4">
                                            <FormControl>
                                                <RadioGroupItem value={optionIndex.toString()} id={`sub-option-radio-${subQuestionIndex}-${optionIndex}`} />
                                            </FormControl>
                                            <Label htmlFor={`sub-option-radio-${subQuestionIndex}-${optionIndex}`} className="flex-1">
                                                <Input placeholder={`Option ${optionIndex + 1}`} {...optionField} value={optionField.value || ''} />
                                            </Label>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => remove(optionIndex)}
                                                disabled={subQuestionOptionFields.length <= 2}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </FormItem>
                                    )}
                                />
                            ))}
                             {subQuestionErrors?.options && <FormMessage>{subQuestionErrors.options.message}</FormMessage>}
                             {subQuestionErrors?.correctOptionIndex && <FormMessage>{subQuestionErrors.correctOptionIndex.message}</FormMessage>}
                        </RadioGroup>
                    </FormControl>
                )}
            />
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => append({ text: "" })}
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Option
            </Button>
        </div>
    );
}

    