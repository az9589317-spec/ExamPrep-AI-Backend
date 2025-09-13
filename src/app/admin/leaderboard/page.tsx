
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getLeaderboard, type LeaderboardEntry } from "@/services/firestore";
import { Medal, Trophy } from "lucide-react";
import Link from "next/link";

function TopThree({ top3 }: { top3: LeaderboardEntry[] }) {
    const medalColors = [
        "text-yellow-400", // Gold
        "text-gray-400",   // Silver
        "text-yellow-600", // Bronze
    ];
    const cardBorders = [
        "border-yellow-400 shadow-yellow-400/20",
        "border-gray-400 shadow-gray-400/20",
        "border-yellow-600 shadow-yellow-600/20",
    ];

    return (
        <div className="grid md:grid-cols-3 gap-8 mb-12">
            {top3.map((entry, index) => (
                <Card key={entry.user.id} className={`border-2 ${cardBorders[index]} shadow-lg transform hover:-translate-y-2 transition-transform`}>
                     <Link href={`/admin/users/${entry.user.id}`} className="block">
                        <CardHeader className="text-center">
                            <div className="relative w-24 h-24 mx-auto">
                                <Avatar className="w-24 h-24 border-4 border-background ring-2 ring-offset-background ring-primary">
                                    <AvatarImage src={entry.user.photoURL} alt={entry.user.name || 'User'} data-ai-hint="person avatar"/>
                                    <AvatarFallback>{entry.user.name ? entry.user.name.charAt(0) : 'U'}</AvatarFallback>
                                </Avatar>
                                <Medal className={`absolute -top-2 -right-2 h-8 w-8 ${medalColors[index]}`} />
                            </div>
                            <CardTitle className="mt-4 text-2xl font-bold">{entry.user.name || 'Anonymous User'}</CardTitle>
                            <CardDescription>Rank #{entry.rank}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-4xl font-headline font-extrabold text-primary">{entry.highestScore}%</p>
                            <p className="text-sm text-muted-foreground">{entry.examsTaken} exams taken</p>
                        </CardContent>
                    </Link>
                </Card>
            ))}
        </div>
    );
}

export default async function AdminLeaderboardPage() {
    const leaderboardData = await getLeaderboard();
    const top3 = leaderboardData.slice(0, 3);

    return (
        <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="text-center mb-12">
                <Trophy className="h-16 w-16 mx-auto text-primary" />
                <h1 className="text-4xl font-bold tracking-tight mt-4">Global Leaderboard</h1>
                <p className="text-lg text-muted-foreground mt-2">
                    Top performers across all exams on the platform.
                </p>
            </div>

            {top3.length > 0 && <TopThree top3={top3} />}

            <Card>
                <CardHeader>
                    <CardTitle>All Ranks</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Rank</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead className="text-right">Highest Score</TableHead>
                                <TableHead className="text-right hidden sm:table-cell">Exams Taken</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leaderboardData.map((entry) => (
                                <TableRow key={entry.user.id}>
                                    <TableCell className="font-bold text-lg text-muted-foreground">
                                        #{entry.rank}
                                    </TableCell>
                                    <TableCell>
                                         <Link href={`/admin/users/${entry.user.id}`} className="flex items-center gap-3 group">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={entry.user.photoURL} alt={entry.user.name || 'User'} data-ai-hint="person avatar"/>
                                                <AvatarFallback>{entry.user.name ? entry.user.name.charAt(0) : 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold group-hover:underline">{entry.user.name || 'Anonymous User'}</p>
                                                <p className="text-xs text-muted-foreground">{entry.user.email}</p>
                                            </div>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-primary">{entry.highestScore}%</TableCell>
                                    <TableCell className="text-right hidden sm:table-cell text-muted-foreground">{entry.examsTaken}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     {leaderboardData.length === 0 && (
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                                    <p className="font-semibold">No results yet!</p>
                                    <p className="text-sm">As users attempt exams, this leaderboard will be populated.</p>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
