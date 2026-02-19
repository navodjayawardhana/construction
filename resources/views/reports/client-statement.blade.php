<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Client Statement</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        h1 { font-size: 20px; margin-bottom: 5px; }
        h2 { font-size: 14px; margin-top: 20px; margin-bottom: 8px; color: #444; }
        .meta { color: #666; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .summary-box { background: #f9f9f9; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        tfoot td { font-weight: bold; background: #f9f9f9; }
    </style>
</head>
<body>
    <h1>Client Statement</h1>
    <p class="meta">
        <strong>Client:</strong> {{ $client->name }}
        @if($client->company_name) ({{ $client->company_name }}) @endif
        &nbsp;&bull;&nbsp;
        <strong>Period:</strong> {{ $dateFrom }} to {{ $dateTo }}
    </p>

    <div class="summary-box">
        <table style="border: none;">
            <tr>
                <td style="border: none;"><strong>Total JCB:</strong> Rs. {{ number_format($totalJcb, 2) }}</td>
                <td style="border: none;"><strong>Total Lorry:</strong> Rs. {{ number_format($totalLorry, 2) }}</td>
                <td style="border: none;"><strong>Total Jobs:</strong> Rs. {{ number_format($totalJobsAmount, 2) }}</td>
                <td style="border: none;"><strong>Total Payments:</strong> Rs. {{ number_format($totalPayments, 2) }}</td>
                <td style="border: none;"><strong>Outstanding:</strong> Rs. {{ number_format($outstandingBalance, 2) }}</td>
            </tr>
        </table>
    </div>

    @if($jcbJobs->count() > 0)
    <h2>JCB Jobs ({{ $jcbJobs->count() }})</h2>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Location</th>
                <th>Hours</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($jcbJobs as $job)
            <tr>
                <td>{{ $job->job_date->format('d M Y') }}</td>
                <td>{{ $job->vehicle->name ?? '-' }}</td>
                <td>{{ $job->location ?? '-' }}</td>
                <td>{{ $job->total_hours }}</td>
                <td class="text-right">Rs. {{ number_format($job->rate_amount, 2) }}</td>
                <td class="text-right">Rs. {{ number_format($job->total_amount, 2) }}</td>
                <td>{{ ucfirst($job->status) }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="5" class="text-right">JCB Total:</td>
                <td class="text-right">Rs. {{ number_format($totalJcb, 2) }}</td>
                <td></td>
            </tr>
        </tfoot>
    </table>
    @endif

    @if($lorryJobs->count() > 0)
    <h2>Lorry Jobs ({{ $lorryJobs->count() }})</h2>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Location</th>
                <th>Rate Type</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($lorryJobs as $job)
            <tr>
                <td>{{ $job->job_date->format('d M Y') }}</td>
                <td>{{ $job->vehicle->name ?? '-' }}</td>
                <td>{{ $job->location ?? '-' }}</td>
                <td>{{ ucfirst(str_replace('_', ' ', $job->rate_type)) }}</td>
                <td class="text-right">Rs. {{ number_format($job->rate_amount, 2) }}</td>
                <td class="text-right">Rs. {{ number_format($job->total_amount, 2) }}</td>
                <td>{{ ucfirst($job->status) }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="5" class="text-right">Lorry Total:</td>
                <td class="text-right">Rs. {{ number_format($totalLorry, 2) }}</td>
                <td></td>
            </tr>
        </tfoot>
    </table>
    @endif

    @if($payments->count() > 0)
    <h2>Payments ({{ $payments->count() }})</h2>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Method</th>
                <th>Notes</th>
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payments as $payment)
            <tr>
                <td>{{ $payment->payment_date->format('d M Y') }}</td>
                <td>{{ ucfirst(str_replace('_', ' ', $payment->payment_method)) }}</td>
                <td>{{ $payment->notes ?? '-' }}</td>
                <td class="text-right">Rs. {{ number_format($payment->amount, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3" class="text-right">Total Payments:</td>
                <td class="text-right">Rs. {{ number_format($totalPayments, 2) }}</td>
            </tr>
        </tfoot>
    </table>
    @endif
</body>
</html>
