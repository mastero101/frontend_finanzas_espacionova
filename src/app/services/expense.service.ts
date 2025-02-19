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
      this.axios.get<any[]>('/expenses')  // Usar any para tipo temporal
        .then(response => {
          return response.data.map(expense => ({
            ...expense,
            paymentDate: new Date(expense.paymentDate),
            receipts: (expense.receipts || []).map((r: any) => ({
              id: r.id,
              imageUrl: r.imageUrl || r.url,  // Mapear ambos nombres posibles
              fileName: r.fileName || r.filename,
              expenseId: r.expenseId || r.ExpenseId
            }))
          }));
        })
    );
  }

  getExpenseById(id: number): Observable<Expense> {
    return from(
      this.axios.get<Expense>(`/expenses/${id}`)
        .then(response => response.data)
    );
  }

  createExpense(expense: Expense, image?: File): Observable<Expense> {
    const formData = new FormData();
    
    // Agregar todos los campos al FormData
    formData.append('userId', '1'); // Obtener del sistema de autenticación
    formData.append('concept', expense.concept);
    formData.append('amount', expense.amount.toString());
    formData.append('projectName', expense.projectName);
    formData.append('paidBy', expense.paidBy);
    formData.append('fundedBy', expense.fundedBy);
    formData.append('purchaseLocation', expense.purchaseLocation);
    formData.append('paymentDate', expense.paymentDate.toISOString());
    
    if (image) {
      formData.append('receipt', image, image.name);
    }

    return from(
      this.axios.post<Expense>('/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(response => response.data)
    );
  }

  updateExpense(id: number, expense: Expense): Observable<Expense> {
    return from(
      this.axios.put<Expense>(`/expenses/${id}`, {
        ...expense,
        paymentDate: expense.paymentDate.toISOString() // Formatear fecha
      }).then(response => response.data)
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

  uploadImage(formData: FormData): Observable<void> {
    return from(
      this.axios.post<void>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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