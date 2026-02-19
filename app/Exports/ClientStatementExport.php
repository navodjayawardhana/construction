<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class ClientStatementExport implements WithMultipleSheets
{
    protected array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function sheets(): array
    {
        return [
            'JCB Jobs' => new ClientStatementJcbSheet($this->data),
            'Lorry Jobs' => new ClientStatementLorrySheet($this->data),
            'Payments' => new ClientStatementPaymentsSheet($this->data),
            'Summary' => new ClientStatementSummarySheet($this->data),
        ];
    }
}

class ClientStatementJcbSheet implements FromArray, \Maatwebsite\Excel\Concerns\WithTitle, \Maatwebsite\Excel\Concerns\WithHeadings
{
    protected array $data;

    public function __construct(array $data) { $this->data = $data; }

    public function title(): string { return 'JCB Jobs'; }

    public function headings(): array
    {
        return ['Date', 'Vehicle', 'Location', 'Hours', 'Rate', 'Amount', 'Status'];
    }

    public function array(): array
    {
        return $this->data['jcbJobs']->map(function ($job) {
            return [
                $job->job_date->format('Y-m-d'),
                $job->vehicle->name ?? '-',
                $job->location ?? '-',
                $job->total_hours,
                number_format($job->rate_amount, 2),
                number_format($job->total_amount, 2),
                $job->status,
            ];
        })->toArray();
    }
}

class ClientStatementLorrySheet implements FromArray, \Maatwebsite\Excel\Concerns\WithTitle, \Maatwebsite\Excel\Concerns\WithHeadings
{
    protected array $data;

    public function __construct(array $data) { $this->data = $data; }

    public function title(): string { return 'Lorry Jobs'; }

    public function headings(): array
    {
        return ['Date', 'Vehicle', 'Location', 'Rate Type', 'Rate', 'Amount', 'Status'];
    }

    public function array(): array
    {
        return $this->data['lorryJobs']->map(function ($job) {
            return [
                $job->job_date->format('Y-m-d'),
                $job->vehicle->name ?? '-',
                $job->location ?? '-',
                ucfirst(str_replace('_', ' ', $job->rate_type)),
                number_format($job->rate_amount, 2),
                number_format($job->total_amount, 2),
                $job->status,
            ];
        })->toArray();
    }
}

class ClientStatementPaymentsSheet implements FromArray, \Maatwebsite\Excel\Concerns\WithTitle, \Maatwebsite\Excel\Concerns\WithHeadings
{
    protected array $data;

    public function __construct(array $data) { $this->data = $data; }

    public function title(): string { return 'Payments'; }

    public function headings(): array
    {
        return ['Date', 'Method', 'Notes', 'Amount'];
    }

    public function array(): array
    {
        return $this->data['payments']->map(function ($payment) {
            return [
                $payment->payment_date->format('Y-m-d'),
                ucfirst(str_replace('_', ' ', $payment->payment_method)),
                $payment->notes ?? '-',
                number_format($payment->amount, 2),
            ];
        })->toArray();
    }
}

class ClientStatementSummarySheet implements FromArray, \Maatwebsite\Excel\Concerns\WithTitle, \Maatwebsite\Excel\Concerns\WithHeadings
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
        return [
            ['Client', $this->data['client']->name],
            ['Period', $this->data['dateFrom'] . ' to ' . $this->data['dateTo']],
            ['Total JCB Amount', number_format($this->data['totalJcb'], 2)],
            ['Total Lorry Amount', number_format($this->data['totalLorry'], 2)],
            ['Total Jobs Amount', number_format($this->data['totalJobsAmount'], 2)],
            ['Total Payments', number_format($this->data['totalPayments'], 2)],
            ['Outstanding Balance', number_format($this->data['outstandingBalance'], 2)],
        ];
    }
}
