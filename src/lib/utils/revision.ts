export interface RevisionWithUser {
    timeDifference: number | null;
    id: string;
    createdAt: string;
    wordChanged: string;
    wordIndex: number;
    newWord: string;
    article: {
        title: string;
        slug: string;
    };
    user: {
        id: string;
        name: string;
        image: string;
        isBanned: boolean;
    };
}
