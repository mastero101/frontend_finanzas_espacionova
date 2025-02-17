import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ExpenseService } from '../../services/expense.service';

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

  categories = [
    { value: 'materiales', label: 'Materiales' },
    { value: 'herramientas', label: 'Herramientas' },
    { value: 'servicios', label: 'Servicios' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'otros', label: 'Otros' }
  ];

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.expenseForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.expenseId = Number(id);
      this.isEditing = true;
      this.loadExpense();
    }
  }

  loadExpense(): void {
    this.loading = true;
    this.expenseService.getExpenseById(this.expenseId!).subscribe({
      next: (expense) => {
        // Formatear la fecha si existe
        const formattedDate = expense.createdAt 
          ? new Date(expense.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        this.expenseForm.patchValue({
          ...expense,
          date: formattedDate
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
      const expense = {
        ...this.expenseForm.value,
        amount: Number(this.expenseForm.value.amount)
      };

      const request = this.isEditing
        ? this.expenseService.updateExpense(this.expenseId!, expense)
        : this.expenseService.createExpense(expense, this.selectedImage || undefined);

      request.subscribe({
        next: () => {
          this.router.navigate(['/expenses']);
        },
        error: (error) => {
          console.error('Error:', error);
          this.loading = false;
          alert('Error al guardar el gasto');
        }
      });
    }
  }

  uploadImage(image: File): void {
    const expenseId = this.expenseId;

    if (expenseId !== undefined) {
      this.expenseService.uploadImage(image, expenseId).subscribe({
        next: () => {
          this.router.navigate(['/expenses']);
        },
        error: (error) => {
          console.error('Error al cargar la imagen:', error);
          alert('Error al cargar la imagen');
        }
      });
    }
  }

  // Helper para mostrar errores
  getErrorMessage(controlName: string): string {
    const control = this.expenseForm.get(controlName);
    if (control?.errors && (control.dirty || control.touched || this.submitAttempted)) {
      if (control.errors['required']) return 'Este campo es requerido';
      if (control.errors['min']) return 'El valor debe ser mayor a 0';
      if (control.errors['minlength']) return 'La descripción debe tener al menos 3 caracteres';
    }
    return '';
  }
}
