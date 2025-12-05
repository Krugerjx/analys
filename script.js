const MANAGER_COLORS = {
  katerina: '#7c3aed',
  ivan: '#f59e0b',
  marina: '#22c55e',
  timur: '#3b82f6',
  larisa: '#ef4444',
};

const managerSeeds = [
  { id: 'katerina', name: 'Катерина Орлова', city: 'Москва', base: 130, variance: 35, trend: 0.8 },
  { id: 'ivan', name: 'Иван Филимонов', city: 'Казань', base: 105, variance: 30, trend: 0.4 },
  { id: 'marina', name: 'Марина Лукина', city: 'Новосибирск', base: 115, variance: 25, trend: 0.6 },
  { id: 'timur', name: 'Тимур Абдуллаев', city: 'Санкт-Петербург', base: 95, variance: 28, trend: 0.5 },
  { id: 'larisa', name: 'Лариса Чернова', city: 'Екатеринбург', base: 100, variance: 22, trend: 0.7 },
];

const DAY_LABELS = Array.from({ length: 30 }, (_, index) => `${index + 1}`);

function generateMonthlySeries(length, base, variance, trend) {
  const days = Array.from({ length }, (_, index) => {
    const swing = Math.sin((index / length) * Math.PI * 2) * variance * 0.4;
    const noise = (Math.random() - 0.5) * variance;
    const linearBoost = index * trend;
    const value = Math.max(60, Math.round(base + swing + noise + linearBoost));
    return value;
  });

  return smoothSeries(days, 2);
}

function smoothSeries(series, windowSize) {
  return series.map((_, index, arr) => {
    const slice = arr.slice(Math.max(0, index - windowSize), Math.min(arr.length, index + windowSize + 1));
    const average = slice.reduce((sum, value) => sum + value, 0) / slice.length;
    return Math.round((arr[index] + average) / 2);
  });
}

const managers = managerSeeds.map(seed => ({
  ...seed,
  dailySales: generateMonthlySeries(30, seed.base, seed.variance, seed.trend),
}));

function getTotal(sales) {
  return sales.reduce((sum, value) => sum + value, 0);
}

function getAverage(sales) {
  return sales.length ? Math.round(getTotal(sales) / sales.length) : 0;
}

function getBestDay(sales) {
  const maxValue = Math.max(...sales);
  const dayIndex = sales.indexOf(maxValue);
  return { day: dayIndex + 1, value: maxValue };
}

function formatCurrency(value) {
  return `${value.toLocaleString('ru-RU')} тыс. ₽`;
}

function renderCards() {
  const container = document.getElementById('summaryCards');
  container.innerHTML = '';

  const fragment = document.createDocumentFragment();
  managers.forEach(manager => {
    const card = document.createElement('article');
    card.className = 'card';

    const title = document.createElement('div');
    title.className = 'card__title';
    title.textContent = manager.name;

    const location = document.createElement('div');
    location.className = 'card__location';
    location.textContent = manager.city;

    const total = document.createElement('div');
    total.className = 'card__metric';
    total.innerHTML = `<span>Итого за месяц</span><strong>${formatCurrency(getTotal(manager.dailySales))}</strong>`;

    const average = document.createElement('div');
    average.className = 'card__metric';
    average.innerHTML = `<span>Среднее в день</span><strong>${formatCurrency(getAverage(manager.dailySales))}</strong>`;

    const bestDay = document.createElement('div');
    bestDay.className = 'card__metric card__metric--highlight';
    const best = getBestDay(manager.dailySales);
    bestDay.innerHTML = `<span>Лучший день (${best.day})</span><strong>${formatCurrency(best.value)}</strong>`;

    card.append(title, location, total, average, bestDay);
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

function fillSelect() {
  const select = document.getElementById('managerSelect');
  select.innerHTML = '';

  managers.forEach(manager => {
    const option = document.createElement('option');
    option.value = manager.id;
    option.textContent = manager.name;
    select.appendChild(option);
  });
}

let totalChart;
let dailyChart;

function renderTotalChart() {
  const canvas = document.getElementById('totalSalesChart');
  const data = managers.map(manager => getTotal(manager.dailySales));

  if (totalChart) {
    totalChart.destroy();
  }

  totalChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: managers.map(manager => manager.name),
      datasets: [
        {
          label: 'Итого за месяц, тыс. ₽',
          data,
          backgroundColor: managers.map(manager => `${MANAGER_COLORS[manager.id]}cc`),
          borderColor: managers.map(manager => MANAGER_COLORS[manager.id]),
          borderWidth: 1.5,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `${formatCurrency(context.parsed.y)}`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#cbd5e1' } },
        y: { grid: { color: '#1f2937' }, ticks: { color: '#cbd5e1', callback: value => `${value}` } },
      },
    },
  });
}

function renderDailyChart(managerId) {
  const manager = managers.find(item => item.id === managerId) ?? managers[0];
  const canvas = document.getElementById('dailySalesChart');

  if (dailyChart) {
    dailyChart.destroy();
  }

  const color = MANAGER_COLORS[manager.id];

  dailyChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: DAY_LABELS,
      datasets: [
        {
          label: `${manager.name} — ежедневно, тыс. ₽`,
          data: manager.dailySales,
          tension: 0.35,
          borderColor: color,
          backgroundColor: `${color}33`,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `День ${context.label}: ${formatCurrency(context.parsed.y)}`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#cbd5e1' } },
        y: { grid: { color: '#1f2937' }, ticks: { color: '#cbd5e1', callback: value => `${value}` } },
      },
    },
  });
}

function init() {
  renderCards();
  fillSelect();
  renderTotalChart();
  renderDailyChart(managers[0].id);

  const select = document.getElementById('managerSelect');
  select.addEventListener('change', event => renderDailyChart(event.target.value));
}

document.addEventListener('DOMContentLoaded', init);
