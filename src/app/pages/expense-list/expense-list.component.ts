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
  selectedProject: string = 'all';
  projects: string[] = [];
  minAmount: number | null = null;
  maxAmount: number | null = null;
  startDate: Date | null = null;
  endDate: Date | null = null;

  constructor(private expenseService: ExpenseService, private cdr: ChangeDetectorRef) {}

  get filteredExpenses(): Expense[] {
    return this.expenses.filter(expense => {
      const matchesSearch = expense.concept.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                          expense.purchaseLocation.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesProject = this.selectedProject === 'all' || expense.projectName === this.selectedProject;
      const matchesMin = this.minAmount ? expense.amount >= this.minAmount : true;
      const matchesMax = this.maxAmount ? expense.amount <= this.maxAmount : true;
      
      const paymentDate = new Date(expense.paymentDate);
      const matchesStartDate = this.startDate ? paymentDate >= new Date(this.startDate) : true;
      const matchesEndDate = this.endDate ? paymentDate <= new Date(this.endDate) : true;

      return matchesSearch && matchesProject && matchesMin && matchesMax && 
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
        this.expenses = data.map(expense => ({
          ...expense,
          paymentDate: new Date(expense.paymentDate),
          receipts: expense.receipts?.map(receipt => ({
            ...receipt,
            imageUrl: receipt.imageUrl,
            fileName: receipt.fileName
          })) || []
        }));
        this.projects = [...new Set(data.map(e => e.projectName))];
        this.loading = false;
        this.cdr.detectChanges();
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
          const expenseId = receipt.expenseId || receipt.ExpenseId;
          if (!acc[expenseId]) acc[expenseId] = [];
          acc[expenseId].push({
            ...receipt,
            imageUrl: receipt.url,
            fileName: receipt.fileName
          });
          return acc;
        }, {});
      },
      error: (error: any) => {
        console.error('Error cargando recibos:', error);
      }
    });
  }

  getReceiptsForExpense(expenseId: number): any[] {
    return this.receiptsMap[expenseId] || [];
  }

  handleImageError(event: any): void {
    console.error('Error cargando imagen:', event);
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
        a.download = receipt.fileName || `recibo-${receipt.id}.jpg`;
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