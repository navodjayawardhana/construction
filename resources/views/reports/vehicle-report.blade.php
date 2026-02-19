<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Vehicle Report</title>
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
        tfoot td { font-weight: bold; background: #f9f9f9; }
    </style>
</head>
<body>
    <h1>Vehicle Report</h1>
    <p class="meta">
        <strong>Vehicle:</strong> {{ $vehicle->name }}
        @if($vehicle->registration_number) ({{ $vehicle->registration_number }}) @endif
        &nbsp;&bull;&nbsp;
        <strong>Period:</strong> {{ $dateFrom }} to {{ $dateTo }}
    </p>

    <div class="summary-box">
        <table style="border: none;">
            <tr>
                <td style="border: none;"><strong>Total Revenue:</strong> Rs. {{ number_format($totalRevenue, 2) }}</td>
                <td style="border: none;"><strong>Total Expenses:</strong> Rs. {{ number_format($totalExpenses, 2) }}</td>
                <td style="border: none;"><strong>Net Income:</strong> Rs. {{ number_format($netIncome, 2) }}</td>
            </tr>
        </table>
    </div>

    @if($jcbJobs->count() > 0)
    <h2>JCB Jobs ({{ $jcbJobs->count() }})</h2>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Client</th>
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
                <td>{{ $job->client->name ?? '-' }}</td>
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
                <td class="text-right">Rs. {{ number_format($jcbJobs->sum('total_amount'), 2) }}</td>
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
                <th>Client</th>
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
                <td>{{ $job->client->name ?? '-' }}</td>
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
                <td class="text-right">Rs. {{ number_format($lorryJobs->sum('total_amount'), 2) }}</td>
                <td></td>
            </tr>
        </tfoot>
    </table>
    @endif

    @if($expenses->count() > 0)
    <h2>Expenses ({{ $expenses->count() }})</h2>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($expenses as $exp)
            <tr>
                <td>{{ $exp->expense_date->format('d M Y') }}</td>
                <td>{{ ucfirst($exp->category) }}</td>
                <td>{{ $exp->description ?? '-' }}</td>
                <td class="text-right">Rs. {{ number_format($exp->amount, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3" class="text-right">Total Expenses:</td>
                <td class="text-right">Rs. {{ number_format($totalExpenses, 2) }}</td>
            </tr>
        </tfoot>
    </table>

    <h2>Expenses by Category</h2>
    <table style="width: 50%;">
        @foreach($expensesByCategory as $cat => $amount)
        <tr>
            <td>{{ ucfirst($cat) }}</td>
            <td class="text-right">Rs. {{ number_format($amount, 2) }}</td>
        </tr>
        @endforeach
    </table>
    @endif
</body>
</html>
