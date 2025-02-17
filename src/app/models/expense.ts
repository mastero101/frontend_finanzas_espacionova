export interface Expense {
    id: number;
    amount: number;
    description: string;
    category: string;
    date: Date;
    userId?: number;
    createdAt?: Date;
    updatedAt?: Date;
}