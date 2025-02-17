import { Component, OnInit } from '@angular/core';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './expense-list.component.html',
  styleUrl: './expense-list.component.scss'
})
export class ExpenseListComponent implements OnInit {
  expenses: Expense[] = [];
  receiptsMap: { [key: number]: any[] } = {};
  loading: boolean = true;
  error: string | null = null;
  selectedImage: string | null = null;
  searchTerm: string = '';
  selectedCategory: string = 'all';
  minAmount: number | null = null;
  maxAmount: number | null = null;
  categories: string[] = [];
  startDate: Date | null = null;
  endDate: Date | null = null;

  constructor(private expenseService: ExpenseService, private cdr: ChangeDetectorRef) {}

  get filteredExpenses(): Expense[] {
    return this.expenses.filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                          expense.category.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCategory = this.selectedCategory === 'all' || expense.category === this.selectedCategory;
      const matchesMin = this.minAmount ? expense.amount >= this.minAmount : true;
      const matchesMax = this.maxAmount ? expense.amount <= this.maxAmount : true;
      
      // Filtros de fecha
      const expenseDate = new Date(expense.date);
      const matchesStartDate = this.startDate ? expenseDate >= new Date(this.startDate) : true;
      const matchesEndDate = this.endDate ? expenseDate <= new Date(this.endDate) : true;

      return matchesSearch && matchesCategory && matchesMin && matchesMax && 
             matchesStartDate && matchesEndDate;
    });
  }

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.loading = true;
    this.expenseService.getExpenses().subscribe({
      next: (data) => {
        this.expenses = data.map(expense => {
          const localDate = new Date(expense.date);
          localDate.setHours(localDate.getHours() + localDate.getTimezoneOffset() / 60); // Ajustar a la zona horaria local
          return {
            ...expense,
            date: localDate
          };
        });
        this.categories = [...new Set(data.map(e => e.category))];
        this.cdr.detectChanges();
        this.cdr.markForCheck();
        this.loadAllReceipts();
      },
      error: (error) => {
        this.error = 'Error al cargar los gastos';
        this.loading = false;
        console.error('Error:', error);
        this.cdr.detectChanges();
      }
    });
  }

  private loadAllReceipts(): void {
    this.expenseService.getReceipts().subscribe({
      next: (receipts: any[]) => {
        this.receiptsMap = receipts.reduce((acc: { [key: number]: any[] }, receipt: any) => {
          const expenseId = receipt.ExpenseId;
          if (!acc[expenseId]) acc[expenseId] = [];
          acc[expenseId].push(receipt);
          return acc;
        }, {});
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error cargando recibos:', error);
        this.loading = false;
      }
    });
  }

  getReceiptsForExpense(expenseId: number): any[] {
    return this.receiptsMap[expenseId] || [];
  }

  deleteExpense(id: number): void {
    if (confirm('¿Estás seguro de eliminar este gasto?')) {
      this.expenseService.deleteExpense(id).subscribe({
        next: () => {
          this.expenses = this.expenses.filter(expense => expense.id !== id);
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          alert('Error al eliminar el gasto');
        }
      });
    }
  }

  openImageModal(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }
  
  closeImageModal(): void {
    this.selectedImage = null;
  }

  downloadReceipt(receipt: any): void {
    this.expenseService.downloadReceipt(receipt.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = receipt.filename || `recibo-${receipt.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (error) => {
        console.error('Error descargando recibo:', error);
        alert('Error al descargar el recibo');
      }
    });
  }
}
