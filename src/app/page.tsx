
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublishedExams } from "@/services/firestore";
import Link from "next/link";

export default async function Home() {
    const exams = await getPublishedExams();

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold tracking-tight mb-4">Available Exams</h1>
                    <p className="text-muted-foreground mb-8">
                        Choose an exam from the list below to start your preparation.
                    </p>
                    {exams.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {exams.map((exam) => (
                                <Link href={`/exam/${exam.id}/start`} key={exam.id}>
                                    <Card className="hover:shadow-lg transition-shadow">
                                        <CardHeader>
                                            <CardTitle>{exam.name}</CardTitle>
                                            <CardDescription>{exam.category} - {exam.examType}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>{exam.totalQuestions} Questions</span>
                                                <span>{exam.durationMin} mins</span>
                                                <span>{exam.totalMarks} Marks</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                         <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-64">
                            <div className="flex flex-col items-center gap-1 text-center">
                                <h3 className="text-2xl font-bold tracking-tight">
                                    No Exams Published
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    There are currently no exams available. Please check back later.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
