import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './expense-form.component.html',
  styleUrl: './expense-form.component.scss'
})
export class ExpenseFormComponent implements OnInit {
  expenseForm: FormGroup;
  isEditing = false;
  expenseId?: number;
  loading = false;
  submitAttempted = false;
  selectedImage: File | null = null;
  projects: string[] = [];

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.expenseForm = this.fb.group({
      concept: ['', [Validators.required, Validators.minLength(3)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      projectName: ['', Validators.required],
      paidBy: ['', Validators.required],
      fundedBy: ['', Validators.required],
      purchaseLocation: ['', Validators.required],
      paymentDate: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProjects();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.expenseId = Number(id);
      this.isEditing = true;
      this.loadExpense();
    } else {
      this.expenseId = undefined;
    }
  }

  loadProjects(): void {
    this.expenseService.getExpenses().subscribe({
      next: (expenses) => {
        this.projects = [...new Set(expenses.map(e => e.projectName))];
      }
    });
  }

  loadExpense(): void {
    this.loading = true;
    this.expenseService.getExpenseById(this.expenseId!).subscribe({
      next: (expense) => {
        this.expenseForm.patchValue({
          ...expense,
          paymentDate: new Date(expense.paymentDate).toISOString().split('T')[0]
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar el gasto:', error);
        this.loading = false;
        this.router.navigate(['/expenses']);
      }
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];
    }
  }

  onSubmit(): void {
    this.submitAttempted = true;
    
    if (this.expenseForm.valid) {
      this.loading = true;
      const formValue = this.expenseForm.value;
      
      const expenseData: Expense = {
        ...formValue,
        amount: Number(formValue.amount),
        paymentDate: new Date(formValue.paymentDate)
      };

      const request = this.isEditing
        ? this.expenseService.updateExpense(this.expenseId!, expenseData)
        : this.expenseService.createExpense(expenseData, this.selectedImage || undefined);

      request.subscribe({
        next: (createdExpense) => {
          if (!this.isEditing) {
            this.expenseId = createdExpense.id;
          }

          if (this.selectedImage) {
            this.uploadReceipt(this.selectedImage, expenseData);
          } else {
            this.router.navigate(['/expenses']);
          }
        },
        error: (error) => {
          console.error('Error:', error);
          this.loading = false;
          alert(`Error al guardar: ${error.message}`);
        }
      });
    }
  }

  uploadReceipt(image: File, expenseData: Expense): void {
    const formData = new FormData();
    formData.append('file', image);
    
    // Solo agregar expenseId si está definido
    if (this.expenseId) {
        formData.append('expenseId', this.expenseId.toString());
    } else {
        console.warn('expenseId no está definido, no se enviará al backend.');
    }

    console.log('Expense ID:', this.expenseId);
    console.log('File:', image);

    this.expenseService.uploadImage(formData).subscribe({
        next: () => {
            this.router.navigate(['/expenses']);
        },
        error: (error) => {
            console.error('Error al subir el recibo:', error);
            alert(`Error al subir el recibo: ${error.message}`);
        }
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.expenseForm.get(controlName);
    if (control?.errors && (control.dirty || control.touched || this.submitAttempted)) {
      if (control.errors['required']) return 'Este campo es requerido';
      if (control.errors['min']) return 'El valor debe ser mayor a 0';
      if (control.errors['minlength']) return 'Mínimo 3 caracteres';
    }
    return '';
  }
}