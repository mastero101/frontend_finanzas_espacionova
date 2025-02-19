export interface Expense {
  id?: number;
  concept: string;
  amount: number;
  projectName: string;
  paidBy: string;
  fundedBy: string;
  purchaseLocation: string;
  paymentDate: Date;
  receipts?: Receipt[];
}

export interface Receipt {
  id: number;
  imageUrl: string;
  fileName: string;
  expenseId: number;
}