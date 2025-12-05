const managers = [
  { id:'anna', name:'Анна Смирнова', dailySales:[120,90,100,130,140,110,95,150,160,155,145,170,180,175,160,150,140,135,145,155,165,170,180,190,185,175,160,150,145,155]},
  { id:'boris', name:'Борис Иванов', dailySales:[80,75,90,85,95,100,110,105,120,125,130,135,120,115,110,100,105,110,115,120,110,100,95,90,85,100,105,110,115,120]},
  { id:'sergey', name:'Сергей Петров', dailySales:[60,70,65,75,80,85,90,95,100,110,105,115,120,130,135,140,145,150,145,140,135,130,125,120,115,110,100,95,90,85]},
  { id:'inna', name:'Инна Кузнецова', dailySales:[100,110,120,115,130,140,135,145,150,160,155,165,170,175,180,190,200,195,185,175,165,170,160,155,150,145,140,135,130,125]},
  { id:'maxim', name:'Максим Беккер', dailySales:[90,95,100,105,110,120,130,125,135,140,145,150,155,160,150,140,135,130,125,120,115,110,100,95,90,100,110,120,130,140]}
];

const dayLabels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);

const summary = document.getElementById("summaryCards");
const managerSelect = document.getElementById("managerSelect");

function getTotal(ds){ return ds.reduce((a,b)=>a+b,0); }

function renderCards(){
  summary.innerHTML = "";
  managers.forEach(m=>{
    summary.innerHTML += `<div class='card'>
      <div>${m.name}</div>
      <div><b>${getTotal(m.dailySales)} тыс. ₽</b></div>
    </div>`;
  })
}

function fillSelect(){
  managers.forEach(m=>{
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.name;
    managerSelect.appendChild(opt);
  });
}

let totalChart, dailyChart;

function renderTotal(){
  const ctx = document.getElementById("totalSalesChart");
  totalChart = new Chart(ctx,{
    type:'bar',
    data:{
      labels: managers.map(m=>m.name),
      datasets:[{ label:'Продажи', data: managers.map(m=>getTotal(m.dailySales)) }]
    }
  });
}

function renderDaily(id){
  const m = managers.find(x=>x.id===id) || managers[0];
  const ctx = document.getElementById("dailySalesChart");
  if(dailyChart){ dailyChart.destroy(); }
  dailyChart = new Chart(ctx,{
    type:'line',
    data:{
      labels: dayLabels,
      datasets:[{label:m.name, data:m.dailySales}]
    }
  });
}

document.addEventListener("DOMContentLoaded",()=>{
  renderCards();
  fillSelect();
  renderTotal();
  renderDaily(managers[0].id);

  managerSelect.addEventListener("change", e=>renderDaily(e.target.value));
});
