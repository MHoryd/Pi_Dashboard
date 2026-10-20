// Point this to your actual sysinfo endpoint route
const API_ENDPOINT = '/base_info'; 

async function fetchSysInfo() {
  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    updateDashboard(data);
  } catch (error) {
    console.error('Failed to fetch system info:', error);
  }
}

function updateDashboard(data) {
  // Update timestamp
  const now = new Date();
  document.getElementById('last-updated').textContent = now.toLocaleTimeString();

  // 1. Temperature
  const temp = parseFloat(data.current_temp);
  document.getElementById('temp-value').textContent = temp.toFixed(1);
  const tempBar = document.getElementById('temp-bar');
  // Assuming 80°C as maximum safe threshold for Pi scaling bar percentage
  const tempPct = Math.min(100, Math.max(0, (temp / 80) * 100)); 
  tempBar.style.width = `${tempPct}%`;

  // Dynamic bar color base on temp
  if (temp > 70) {
    tempBar.className = 'h-full bg-red-500 transition-all duration-500';
  } else if (temp > 55) {
    tempBar.className = 'h-full bg-amber-500 transition-all duration-500';
  } else {
    tempBar.className = 'h-full bg-emerald-500 transition-all duration-500';
  }

  // 2. CPU Usage
  const cpuUsages = data.cpu_usage || [];
  const avgCpu = cpuUsages.length 
    ? (cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length).toFixed(1)
    : 0;

  document.getElementById('cpu-avg').textContent = avgCpu;
  document.getElementById('cpu-avg-bar').style.width = `${avgCpu}%`;

  // CPU Cores List
  const coresContainer = document.getElementById('cpu-cores-container');
  coresContainer.innerHTML = '';

  cpuUsages.forEach((usage, idx) => {
    const coreDiv = document.createElement('div');
    coreDiv.className = 'space-y-1';
    coreDiv.innerHTML = `
      <div class="flex justify-between text-xs text-slate-300">
        <span>Core ${idx}</span>
        <span class="font-semibold">${usage.toFixed(1)}%</span>
      </div>
      <div class="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden">
        <div class="h-full bg-indigo-500 transition-all duration-500" style="width: ${Math.min(100, usage)}%"></div>
      </div>
    `;
    coresContainer.appendChild(coreDiv);
  });

  // 3. Memory Usage
  const mem = data.memory_usage || {};
  const totalMb = mem.total_mb || 1;
  const usedMb = mem.used_mb || 0;
  const freeMb = mem.free_mb || 0;
  const memPct = ((usedMb / totalMb) * 100).toFixed(1);

  document.getElementById('memory-percent').textContent = memPct;
  document.getElementById('memory-bar').style.width = `${memPct}%`;

  document.getElementById('mem-total').textContent = `${totalMb.toFixed(1)} MB`;
  document.getElementById('mem-used').textContent = `${usedMb.toFixed(1)} MB`;
  document.getElementById('mem-free').textContent = `${freeMb.toFixed(1)} MB`;

  document.getElementById('mem-used-card').textContent = `${usedMb.toFixed(1)} MB`;
  document.getElementById('mem-free-card').textContent = `${freeMb.toFixed(1)} MB`;
}

// Event Listeners & Auto-refresh (Every 3 seconds)
document.getElementById('refresh-btn').addEventListener('click', fetchSysInfo);

// Initial Load & Interval
fetchSysInfo();
setInterval(fetchSysInfo, 3000);
