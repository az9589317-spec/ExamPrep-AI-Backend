
import Link from 'next/link';
import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, TramFront } from 'lucide-react';
import { getPublishedExams } from '@/services/firestore';

const railwaySubCategories = [
    { name: 'NTPC', description: 'Non-Technical Popular Categories exams.' },
    { name: 'Group D', description: 'Recruitment for various Group D posts.' },
    { name: 'ALP', description: 'Assistant Loco Pilot recruitment exams.' },
];

export default async function RailwayPage() {

  const examCounts = await (async () => {
    const counts: Record<string, number> = {};
    for (const subCategory of railwaySubCategories) {
        const exams = await getPublishedExams(subCategory.name);
        counts[subCategory.name] = exams.length;
    }
    return counts;
  })();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-headline tracking-tight">Railway Exams</h1>
          <p className="mt-2 text-lg text-muted-foreground">Choose a specific Railway exam to view available tests.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {railwaySubCategories.map((subCategory) => (
            <Link href={`/exams/${encodeURIComponent(subCategory.name)}`} key={subCategory.name}>
              <Card className="flex flex-col justify-between h-full hover:bg-card/70 transition-all duration-300 shadow-glow-br hover:shadow-glow-tl">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <TramFront className="h-8 w-8 text-primary" />
                    <CardTitle className="font-headline">{subCategory.name}</CardTitle>
                  </div>
                  <CardDescription className="pt-2">
                    {subCategory.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                     <div className="text-sm font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                        {examCounts[subCategory.name] || 0} Exams
                    </div>
                    <div className="font-medium text-primary flex items-center">
                      View Exams <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
