<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class DailyJobSummaryExport implements FromArray, WithHeadings, WithTitle
{
    protected array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function title(): string
    {
        return 'Daily Job Summary';
    }

    public function headings(): array
    {
        return ['Date', 'Type', 'Vehicle', 'Client', 'Location', 'Hours/Rate Type', 'Amount'];
    }

    public function array(): array
    {
        $rows = [];

        foreach ($this->data['dailySummary'] as $day) {
            foreach ($day['jobs'] as $job) {
                $rows[] = [
                    $day['date'],
                    strtoupper($job->job_type),
                    $job->vehicle->name ?? '-',
                    $job->client->name ?? '-',
                    $job->location ?? '-',
                    $job->job_type === 'jcb' ? $job->total_hours . ' hrs' : ucfirst(str_replace('_', ' ', $job->rate_type)),
                    number_format($job->total_amount, 2),
                ];
            }

            $rows[] = [
                $day['date'],
                'DAILY TOTAL',
                '',
                '',
                '',
                'JCB: ' . number_format($day['jcb_total'], 2) . ' | Lorry: ' . number_format($day['lorry_total'], 2),
                number_format($day['daily_total'], 2),
            ];
        }

        $rows[] = ['', '', '', '', '', '', ''];
        $rows[] = [
            'GRAND TOTAL',
            '',
            '',
            '',
            '',
            'JCB: ' . number_format($this->data['grandTotal']['total_jcb'], 2) . ' | Lorry: ' . number_format($this->data['grandTotal']['total_lorry'], 2),
            number_format($this->data['grandTotal']['total'], 2),
        ];

        return $rows;
    }
}
