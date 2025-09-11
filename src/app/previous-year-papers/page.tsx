

'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { getPublishedExams, type Exam } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { allCategories } from '@/lib/categories';

function AllPreviousYearPapers() {
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    
    useEffect(() => {
        async function fetchExams() {
            setIsLoading(true);
            try {
                // Fetch all exams that are in any "Previous Year Paper" category
                const fetchedExams = await getPublishedExams('Previous Year Paper');
                setExams(fetchedExams);
            } catch (error) {
                console.error("Failed to fetch previous year papers:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchExams();
    }, []);

    const filteredExams = useMemo(() => {
        if (selectedCategory === 'All') {
            return exams;
        }
        return exams.filter(exam => {
            const categories = Array.isArray(exam.category) ? exam.category : [exam.category];
            return categories.some(cat => cat.includes(selectedCategory));
        });
    }, [exams, selectedCategory]);

    const mainCategoriesWithPYP = useMemo(() => {
        const categories = new Set<string>();
        exams.forEach(exam => {
            const examCategories = Array.isArray(exam.category) ? exam.category : [exam.category];
            examCategories.forEach(cat => {
                const mainCat = allCategories.find(main => cat.includes(main.name));
                if (mainCat) {
                    categories.add(mainCat.name);
                }
            });
        });
        return Array.from(categories).sort();
    }, [exams]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({length: 5}).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-9 w-28" />
                    </div>
                ))}
            </div>
        );
    }
    
    if (exams.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-10">
                <p>No Previous Year Papers have been published yet.</p>
            </div>
        );
    }

    return (
        <>
            <div className="mb-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-[280px]">
                        <SelectValue placeholder="Filter by category..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Categories</SelectItem>
                        {mainCategoriesWithPYP.map(category => (
                             <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="divide-y divide-border rounded-md border">
                {filteredExams.map((exam: Exam) => (
                    <div key={exam.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-medium">{exam.name} {exam.year ? `(${exam.year})` : ''}</h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                <span>{Array.isArray(exam.category) ? exam.category.join(', ') : exam.category}</span>
                                <span className='hidden sm:inline'>•</span>
                                <span>{exam.totalQuestions || 0} Questions</span>
                                <span className='hidden sm:inline'>•</span>
                                <span>{exam.totalMarks || 0} Marks</span>
                                <span className='hidden sm:inline'>•</span>
                                <span>{exam.durationMin} mins</span>
                                <span className='hidden sm:inline'>•</span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    <span>Negative Marking: No</span>
                                </span>
                            </div>
                        </div>
                        <div className="mt-2 sm:mt-0">
                            <Link href={`/exam/${exam.id}`}>
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                Start Exam <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                            </Link>
                        </div>
                    </div>
                ))}
                {filteredExams.length === 0 && (
                     <div className="text-center text-muted-foreground py-10">
                        <p>No papers found for the selected category.</p>
                    </div>
                )}
            </div>
        </>
    );
}

export default function PreviousYearPapersPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <Card>
            <CardHeader>
                <div>
                    <CardTitle className="font-headline">Previous Year Papers</CardTitle>
                    <CardDescription>
                        Practice with a comprehensive collection of past exam papers from all categories.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<div>Loading papers...</div>}>
                    <AllPreviousYearPapers />
                </Suspense>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}

