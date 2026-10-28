const BASE_INFO_ENDPOINT = '/base_info';
const DOCKER_INFO_ENDPOINT = '/docker_info';

async function fetchDashboardData() {
  // Update timestamp
  const now = new Date();
  document.getElementById('last-updated').textContent = now.toLocaleTimeString();

  // 1. Fetch Base System Info
  try {
    const response = await fetch(BASE_INFO_ENDPOINT);
    if (response.ok) {
      const data = await response.json();
      updateSystemInfo(data);
    } else {
      console.error('Base info response failed:', response.status);
    }
  } catch (error) {
    console.error('Error fetching base info:', error);
  }

  // 2. Fetch Docker Info
  try {
    const response = await fetch(DOCKER_INFO_ENDPOINT);
    if (response.ok) {
      const data = await response.json();
      updateDockerInfo(data);
    } else {
      console.error('Docker info response failed:', response.status);
    }
  } catch (error) {
    console.error('Error fetching docker info:', error);
  }
}

function updateSystemInfo(data) {
  // 1. Temperature
  const temp = parseFloat(data.current_temp || 0);
  document.getElementById('temp-value').textContent = temp.toFixed(1);
  const tempBar = document.getElementById('temp-bar');
  const tempPct = Math.min(100, Math.max(0, (temp / 80) * 100));
  tempBar.style.width = `${tempPct}%`;

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

function updateDockerInfo(containers) {
  const tbody = document.getElementById('docker-tbody');
  const countBadge = document.getElementById('docker-count');

  if (!Array.isArray(containers)) return;

  countBadge.textContent = `${containers.length} container${containers.length === 1 ? '' : 's'}`;
  tbody.innerHTML = '';

  if (containers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="py-4 px-4 text-center text-slate-500">No Docker containers found</td></tr>`;
    return;
  }

  containers.forEach(container => {
    const isRunning = container.container_state && container.container_state.toLowerCase() === 'running';

    const badgeClass = isRunning
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/30 transition-colors';
    tr.innerHTML = `
      <td class="py-3 px-4 font-medium text-slate-200 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
        ${container.container_name || 'unknown'}
      </td>
      <td class="py-3 px-4">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass}">
          ${container.container_state || 'unknown'}
        </span>
      </td>
      <td class="py-3 px-4 text-slate-400 text-xs">${container.container_status || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Event Listeners & Auto-refresh (Every 3 seconds)
document.getElementById('refresh-btn').addEventListener('click', fetchDashboardData);

// Initial Load & Interval
fetchDashboardData();
setInterval(fetchDashboardData, 3000);
