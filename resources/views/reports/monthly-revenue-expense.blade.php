<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Monthly Revenue & Expense</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        h1 { font-size: 20px; margin-bottom: 5px; }
        h2 { font-size: 14px; margin-top: 20px; margin-bottom: 8px; }
        .meta { color: #666; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .section-total { font-weight: bold; background: #f0f0f0; }
        .profit-row { font-weight: bold; font-size: 14px; background: #e8f0fe; }
        .indent { padding-left: 25px; }
        .summary-box { background: #f9f9f9; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <h1>Monthly Revenue & Expense Report</h1>
    <p class="meta"><strong>Period:</strong> {{ $monthName }} {{ $year }}</p>

    <div class="summary-box">
        <table style="border: none;">
            <tr>
                <td style="border: none;"><strong>Total Revenue:</strong> Rs. {{ number_format($totalRevenue, 2) }}</td>
                <td style="border: none;"><strong>Total Expenses:</strong> Rs. {{ number_format($totalExpenses, 2) }}</td>
                <td style="border: none;"><strong>Profit/Loss:</strong> Rs. {{ number_format($profitLoss, 2) }}</td>
            </tr>
        </table>
    </div>

    <table>
        <thead>
            <tr>
                <th>Category</th>
                <th>Description</th>
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr><td colspan="3"><strong>REVENUE</strong></td></tr>
            <tr>
                <td class="indent">JCB Jobs</td>
                <td>{{ $jcbJobs->count() }} jobs</td>
                <td class="text-right">Rs. {{ number_format($jcbRevenue, 2) }}</td>
            </tr>
            <tr>
                <td class="indent">Lorry Jobs</td>
                <td>{{ $lorryJobs->count() }} jobs</td>
                <td class="text-right">Rs. {{ number_format($lorryRevenue, 2) }}</td>
            </tr>
            @foreach($lorryByType as $type => $amount)
            <tr>
                <td class="indent" style="padding-left: 45px;">{{ ucfirst(str_replace('_', ' ', $type)) }}</td>
                <td></td>
                <td class="text-right">Rs. {{ number_format($amount, 2) }}</td>
            </tr>
            @endforeach
            <tr class="section-total">
                <td colspan="2">Total Revenue</td>
                <td class="text-right">Rs. {{ number_format($totalRevenue, 2) }}</td>
            </tr>

            <tr><td colspan="3">&nbsp;</td></tr>
            <tr><td colspan="3"><strong>EXPENSES</strong></td></tr>
            @foreach($expensesByCategory as $cat => $amount)
            <tr>
                <td class="indent">Vehicle - {{ ucfirst($cat) }}</td>
                <td></td>
                <td class="text-right">Rs. {{ number_format($amount, 2) }}</td>
            </tr>
            @endforeach
            <tr>
                <td class="indent"><strong>Vehicle Expenses Subtotal</strong></td>
                <td></td>
                <td class="text-right"><strong>Rs. {{ number_format($totalVehicleExpenses, 2) }}</strong></td>
            </tr>
            <tr>
                <td class="indent">Salary Payments</td>
                <td>{{ $salaryPayments->count() }} payments</td>
                <td class="text-right">Rs. {{ number_format($totalSalaryPayments, 2) }}</td>
            </tr>
            <tr class="section-total">
                <td colspan="2">Total Expenses</td>
                <td class="text-right">Rs. {{ number_format($totalExpenses, 2) }}</td>
            </tr>

            <tr><td colspan="3">&nbsp;</td></tr>
            <tr class="profit-row">
                <td colspan="2">Profit / Loss</td>
                <td class="text-right">Rs. {{ number_format($profitLoss, 2) }}</td>
            </tr>
        </tbody>
    </table>
</body>
</html>
