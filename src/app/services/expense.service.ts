import { Injectable } from '@angular/core';
import axios from 'axios';
import { Observable, from } from 'rxjs';
import { Expense } from '../models/expense';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = environment.apiUrl;
  private axios = axios.create({
    baseURL: this.apiUrl,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  constructor() { }

  getExpenses(): Observable<Expense[]> {
    return from(
      this.axios.get<Expense[]>('/expenses')
        .then(response => response.data)
    );
  }

  getExpenseById(id: number): Observable<Expense> {
    return from(
      this.axios.get<Expense>(`/expenses/${id}`)
        .then(response => response.data)
    );
  }

  createExpense(expense: Expense, image?: File): Observable<Expense> {
    const expenseData = {
      amount: expense.amount,
      description: expense.description,
      category: expense.category,
      date: expense.date,
      userId: 1 // Temporal hasta implementar autenticación
    };

    return from(
      this.axios.post<Expense>('/expenses', expenseData)
        .then(async (response) => {
          if (image && response.data.id) {
            await this.uploadImage(image, response.data.id).toPromise();
          }
          return response.data;
        })
    );
  }

  updateExpense(id: number, expense: Expense): Observable<Expense> {
    return from(
      this.axios.put<Expense>(`/expenses/${id}`, expense)
        .then(response => response.data)
    );
  }

  deleteExpense(id: number): Observable<void> {
    return from(
      this.axios.delete(`/expenses/${id}`)
        .then(() => void 0)
    );
  }

  // Método opcional para obtener gastos por categoría
  getExpensesByCategory(category: string): Observable<Expense[]> {
    return from(
      this.axios.get<Expense[]>(`/expenses`, {
        params: { category }
      }).then(response => response.data)
    );
  }

  uploadImage(image: File, expenseId: number): Observable<void> {
    const formData = new FormData();
    formData.append('file', image);
    formData.append('expenseId', expenseId.toString());

    return from(
      this.axios.post<void>('/upload', formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      }).then(() => void 0)
    );
  }

  getReceiptsByExpense(expenseId: number): Observable<any[]> {
    return from(
      this.axios.get<any[]>(`/receipts/expense/${expenseId}`)
        .then(response => response.data)
    );
  }

  getReceipts(): Observable<any[]> {
    return from(
      this.axios.get<any[]>('/receipts')
        .then(response => response.data)
    );
  }

  downloadReceipt(receiptId: number): Observable<Blob> {
    return from(
      this.axios.get(`/receipts/${receiptId}/download`, {
        responseType: 'blob'
      }).then(response => response.data)
    );
  }
}