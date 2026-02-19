<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class VehicleReportExport implements WithMultipleSheets
{
    protected array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function sheets(): array
    {
        return [
            'JCB Jobs' => new VehicleReportJcbSheet($this->data),
            'Lorry Jobs' => new VehicleReportLorrySheet($this->data),
            'Expenses' => new VehicleReportExpensesSheet($this->data),
            'Summary' => new VehicleReportSummarySheet($this->data),
        ];
    }
}

class VehicleReportJcbSheet implements FromArray, \Maatwebsite\Excel\Concerns\WithTitle, \Maatwebsite\Excel\Concerns\WithHeadings
{
    protected array $data;

    public function __construct(array $data) { $this->data = $data; }

    public function title(): string { return 'JCB Jobs'; }

    public function headings(): array
    {
        return ['Date', 'Client', 'Location', 'Hours', 'Rate', 'Amount', 'Status'];
    }

    public function array(): array
    {
        return $this->data['jcbJobs']->map(function ($job) {
            return [
                $job->job_date->format('Y-m-d'),
                $job->client->name ?? '-',
                $job->location ?? '-',
                $job->total_hours,
                number_format($job->rate_amount, 2),
                number_format($job->total_amount, 2),
                $job->status,
            ];
        })->toArray();
    }
}

class VehicleReportLorrySheet implements FromArray, \Maatwebsite\Excel\Concerns\WithTitle, \Maatwebsite\Excel\Concerns\WithHeadings
{
    protected array $data;

    public function __construct(array $data) { $this->data = $data; }

    public function title(): string { return 'Lorry Jobs'; }

    public function headings(): array
    {
        return ['Date', 'Client', 'Location', 'Rate Type', 'Rate', 'Amount', 'Status'];
    }

    public function array(): array
    {
        return $this->data['lorryJobs']->map(function ($job) {
            return [
                $job->job_date->format('Y-m-d'),
                $job->client->name ?? '-',
                $job->location ?? '-',
                ucfirst(str_replace('_', ' ', $job->rate_type)),
                number_format($job->rate_amount, 2),
                number_format($job->total_amount, 2),
                $job->status,
            ];
        })->toArray();
    }
}

class VehicleReportExpensesSheet implements FromArray, \Maatwebsite\Excel\Concerns\WithTitle, \Maatwebsite\Excel\Concerns\WithHeadings
{
    protected array $data;

    public function __construct(array $data) { $this->data = $data; }

    public function title(): string { return 'Expenses'; }

    public function headings(): array
    {
        return ['Date', 'Category', 'Description', 'Amount'];
    }

    public function array(): array
    {
        return $this->data['expenses']->map(function ($exp) {
            return [
                $exp->expense_date->format('Y-m-d'),
                ucfirst($exp->category),
                $exp->description ?? '-',
                number_format($exp->amount, 2),
            ];
        })->toArray();
    }
}

class VehicleReportSummarySheet implements FromArray, \Maatwebsite\Excel\Concerns\WithTitle, \Maatwebsite\Excel\Concerns\WithHeadings
{
    protected array $data;

    public function __construct(array $data) { $this->data = $data; }

    public function title(): string { return 'Summary'; }

    public function headings(): array
    {
        return ['Description', 'Amount'];
    }

    public function array(): array
    {
        $rows = [
            ['Vehicle', $this->data['vehicle']->name],
            ['Period', $this->data['dateFrom'] . ' to ' . $this->data['dateTo']],
            ['JCB Revenue', number_format($this->data['jcbJobs']->sum('total_amount'), 2)],
            ['Lorry Revenue', number_format($this->data['lorryJobs']->sum('total_amount'), 2)],
            ['Total Revenue', number_format($this->data['totalRevenue'], 2)],
            ['', ''],
        ];

        foreach ($this->data['expensesByCategory'] as $cat => $amount) {
            $rows[] = ['Expense: ' . ucfirst($cat), number_format($amount, 2)];
        }

        $rows[] = ['Total Expenses', number_format($this->data['totalExpenses'], 2)];
        $rows[] = ['Net Income', number_format($this->data['netIncome'], 2)];

        return $rows;
    }
}
