

'use client';

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, MoreHorizontal, PlusCircle, Trash2, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddExamForm } from "@/components/app/add-exam-form";
import { getPublishedExams, type Exam } from "@/services/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteExamAction } from "@/app/admin/actions";
import { subCategories as subCategoryMap } from "@/lib/categories";

function ExamList({ category }: { category: string }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState<Exam | undefined>(undefined);

    async function fetchExams() {
        setIsLoading(true);
        try {
            const fetchedExams = await getPublishedExams(category);
            setExams(fetchedExams);
        } catch (error) {
            console.error(`Failed to fetch exams for category ${category}:`, error);
            toast({ variant: "destructive", title: "Error", description: "Could not load exams for this category." });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (category) {
            fetchExams();
        }
    }, [category]);

    const handleFormFinished = () => {
        setIsDialogOpen(false);
        fetchExams();
    }
    
    const handleOpenDialog = (exam?: Exam) => {
        setSelectedExam(exam);
        setIsDialogOpen(true);
    }
    
    const handleDialogChange = (open: boolean) => {
        if (!open) {
            setSelectedExam(undefined);
        }
        setIsDialogOpen(open);
    }
    
    const handleDeleteExam = (examId: string) => {
        startTransition(async () => {
            const result = await deleteExamAction({ examId });
            if (result.success) {
                toast({ title: "Success", description: result.message });
                fetchExams(); // Refresh data
            } else {
                toast({ variant: "destructive", title: "Error", description: result.message });
            }
        });
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                     <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight">
                            <span className="text-muted-foreground">Category: </span>
                            {category}
                        </h1>
                        <p className="text-muted-foreground">Manage exams in the {category} category.</p>
                    </div>
                </div>
                 <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" className="h-8 gap-1" onClick={() => handleOpenDialog()}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add Exam
                        </span>
                    </Button>
                </div>
            </div>
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden md:table-cell">Questions</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-10" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : exams.length > 0 ? (
                                exams.map((exam) => (
                                    <TableRow key={exam.id} className="group hover:bg-muted/50">
                                        <TableCell className="font-medium">
                                            <Link href={`/admin/exams/${exam.id}/questions`} className="block hover:underline">
                                                {exam.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={exam.status === 'published' ? 'default' : 'secondary'}>
                                                {exam.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">{exam.totalQuestions || 0}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/exams/${exam.id}/questions`} className="w-full">
                                                            Manage Questions
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleOpenDialog(exam)}>Edit</DropdownMenuItem>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently delete the exam and all its associated questions.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteExam(exam.id)}
                                                                    disabled={isPending}
                                                                    className="bg-destructive hover:bg-destructive/90"
                                                                >
                                                                    {isPending ? 'Deleting...' : 'Delete'}
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                        No exams found in this category.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{selectedExam ? 'Edit Exam' : 'Add a New Exam'}</DialogTitle>
                        <DialogDescription>
                            {selectedExam ? 'Make changes to your exam configuration below.' : 'Fill out the form below to create a new exam.'}
                        </DialogDescription>
                    </DialogHeader>
                    <AddExamForm 
                        key={selectedExam?.id || 'new'}
                        initialData={selectedExam}
                        defaultCategory={category} 
                        onFinished={handleFormFinished} 
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}


export default function AdminCategoryPage() {
    const params = useParams();
    const category = decodeURIComponent(params.category as string);
    const subCategories = subCategoryMap[category] || [];

    return (
        <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center gap-4">
                <Link href="/admin">
                    <Button variant="outline" size="icon" className="h-7 w-7">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                </Link>
                {subCategories.length > 0 && (
                     <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight">
                            {category} Sub-categories
                        </h1>
                        <p className="text-muted-foreground">Select a sub-category to manage its exams.</p>
                    </div>
                )}
            </div>

            {subCategories.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {subCategories.map((sub) => (
                        <Link href={`/admin/category/${encodeURIComponent(sub)}`} key={sub}>
                             <Card className="hover:shadow-lg transition-shadow duration-300">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <Briefcase className="h-8 w-8 text-gray-500" />
                                        <CardTitle className="font-headline">{sub}</CardTitle>
                                    </div>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <ExamList category={category} />
            )}
        </div>
    );
}
