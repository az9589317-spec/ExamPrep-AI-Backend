// src/services/firestore.ts
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  addDoc,
  Timestamp,
  updateDoc,
  setDoc,
  limit,
} from 'firebase/firestore';
import { allCategories, allSubCategories, subCategories as subCategoryMap } from '@/lib/categories';
import type { Exam, Question, UserProfile, ExamResult, Notification } from '@/lib/data-structures';
import { getQuestionsForExam as getQuestions } from './firestore';

const getParentCategory = (subCategory: string): string | undefined => {
    for (const parent in subCategoryMap) {
        if (subCategoryMap[parent].includes(subCategory)) {
            return parent;
        }
    }
    return undefined;
};

export async function getExams(category?: string): Promise<Exam[]> {
  const examsCollection = collection(db, 'exams');
  let q;
  if (category) {
      // Check if the provided category is a main category or a sub-category
      const isMainCategory = allCategories.some(c => c.name === category);
      if (isMainCategory) {
          q = query(examsCollection, where('category', '==', category));
      } else {
          q = query(examsCollection, where('subCategory', 'array-contains', category));
      }
  } else {
      q = query(examsCollection, orderBy('name', 'asc'));
  }
    
  const snapshot = await getDocs(q);
  let exams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
  
  exams.sort((a, b) => a.name.localeCompare(b.name));
  
  return JSON.parse(JSON.stringify(exams));
}

export async function getPublishedExams(category?: string): Promise<Exam[]> {
    const examsCollection = collection(db, 'exams');
    let q;
    
    const conditions = [where('status', '==', 'published')];

    if (category) {
      const isMainCategory = allCategories.some(c => c.name === category);
      if (isMainCategory) {
          conditions.push(where('category', '==', category));
      } else {
          conditions.push(where('subCategory', 'array-contains', category));
      }
    }
    
    q = query(examsCollection, ...conditions);
    
    const snapshot = await getDocs(q);
    let examsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
    
    examsData.sort((a, b) => a.name.localeCompare(b.name));

    return JSON.parse(JSON.stringify(examsData));
}


export async function getExam(id: string): Promise<Exam | null> {
  if (id === 'custom') {
    return null;
  }
  const examDoc = await getDoc(doc(db, 'exams', id));
  if (!examDoc.exists()) {
    return null;
  }
  return JSON.parse(JSON.stringify({ id: examDoc.id, ...examDoc.data() }));
}

export async function getQuestionsForExam(examId: string): Promise<Question[]> {
  const questionsCollection = collection(db, 'exams', examId, 'questions');
  const q = query(questionsCollection, orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
  return JSON.parse(JSON.stringify(questions));
}

export async function getExamCategories() {
    const examsCollection = collection(db, 'exams');
    const q = query(examsCollection, where('status', '==', 'published'));
    const snapshot = await getDocs(q);
    const exams = snapshot.docs.map(doc => doc.data() as Exam);

    const examCountByCategory = exams.reduce((acc, exam) => {
        // Count for main category
        if (exam.category) {
            acc[exam.category] = (acc[exam.category] || 0) + 1;
        }
        // Count for sub-categories
        if (exam.subCategory && Array.isArray(exam.subCategory)) {
            exam.subCategory.forEach(sc => {
                acc[sc] = (acc[sc] || 0) + 1;
            });
        }
        return acc;
    }, {} as Record<string, number>);
    
    const categories = allCategories.map(c => c.name);

    return { categories, examCountByCategory };
}

export async function getUniqueSectionAndTopicNames(): Promise<{ sections: string[], topicsBySection: Record<string, string[]> }> {
  const exams = await getExams();
  const sectionNames = new Set<string>();
  const topicsBySection: Record<string, Set<string>> = {};

  for (const exam of exams) {
    const questions = await getQuestions(exam.id);
    questions.forEach(q => {
        if (q.subject) {
            sectionNames.add(q.subject);
            if (!topicsBySection[q.subject]) {
                topicsBySection[q.subject] = new Set();
            }
            if (q.topic) {
                topicsBySection[q.subject].add(q.topic);
            }
        }
    });
  }

  const finalTopicsBySection: Record<string, string[]> = {};
  for (const section in topicsBySection) {
    finalTopicsBySection[section] = Array.from(topicsBySection[section]).sort();
  }
  
  return { 
    sections: Array.from(sectionNames).sort(),
    topicsBySection: finalTopicsBySection
  };
}

export async function getUsers(): Promise<UserProfile[]> {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    if (snapshot.empty) {
        return [];
    }
    const users = snapshot.docs.map(d => {
        const data = d.data();
        return {
            id: d.id,
            name: data.displayName,
            email: data.email,
            photoURL: data.photoURL,
            registrationDate: new Date(data.createdAt).toLocaleDateString(),
            status: data.status || 'active', // Default to 'active' if status is not set
            role: data.role || 'user',
        }
    });
    return JSON.parse(JSON.stringify(users));
}

export async function getUser(userId: string): Promise<UserProfile | null> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
        return null;
    }
    const data = userDoc.data();
    const userProfile: UserProfile = {
        id: userDoc.id,
        name: data.displayName,
        email: data.email,
        photoURL: data.photoURL,
        registrationDate: new Date(data.createdAt).toLocaleDateString(),
        status: data.status || 'active', // Default to 'active' if status is not set
        role: data.role || 'user',
    };
    return JSON.parse(JSON.stringify(userProfile));
}


export async function saveExamResult(userId: string, resultData: Omit<ExamResult, 'id' | 'userId' | 'submittedAt'>): Promise<string> {
    if (resultData.examId === 'custom') {
        // Don't save results for custom-generated exams
        // We still need a unique ID for the results page URL
        return `custom-${new Date().getTime()}`;
    }

    const resultsCollection = collection(db, 'results');
    
    const examDoc = await getDoc(doc(db, 'exams', resultData.examId));
    if (!examDoc.exists()) {
        throw new Error("Exam not found, cannot save result.");
    }
    const exam = examDoc.data() as Exam;

    const resultToSave = {
        ...resultData,
        userId,
        submittedAt: new Date(),
        maxScore: exam.totalMarks,
    };
    const docRef = await addDoc(resultsCollection, resultToSave as any);
    return docRef.id;
}


export async function getExamResult(resultId: string): Promise<(ExamResult & {id: string, questions: Question[]}) | null> {
    if (resultId.startsWith('custom-')) {
        // For custom exams, the results are not stored in Firestore.
        // In a real application, you might temporarily store this in session/local storage
        // or a temporary database. For this demo, we'll return null and the page will show 'not found'.
        // A more robust solution would be needed for persistence.
        return null;
    }
    
    const resultDoc = await getDoc(doc(db, 'results', resultId));
    if (!resultDoc.exists()) {
        return null;
    }
    const resultData = { id: resultDoc.id, ...resultDoc.data() } as ExamResult & {id: string};

    // Questions are now denormalized, but if not, fetch them.
    if (!resultData.questions) {
        (resultData as any).questions = await getQuestionsForExam(resultData.examId);
    }
    
    return JSON.parse(JSON.stringify(resultData));
}


export async function getResultsForUser(userId: string): Promise<(ExamResult & {id: string})[]> {
  const resultsCollection = collection(db, 'results');
  // Query only by userId to avoid needing a composite index.
  const q = query(resultsCollection, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamResult & {id: string, submittedAt: Timestamp}));

  // Sort the results by submission date in the code.
  results.sort((a, b) => b.submittedAt.seconds - a.submittedAt.seconds);
  
  return JSON.parse(JSON.stringify(results));
}

export async function getCategoryPerformanceStats(category: string) {
    const resultsCollection = collection(db, 'results');
    const q = query(resultsCollection, where('examCategory', '==', category));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return {
            averageScore: 0,
            highestScore: 0,
            highestScoreExamName: 'N/A',
        };
    }

    const results = snapshot.docs.map(doc => doc.data() as ExamResult);
    const totalScore = results.reduce((acc, r) => acc + r.score, 0);
    const averageScore = totalScore / results.length;

    const highestScoreResult = results.reduce((max, r) => r.score > max.score ? r : max, results[0]);

    return {
        averageScore: parseFloat(averageScore.toFixed(2)),
        highestScore: parseFloat(highestScoreResult.score.toFixed(2)),
        highestScoreExamName: highestScoreResult.examName,
    };
}

export async function getNotifications(): Promise<Notification[]> {
  const notificationsCollection = collection(db, 'notifications');
  const q = query(notificationsCollection, orderBy('createdAt', 'desc'), limit(50));
  const snapshot = await getDocs(q);
  const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
  return JSON.parse(JSON.stringify(notifications));
}

export type LeaderboardEntry = {
    rank: number;
    user: UserProfile;
    highestScore: number;
    highestScorePercent: number;
    examsTaken: number;
};

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
    const [resultsSnapshot, usersSnapshot] = await Promise.all([
        getDocs(collection(db, 'results')),
        getDocs(collection(db, 'users')),
    ]);

    const allResults = resultsSnapshot.docs.map(doc => doc.data() as ExamResult);
    const allUsers = usersSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data() as Omit<UserProfile, 'id' | 'registrationDate'>;
        return acc;
    }, {} as Record<string, Omit<UserProfile, 'id' | 'registrationDate'>>);
    

    const userScores = allResults.reduce((acc, result) => {
        if (!result.userId || result.isDisqualified) return acc;
        
        const existing = acc[result.userId] || { highestScore: 0, examsTaken: 0, maxScore: 0 };
        
        const scorePercent = (result.score / result.maxScore) * 100;

        if (scorePercent > existing.highestScore) {
            existing.highestScore = scorePercent;
        }

        existing.examsTaken += 1;
        acc[result.userId] = existing;

        return acc;
    }, {} as Record<string, { highestScore: number, examsTaken: number, maxScore: number }>);
    
    let leaderboard = Object.keys(userScores)
        .map(userId => {
            const userData = allUsers[userId];
            if (!userData) return null;

            return {
                user: {
                    id: userId,
                    name: userData.name,
                    email: userData.email,
                    photoURL: userData.photoURL,
                    status: userData.status,
                    role: userData.role,
                    registrationDate: '',
                },
                highestScorePercent: userScores[userId].highestScore,
                examsTaken: userScores[userId].examsTaken,
            };
        })
        .filter(Boolean) as (Omit<LeaderboardEntry, 'rank' | 'highestScore'> & { highestScorePercent: number })[];
        

    leaderboard.sort((a, b) => b.highestScorePercent - a.highestScorePercent);

    const rankedLeaderboard = leaderboard.map((entry, index) => ({
        ...entry,
        rank: index + 1,
        highestScore: parseFloat(entry.highestScorePercent.toFixed(2)),
    }));

    return JSON.parse(JSON.stringify(rankedLeaderboard));
}
