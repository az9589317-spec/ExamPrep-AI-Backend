

import Link from 'next/link';
import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Atom, BookCopy } from 'lucide-react';
import { getPublishedExams } from '@/services/firestore';
import { subCategories } from '@/lib/categories';

const jeeSubCategories = subCategories.JEE.map(name => ({
    name,
    description: name === 'Previous Year Paper'
        ? 'Practice with actual questions from past JEE exams.'
        : `Exams and tests for JEE ${name}.`,
    icon: name === 'Previous Year Paper' ? <BookCopy className="h-8 w-8 text-primary" /> : <Atom className="h-8 w-8 text-primary" />,
    category: name,
}));

export default async function JeePage() {

  const examCounts = await (async () => {
    const counts: Record<string, number> = {};
    for (const subCategory of jeeSubCategories) {
        const exams = await getPublishedExams(subCategory.category);
        counts[subCategory.category] = exams.length;
    }
    return counts;
  })();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-headline tracking-tight">JEE Exams</h1>
          <p className="mt-2 text-lg text-muted-foreground">Choose a specific JEE exam to view available tests.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jeeSubCategories.map((subCategory) => (
            <Link 
              href={subCategory.name === 'Previous Year Paper' ? '/previous-year-papers' : `/exams/${encodeURIComponent(subCategory.category)}`}
              key={subCategory.name}
            >
              <Card className="flex flex-col justify-between h-full hover:bg-card/70 transition-all duration-300 shadow-glow-br hover:shadow-glow-tl">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    {subCategory.icon}
                    <CardTitle className="font-headline">{subCategory.name}</CardTitle>
                  </div>
                  <CardDescription className="pt-2">
                    {subCategory.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                     <div className="text-sm font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                        {examCounts[subCategory.category] || 0} Exams
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
