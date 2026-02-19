<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Daily Job Summary</title>
    <style>
        body { font-family: sans-serif; font-size: 11px; color: #333; }
        h1 { font-size: 20px; margin-bottom: 5px; }
        h2 { font-size: 13px; margin-top: 15px; margin-bottom: 6px; color: #444; }
        .meta { color: #666; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .date-header { background: #e8f0fe; font-weight: bold; padding: 6px 8px; margin-top: 12px; }
        .daily-total { background: #f9f9f9; font-weight: bold; }
        .grand-total { background: #e0e0e0; font-weight: bold; font-size: 13px; }
        .summary-box { background: #f9f9f9; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <h1>Daily Job Summary</h1>
    <p class="meta"><strong>Period:</strong> {{ $dateFrom }} to {{ $dateTo }}</p>

    <div class="summary-box">
        <table style="border: none;">
            <tr>
                <td style="border: none;"><strong>Total JCB:</strong> Rs. {{ number_format($grandTotal['total_jcb'], 2) }}</td>
                <td style="border: none;"><strong>Total Lorry:</strong> Rs. {{ number_format($grandTotal['total_lorry'], 2) }}</td>
                <td style="border: none;"><strong>Grand Total:</strong> Rs. {{ number_format($grandTotal['total'], 2) }}</td>
            </tr>
        </table>
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Vehicle</th>
                <th>Client</th>
                <th>Location</th>
                <th>Details</th>
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($dailySummary as $day)
                @foreach($day['jcb_jobs'] as $job)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($day['date'])->format('d M Y') }}</td>
                    <td>JCB</td>
                    <td>{{ $job->vehicle->name ?? '-' }}</td>
                    <td>{{ $job->client->name ?? '-' }}</td>
                    <td>{{ $job->location ?? '-' }}</td>
                    <td>{{ $job->total_hours }} hrs</td>
                    <td class="text-right">Rs. {{ number_format($job->total_amount, 2) }}</td>
                </tr>
                @endforeach
                @foreach($day['lorry_jobs'] as $job)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($day['date'])->format('d M Y') }}</td>
                    <td>Lorry</td>
                    <td>{{ $job->vehicle->name ?? '-' }}</td>
                    <td>{{ $job->client->name ?? '-' }}</td>
                    <td>{{ $job->location ?? '-' }}</td>
                    <td>{{ ucfirst(str_replace('_', ' ', $job->rate_type)) }}</td>
                    <td class="text-right">Rs. {{ number_format($job->total_amount, 2) }}</td>
                </tr>
                @endforeach
                <tr class="daily-total">
                    <td colspan="6" class="text-right">{{ \Carbon\Carbon::parse($day['date'])->format('d M Y') }} Total (JCB: {{ $day['jcb_count'] }}, Lorry: {{ $day['lorry_count'] }}):</td>
                    <td class="text-right">Rs. {{ number_format($day['daily_total'], 2) }}</td>
                </tr>
            @endforeach
            <tr class="grand-total">
                <td colspan="6" class="text-right">Grand Total:</td>
                <td class="text-right">Rs. {{ number_format($grandTotal['total'], 2) }}</td>
            </tr>
        </tbody>
    </table>
</body>
</html>
