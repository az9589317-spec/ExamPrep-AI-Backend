

'use client';
import Link from "next/link";
import { PlusCircle, ArrowRight, Database, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddExamForm } from "@/components/app/add-exam-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { seedDatabaseAction } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { getExamCategories, type Exam } from "@/services/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { allCategories } from "@/lib/categories.tsx";

export default function AdminDashboard() {
    const { toast } = useToast();
    const [examCountByCategory, setExamCountByCategory] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isAddExamOpen, setIsAddExamOpen] = useState(false);
    
    async function fetchCategories() {
        try {
            const { examCountByCategory } = await getExamCategories();
            setExamCountByCategory(examCountByCategory);
        } catch (error) {
            console.error("Failed to fetch exam categories:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load exam categories.' });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchCategories();
    }, []);
    
    const handleSeedDatabase = async () => {
        toast({ title: 'Seeding Database...', description: 'Please wait, this may take a moment.' });
        const result = await seedDatabaseAction();
        if (result.success) {
            toast({ title: 'Success!', description: result.message });
            // Re-fetch counts after seeding
            fetchCategories();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    };

    const handleFormFinished = () => {
      setIsAddExamOpen(false);
      fetchCategories(); // Refetch categories to update counts
    }

  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="flex items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Exam Management</h1>
          <p className="text-muted-foreground">Manage all exams on the platform.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleSeedDatabase}>
                <Database className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Seed Database
                </span>
            </Button>
            <Dialog open={isAddExamOpen} onOpenChange={setIsAddExamOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="h-8 gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add Exam
                        </span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Add a New Exam</DialogTitle>
                        <DialogDescription>Fill out the form below to create a new exam.</DialogDescription>
                    </DialogHeader>
                    <AddExamForm onFinished={handleFormFinished} />
                </DialogContent>
            </Dialog>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index}>
                    <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                    <CardContent><Skeleton className="h-6 w-1/2 ml-auto" /></CardContent>
                </Card>
            ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allCategories.map((category) => (
                <Link href={`/admin/category/${encodeURIComponent(category.name)}`} key={category.name}>
                    <Card className="flex flex-col justify-between h-full hover:shadow-lg transition-shadow duration-300">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {category.icon || <Briefcase className="h-8 w-8 text-gray-500" />}
                                    <CardTitle className="font-headline">{category.name}</CardTitle>
                                </div>
                                <div className="text-sm font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                    {examCountByCategory[category.name] || 0}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-end text-sm font-medium text-primary">
                                Manage Exams <ArrowRight className="ml-2 h-4 w-4" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
      )}
    </div>
  );
}

    
