const MANAGER_COLORS = {
  katerina: '#34d399',
  ivan: '#22c55e',
  marina: '#16a34a',
  timur: '#0ea05d',
  larisa: '#0f766e',
};

const PERIODS = {
  week: { label: 'неделю', points: 7 },
  month: { label: 'месяц', points: 30 },
  year: { label: 'год', points: 12 },
};

const managerSeeds = [
  { id: 'katerina', name: 'Катерина Орлова', city: 'Москва', base: 130, variance: 35, trend: 0.8 },
  { id: 'ivan', name: 'Иван Филимонов', city: 'Казань', base: 105, variance: 30, trend: 0.4 },
  { id: 'marina', name: 'Марина Лукина', city: 'Новосибирск', base: 115, variance: 25, trend: 0.6 },
  { id: 'timur', name: 'Тимур Абдуллаев', city: 'Санкт-Петербург', base: 95, variance: 28, trend: 0.5 },
  { id: 'larisa', name: 'Лариса Чернова', city: 'Екатеринбург', base: 100, variance: 22, trend: 0.7 },
];

function generateSeries(length, base, variance, trend) {
  const days = Array.from({ length }, (_, index) => {
    const swing = Math.sin((index / length) * Math.PI * 2) * variance * 0.5;
    const noise = (Math.random() - 0.5) * variance;
    const linearBoost = index * trend * (length > 12 ? 1 : 4);
    const value = Math.max(40, Math.round(base + swing + noise + linearBoost));
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
  sales: {
    week: generateSeries(PERIODS.week.points, seed.base * 0.9, seed.variance * 0.8, seed.trend * 0.6),
    month: generateSeries(PERIODS.month.points, seed.base, seed.variance, seed.trend),
    year: generateSeries(PERIODS.year.points, seed.base * 1.1, seed.variance * 1.4, seed.trend * 1.4),
  },
}));

let currentPeriod = 'month';

function getLabels(periodKey) {
  if (periodKey === 'year') {
    return ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  }

  const { points } = PERIODS[periodKey];
  return Array.from({ length: points }, (_, index) => `${index + 1}`);
}

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
    total.innerHTML = `<span>Итого за месяц</span><strong>${formatCurrency(getTotal(manager.sales.month))}</strong>`;

    const average = document.createElement('div');
    average.className = 'card__metric';
    average.innerHTML = `<span>Среднее в день</span><strong>${formatCurrency(getAverage(manager.sales.month))}</strong>`;

    const bestDay = document.createElement('div');
    bestDay.className = 'card__metric card__metric--highlight';
    const best = getBestDay(manager.sales.month);
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
let comparisonChart;

function renderTotalChart() {
  const canvas = document.getElementById('totalSalesChart');
  const data = managers.map(manager => getTotal(manager.sales[currentPeriod]));

  if (totalChart) {
    totalChart.destroy();
  }

  totalChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: managers.map(manager => manager.name),
      datasets: [
        {
          label: `Итого за ${PERIODS[currentPeriod].label}, тыс. ₽`,
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
      labels: getLabels(currentPeriod),
      datasets: [
        {
          label: `${manager.name} — за ${PERIODS[currentPeriod].label}, тыс. ₽`,
          data: manager.sales[currentPeriod],
          tension: 0.35,
          borderColor: color,
          backgroundColor: `${color}22`,
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

function renderComparisonChart() {
  const canvas = document.getElementById('comparisonChart');

  if (comparisonChart) {
    comparisonChart.destroy();
  }

  comparisonChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: getLabels(currentPeriod),
      datasets: managers.map(manager => ({
        label: manager.name,
        data: manager.sales[currentPeriod],
        borderColor: MANAGER_COLORS[manager.id],
        backgroundColor: `${MANAGER_COLORS[manager.id]}26`,
        tension: 0.3,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 5,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: '#cbd5e1' },
        },
        tooltip: {
          callbacks: {
            label: context => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
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
  renderComparisonChart();

  const select = document.getElementById('managerSelect');
  select.addEventListener('change', event => renderDailyChart(event.target.value));

  const toggle = document.getElementById('periodToggle');
  toggle.addEventListener('click', event => {
    if (!(event.target instanceof HTMLButtonElement)) return;

    const { period } = event.target.dataset;
    if (!period || period === currentPeriod) return;

    currentPeriod = period;

    toggle.querySelectorAll('button').forEach(button => {
      button.classList.toggle('is-active', button.dataset.period === period);
    });

    renderTotalChart();
    renderDailyChart(select.value);
    renderComparisonChart();
  });
}

document.addEventListener('DOMContentLoaded', init);
