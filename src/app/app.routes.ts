import { Routes } from '@angular/router';
import { ExpenseListComponent } from './pages/expense-list/expense-list.component';
import { ExpenseFormComponent } from './pages/expense-form/expense-form.component';

export const routes: Routes = [
    // Ruta por defecto
    { path: '', redirectTo: '/expenses', pathMatch: 'full' },
    
    // Ruta de lista de gastos
    { path: 'expenses', component: ExpenseListComponent },
    { path: 'expenses/new', component: ExpenseFormComponent },
    { path: 'expenses/edit/:id', component: ExpenseFormComponent },
    
    // Ruta para cuando no se encuentra la página (opcional)
    { path: '**', redirectTo: '/expenses' }
];