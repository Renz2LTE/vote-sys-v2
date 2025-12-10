/* js/features/analytics.js */
import { db } from "../firebase-config.js";
import { 
    collection, onSnapshot, query, orderBy 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

let chartInstance = null;

export function initAnalyticsFeature() {
    const ctx = document.getElementById('resultsChart');
    if (!ctx) return; // Stop if element is missing (e.g. on Admin page)

    // 1. Initialize Empty Chart
    // We use the global 'Chart' object provided by the CDN script in HTML
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Votes',
                data: [],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)', // Blue
                    'rgba(255, 99, 132, 0.6)', // Red
                    'rgba(255, 206, 86, 0.6)', // Yellow
                    'rgba(75, 192, 192, 0.6)', // Green
                    'rgba(153, 102, 255, 0.6)', // Purple
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    // 2. Listen to Real-Time Data
    // We listen to the 'candidates' collection
    const q = query(collection(db, "candidates"), orderBy("voteCount", "desc"));

    onSnapshot(q, (snapshot) => {
        const names = [];
        const votes = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            // For the dashboard summary, we usually show the "Presidential" race or top candidates
            // You can change this filter to 'Vice President' etc. or remove it to show everyone
            if (data.position === "President") { 
                names.push(data.name);
                votes.push(data.voteCount);
            }
        });

        updateChart(names, votes);
    });
}

function updateChart(labels, data) {
    if (chartInstance) {
        chartInstance.data.labels = labels;
        chartInstance.data.datasets[0].data = data;
        chartInstance.update();
    }
}