/**
 * Script de Performance Baseline para CRM Kanban
 * 
 * Uso:
 * 1. Abrir Chrome DevTools > Console
 * 2. Colar este script e executar
 * 3. Realizar operações de drag-and-drop
 * 4. Ver métricas no console
 * 
 * Métricas coletadas:
 * - FPS durante drag
 * - Tempo de resposta de drag operations
 * - Re-renders detectados
 * - Layout shifts
 */

// =====================================================
// 📊 PERFORMANCE MONITOR - Cole no Console do DevTools
// =====================================================

(function CRMPerformanceMonitor() {
  const metrics = {
    dragOperations: [],
    fps: [],
    layoutShifts: 0,
    rerenders: 0,
    longTasks: [],
  };

  // 1. Monitor de FPS
  let lastTime = performance.now();
  let frameCount = 0;
  const fpsHistory = [];

  function measureFPS() {
    const now = performance.now();
    frameCount++;
    
    if (now - lastTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (now - lastTime));
      fpsHistory.push(fps);
      metrics.fps.push({ timestamp: Date.now(), fps });
      frameCount = 0;
      lastTime = now;
    }
    
    requestAnimationFrame(measureFPS);
  }

  // 2. Monitor de Long Tasks (>50ms)
  const longTaskObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        metrics.longTasks.push({
          duration: entry.duration,
          startTime: entry.startTime,
          name: entry.name,
        });
        console.warn(`⚠️ Long Task detectada: ${entry.duration.toFixed(2)}ms`);
      }
    }
  });

  // 3. Monitor de Layout Shifts
  const layoutShiftObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        metrics.layoutShifts++;
        console.warn(`📐 Layout Shift: ${entry.value.toFixed(4)}`);
      }
    }
  });

  // 4. Monitor de Drag Operations
  let dragStartTime = null;
  let isDragging = false;

  document.addEventListener('mousedown', (e) => {
    if (e.target.closest('[data-rbd-drag-handle-draggable-id]')) {
      dragStartTime = performance.now();
      isDragging = true;
      console.log('🎯 Drag iniciado');
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging && dragStartTime) {
      const duration = performance.now() - dragStartTime;
      metrics.dragOperations.push({
        duration,
        timestamp: Date.now(),
        avgFps: fpsHistory.length > 0 
          ? Math.round(fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length)
          : 0,
      });
      console.log(`✅ Drag finalizado: ${duration.toFixed(2)}ms`);
      isDragging = false;
      dragStartTime = null;
      fpsHistory.length = 0;
    }
  });

  // Iniciar observers
  try {
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    console.log('Long Task Observer não suportado');
  }

  try {
    layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    console.log('Layout Shift Observer não suportado');
  }

  measureFPS();

  // API pública
  window.CRMPerf = {
    getMetrics: () => {
      const avgDragTime = metrics.dragOperations.length > 0
        ? metrics.dragOperations.reduce((a, b) => a + b.duration, 0) / metrics.dragOperations.length
        : 0;
      
      const avgFps = metrics.fps.length > 0
        ? metrics.fps.reduce((a, b) => a + b.fps, 0) / metrics.fps.length
        : 0;

      return {
        ...metrics,
        summary: {
          totalDragOperations: metrics.dragOperations.length,
          avgDragTime: avgDragTime.toFixed(2) + 'ms',
          avgFps: avgFps.toFixed(1),
          totalLongTasks: metrics.longTasks.length,
          totalLayoutShifts: metrics.layoutShifts,
        },
      };
    },
    printReport: () => {
      const m = window.CRMPerf.getMetrics();
      console.log('\n📊 ═══════════════════════════════════════');
      console.log('   CRM KANBAN PERFORMANCE REPORT');
      console.log('═══════════════════════════════════════\n');
      console.table(m.summary);
      
      if (m.dragOperations.length > 0) {
        console.log('\n🎯 Drag Operations:');
        console.table(m.dragOperations.map((d, i) => ({
          '#': i + 1,
          'Duração': d.duration.toFixed(2) + 'ms',
          'FPS Médio': d.avgFps,
        })));
      }
      
      if (m.longTasks.length > 0) {
        console.log('\n⚠️ Long Tasks (>50ms):');
        console.table(m.longTasks.map((t, i) => ({
          '#': i + 1,
          'Duração': t.duration.toFixed(2) + 'ms',
        })));
      }
      
      console.log('\n═══════════════════════════════════════');
    },
    reset: () => {
      metrics.dragOperations = [];
      metrics.fps = [];
      metrics.layoutShifts = 0;
      metrics.longTasks = [];
      console.log('🔄 Métricas resetadas');
    },
  };

  console.log('✅ CRM Performance Monitor ativo!');
  console.log('📋 Comandos disponíveis:');
  console.log('   CRMPerf.printReport() - Ver relatório');
  console.log('   CRMPerf.getMetrics()  - Obter métricas raw');
  console.log('   CRMPerf.reset()       - Resetar métricas');
})();
