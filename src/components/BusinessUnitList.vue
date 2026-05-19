<template>
  <aside class="bu-list-panel">
    <div class="panel-header">
      <h2>组件库</h2>
      <span class="badge">{{ totalCount }}</span>
    </div>
    <div class="panel-body">
      <div class="group-section" v-for="group in groups" :key="group.key">
        <div class="group-header" @click="group.expanded = !group.expanded">
          <span class="group-arrow" :class="{ expanded: group.expanded }">▸</span>
          <span class="group-dot" :style="{ background: group.color }"></span>
          <span class="group-name">{{ group.label }}</span>
          <span class="group-count">{{ group.items.length }}</span>
        </div>
        <div v-show="group.expanded" class="group-body">
          <div
            v-for="unit in group.items"
            :key="unit.id"
            class="bu-card"
            :class="unit.nodeType"
            draggable="true"
            @dragstart="onDragStart($event, unit)"
          >
            <div class="card-accent" :style="{ background: unit.color }"></div>
            <div class="card-content">
              <div class="card-header">
                <span class="card-icon" :style="{ background: unit.color }">
                  {{ unit.name.charAt(0) }}
                </span>
                <div class="card-header-info">
                  <span class="card-category">
                    {{ unit.nodeType === 'flow' ? '流程' : unit.nodeType === 'subflow' ? '子流程' : unit.category }}
                  </span>
                  <span class="status-dot" :class="unit.status"></span>
                </div>
              </div>
              <h3 class="card-name">{{ unit.name }}</h3>
              <p class="card-desc">{{ unit.description }}</p>

              <div class="card-tags">
                <span
                  v-for="tag in unit.tags"
                  :key="tag"
                  class="tag"
                  :style="{ background: unit.color + '18', color: unit.color }"
                >{{ tag }}</span>
              </div>

              <div class="card-footer">
                <div class="footer-left">
                  <span class="owner-avatar">{{ unit.owner?.charAt(0) }}</span>
                  <span class="owner-name">{{ unit.owner }}</span>
                </div>
                <span class="create-time">{{ unit.createTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed, reactive } from 'vue'

const props = defineProps({
  flows: { type: Array, default: () => [] },
  subflows: { type: Array, default: () => [] },
  activities: { type: Array, default: () => [] },
  units: { type: Array, default: () => [] },
})

const emit = defineEmits(['drag-start'])

const totalCount = computed(() => props.flows.length + props.subflows.length + props.activities.length + props.units.length)

const groups = reactive([
  { key: 'flow', label: '流程', color: '#1e40af', expanded: true, get items() { return props.flows } },
  { key: 'subflow', label: '子流程', color: '#7c3aed', expanded: true, get items() { return props.subflows } },
  { key: 'activity', label: '业务活动', color: '#4f46e5', expanded: true, get items() { return props.activities } },
  { key: 'unit', label: '活动单元', color: '#6366f1', expanded: true, get items() { return props.units } },
])

function onDragStart(event, unit) {
  event.dataTransfer.setData('application/json', JSON.stringify(unit))
  event.dataTransfer.effectAllowed = 'copy'
  emit('drag-start', unit)
}
</script>

<style scoped>
.bu-list-panel {
  width: 300px;
  min-width: 300px;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.badge {
  background: #e2e8f0;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px 12px;
}

.panel-body::-webkit-scrollbar {
  width: 4px;
}

.panel-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.group-section {
  margin-bottom: 4px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 4px;
  cursor: pointer;
  user-select: none;
  border-radius: 6px;
  transition: background 0.15s;
}

.group-header:hover {
  background: #f8fafc;
}

.group-arrow {
  font-size: 10px;
  color: #94a3b8;
  transition: transform 0.2s;
  width: 14px;
  text-align: center;
}

.group-arrow.expanded {
  transform: rotate(90deg);
}

.group-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.group-name {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  flex: 1;
}

.group-count {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.group-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 4px;
}

.bu-card {
  display: flex;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e2e8f0;
  cursor: grab;
  transition: all 0.2s ease;
}

.bu-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
  transform: translateY(-1px);
}

.bu-card:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.bu-card.flow {
  border-width: 2px;
}

.bu-card.subflow {
  border-style: dashed;
}

.card-accent {
  width: 4px;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  padding: 14px;
  min-width: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.card-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.card-header-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}

.card-category {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.online {
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.status-dot.offline {
  background: #94a3b8;
  box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.2);
}

.card-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px;
}

.card-desc {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 10px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.owner-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.owner-name {
  font-size: 11px;
  color: #475569;
  font-weight: 500;
}

.create-time {
  font-size: 11px;
  color: #94a3b8;
}
</style>
