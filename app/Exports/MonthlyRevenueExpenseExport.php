<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class MonthlyRevenueExpenseExport implements FromArray, WithHeadings, WithTitle
{
    protected array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function title(): string
    {
        return 'Revenue & Expense';
    }

    public function headings(): array
    {
        return ['Category', 'Description', 'Amount'];
    }

    public function array(): array
    {
        $rows = [
            ['Period', $this->data['monthName'] . ' ' . $this->data['year'], ''],
            ['', '', ''],
            ['REVENUE', '', ''],
            ['Revenue', 'JCB Jobs (' . $this->data['jcbJobs']->count() . ')', number_format($this->data['jcbRevenue'], 2)],
            ['Revenue', 'Lorry Jobs (' . $this->data['lorryJobs']->count() . ')', number_format($this->data['lorryRevenue'], 2)],
        ];

        foreach ($this->data['lorryByType'] as $type => $amount) {
            $rows[] = ['Revenue', '  Lorry - ' . ucfirst(str_replace('_', ' ', $type)), number_format($amount, 2)];
        }

        $rows[] = ['TOTAL REVENUE', '', number_format($this->data['totalRevenue'], 2)];
        $rows[] = ['', '', ''];
        $rows[] = ['EXPENSES', '', ''];

        foreach ($this->data['expensesByCategory'] as $cat => $amount) {
            $rows[] = ['Expense', 'Vehicle - ' . ucfirst($cat), number_format($amount, 2)];
        }

        $rows[] = ['Expense', 'Vehicle Expenses Subtotal', number_format($this->data['totalVehicleExpenses'], 2)];
        $rows[] = ['Expense', 'Salary Payments (' . $this->data['salaryPayments']->count() . ')', number_format($this->data['totalSalaryPayments'], 2)];
        $rows[] = ['TOTAL EXPENSES', '', number_format($this->data['totalExpenses'], 2)];
        $rows[] = ['', '', ''];
        $rows[] = ['PROFIT / LOSS', '', number_format($this->data['profitLoss'], 2)];

        return $rows;
    }
}
