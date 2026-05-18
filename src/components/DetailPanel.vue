<template>
  <aside class="detail-panel">
    <template v-if="data">
      <div class="panel-header">
        <div class="header-accent" :style="{ background: data.color }"></div>
        <div>
          <h2>{{ data.name }}</h2>
          <div class="header-meta">
            <span class="type-badge" :class="data.nodeType" :style="{ background: data.color + '18', color: data.color }">
              {{ typeLabel }}
            </span>
            <template v-if="data.nodeType === 'business-unit'">
              <span class="category-tag" :style="{ background: data.color + '10', color: data.color + 'cc' }">
                {{ data.category }}
              </span>
            </template>
            <span class="status-badge" :class="data.status">
              {{ data.status === 'online' ? '运行中' : '已下线' }}
            </span>
          </div>
        </div>
      </div>
      <div class="panel-body">
        <div class="info-section">
          <h3 class="section-title">描述</h3>
          <p class="info-text">{{ data.description }}</p>
        </div>

        <div class="info-section">
          <h3 class="section-title">基本信息</h3>
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">版本</span>
              <span class="meta-value">{{ data.version }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">负责人</span>
              <span class="meta-value owner-cell">
                <span class="owner-dot">{{ data.owner?.charAt(0) }}</span>
                {{ data.owner }}
              </span>
            </div>
            <div class="meta-item">
              <span class="meta-label">创建时间</span>
              <span class="meta-value">{{ data.createTime }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">更新时间</span>
              <span class="meta-value">{{ data.updateTime }}</span>
            </div>
          </div>
        </div>

        <div v-if="data.nodeType === 'subflow' && parentFlowName" class="info-section">
          <h3 class="section-title">所属流程</h3>
          <div class="parent-flow-tag">
            <span class="pf-icon">⚙</span>
            <span class="pf-name">{{ parentFlowName }}</span>
          </div>
        </div>

        <div
          v-if="data.nodeType === 'flow' || data.nodeType === 'subflow'"
          class="info-section"
        >
          <h3 class="section-title">层级统计</h3>
          <div class="stat-row">
            <div v-if="data.nodeType === 'flow'" class="stat-item">
              <span class="stat-num">{{ data.subflowCount || 0 }}</span>
              <span class="stat-label">子流程</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">{{ data.unitCount || 0 }}</span>
              <span class="stat-label">业务单元</span>
            </div>
          </div>
        </div>

        <div v-if="data.nodeType === 'subflow' && data.steps?.length" class="info-section">
          <h3 class="section-title">执行步骤</h3>
          <div class="steps-list">
            <div v-for="(step, idx) in data.steps" :key="step" class="step-item">
              <span class="step-num">{{ idx + 1 }}</span>
              <span class="step-name">{{ step }}</span>
            </div>
          </div>
        </div>

        <div v-if="data.tags?.length" class="info-section">
          <h3 class="section-title">类型标签</h3>
          <div class="tag-list">
            <span
              v-for="tag in data.tags"
              :key="tag"
              class="type-tag"
              :style="{ background: data.color + '18', color: data.color, borderColor: data.color + '30' }"
            >{{ tag }}</span>
          </div>
        </div>

        <template v-if="data.nodeType === 'business-unit'">
          <div v-if="data.inputs?.length" class="info-section">
            <h3 class="section-title">输入</h3>
            <div class="tag-list">
              <span v-for="item in data.inputs" :key="item" class="io-tag input-tag">
                {{ item }}
              </span>
            </div>
          </div>

          <div v-if="data.outputs?.length" class="info-section">
            <h3 class="section-title">输出</h3>
            <div class="tag-list">
              <span v-for="item in data.outputs" :key="item" class="io-tag output-tag">
                {{ item }}
              </span>
            </div>
          </div>

          <div v-if="data.params?.length" class="info-section">
            <h3 class="section-title">参数配置</h3>
            <div class="param-list">
              <div v-for="param in data.params" :key="param.key" class="param-item">
                <span class="param-label">{{ param.label }}</span>
                <span class="param-value">{{ formatValue(param.value) }}</span>
              </div>
            </div>
          </div>
        </template>

        <div v-if="connections.length" class="info-section">
          <h3 class="section-title">连接关系</h3>
          <div class="connection-list">
            <div v-for="conn in connections" :key="conn.id" class="connection-item">
              <span class="conn-source">{{ conn.source }}</span>
              <span class="conn-arrow">→</span>
              <span class="conn-target">{{ conn.target }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div v-else class="empty-state">
      <div class="empty-icon">◉</div>
      <p class="empty-title">选择节点查看详情</p>
      <p class="empty-desc">点击画布中的流程节点查看详细信息</p>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { flows } from '../data/businessUnits.js'

const props = defineProps({
  selectedNode: { type: Object, default: null },
  graph: { type: Object, default: null },
})

const data = computed(() => {
  if (!props.selectedNode) return null
  return props.selectedNode.getData() || null
})

const typeLabel = computed(() => {
  switch (data.value?.nodeType) {
    case 'flow': return '流程'
    case 'subflow': return '子流程'
    default: return '业务单元'
  }
})

const parentFlowName = computed(() => {
  if (data.value?.nodeType !== 'subflow') return null
  const parent = flows.find((f) => f.id === data.value.parentFlowId)
  return parent?.name || null
})

const connections = computed(() => {
  if (!props.selectedNode || !props.graph) return []
  const node = props.selectedNode
  const edges = props.graph.getEdges()
  return edges
    .filter((e) => {
      const source = e.getSourceCellId()
      const target = e.getTargetCellId()
      return source === node.id || target === node.id
    })
    .map((e) => {
      const sourceNode = props.graph.getCellById(e.getSourceCellId())
      const targetNode = props.graph.getCellById(e.getTargetCellId())
      return {
        id: e.id,
        source: sourceNode?.getData()?.name || e.getSourceCellId(),
        target: targetNode?.getData()?.name || e.getTargetCellId(),
      }
    })
})

function formatValue(value) {
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}
</script>

<style scoped>
.detail-panel {
  width: 340px;
  min-width: 340px;
  background: #fff;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.header-accent {
  width: 4px;
  height: 48px;
  border-radius: 2px;
  flex-shrink: 0;
  margin-top: 4px;
}

.panel-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.type-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.type-badge.flow {
  font-size: 12px;
  padding: 3px 10px;
}

.category-tag {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-badge.online {
  background: #ecfdf5;
  color: #059669;
}

.status-badge.offline {
  background: #f1f5f9;
  color: #64748b;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-body::-webkit-scrollbar {
  width: 4px;
}

.panel-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.info-text {
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
  margin: 0;
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}

.meta-label {
  font-size: 11px;
  color: #94a3b8;
}

.meta-value {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.owner-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.owner-dot {
  width: 20px;
  height: 20px;
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

.parent-flow-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f0f4ff;
  border-radius: 8px;
  border: 1px solid #e0e7ff;
}

.pf-icon {
  font-size: 14px;
}

.pf-name {
  font-size: 13px;
  font-weight: 600;
  color: #3730a3;
}

.stat-row {
  display: flex;
  gap: 12px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}

.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 11px;
  color: #94a3b8;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
}

.step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-name {
  font-size: 13px;
  color: #475569;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.type-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid;
}

.io-tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 6px;
  font-weight: 500;
}

.input-tag {
  background: #eef2ff;
  color: #5b63d3;
}

.output-tag {
  background: #ecfdf5;
  color: #2d9f6f;
}

.param-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #f1f5f9;
}

.param-label {
  font-size: 12px;
  color: #64748b;
}

.param-value {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  max-width: 50%;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.connection-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.connection-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 12px;
}

.conn-source,
.conn-target {
  color: #475569;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conn-arrow {
  color: #94a3b8;
  flex-shrink: 0;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 40px;
  color: #cbd5e1;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
  margin: 0 0 4px;
}

.empty-desc {
  font-size: 12px;
  color: #cbd5e1;
  text-align: center;
  margin: 0;
  line-height: 1.5;
}
</style>
