<template>
  <div
    class="canvas-node"
    :class="[data.nodeType, { expanded: isExpanded }]"
    :style="nodeStyle"
  >
    <div class="node-accent" :style="{ background: data.color }"></div>
    <div class="node-body" :class="{ expanded: isExpanded }">
      <div class="node-header">
        <span class="node-icon" :class="data.nodeType" :style="{ background: data.color }">
          {{ nodeTypeIcon }}
        </span>
        <span class="node-type-badge" :class="data.nodeType">
          {{ nodeTypeLabel }}
        </span>
      </div>
      <h4 class="node-name">{{ data.name }}</h4>
    </div>
    <button
      v-if="isContainer"
      class="toggle-btn"
      :title="collapsed ? '展开子节点' : '折叠子节点'"
      @mousedown.stop
      @click.stop="onToggle"
    >
      <span v-if="collapsed" class="toggle-icon">▸</span>
      <span v-else class="toggle-icon">▾</span>
      <span v-if="collapsed" class="toggle-count">{{ childCount }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: { type: Object, required: true },
  graph: { type: Object, required: true },
})

const data = computed(() => props.node.getData() || {})

const isContainer = computed(() =>
  data.value.nodeType === 'flow' || data.value.nodeType === 'subflow' || data.value.nodeType === 'business-activity'
)

const collapsed = computed(() => data.value.collapsed !== false)
const isExpanded = computed(() => isContainer.value && !collapsed.value)

function getChildrenOf(node) {
  const graph = props.graph
  return graph.getNodes().filter((n) => {
    const p = n.getParent()
    return p && p.id === node.id
  })
}

const childCount = computed(() => {
  const c = data.value.childCount || 0
  console.log('[childCount]', props.node.id, 'data.childCount:', data.value.childCount, 'result:', c)
  return c
})

const nodeStyle = computed(() => ({
  '--accent-color': data.value.color || '#6366f1',
}))

const nodeTypeLabel = computed(() => {
  switch (data.value.nodeType) {
    case 'flow': return '流程'
    case 'subflow': return '子流程'
    case 'business-activity': return '业务活动'
    default: return data.value.category || '活动单元'
  }
})

const nodeTypeIcon = computed(() => {
  switch (data.value.nodeType) {
    case 'flow': return '⚙'
    case 'subflow': return '⊞'
    case 'business-activity': return '⊡'
    default: return data.value.name?.charAt(0) || '?'
  }
})

const COMPACT = {
  flow: { width: 260, height: 90 },
  subflow: { width: 230, height: 80 },
  'business-activity': { width: 220, height: 76 },
}

function onToggle() {
  const node = props.node
  const graph = props.graph
  const currentData = node.getData() || {}
  const willCollapse = !(currentData.collapsed !== false)
  const compact = COMPACT[currentData.nodeType] || { width: 200, height: 72 }

  node.setData({ ...currentData, collapsed: willCollapse }, { silent: true })
  graph.startBatch('toggle')
  layoutNode(node, compact)
  graph.stopBatch('toggle')
}

function hideDescendants(node) {
  const children = getChildrenOf(node)
  children.forEach((c) => {
    const childData = c.getData() || {}
    const childCompact = COMPACT[childData.nodeType] || { width: 200, height: 72 }
    // Reset collapsed flag so descendant knows it's visually collapsed
    c.setData({ ...childData, collapsed: true }, { silent: true })
    c.resize(childCompact.width, childCompact.height)
    c.hide()
    hideDescendants(c)
  })
}

function layoutNode(node, compact, skipCascade = false) {
  const graph = props.graph
  graph._suppressAutoResize = true

  const currentData = node.getData() || {}
  const collapsed = currentData.collapsed !== false
  const children = getChildrenOf(node)

  if (collapsed) {
    hideDescendants(node)
    node.resize(compact.width, compact.height)
  } else if (children.length === 0) {
    node.resize(compact.width, compact.height)
  } else {
    const parentPos = node.getPosition()
    let offsetY = compact.height + 10
    let maxRight = compact.width
    children.forEach((child) => {
      child.setPosition({
        x: parentPos.x + 20,
        y: parentPos.y + offsetY,
      })
      child.show()
      const childData = child.getData() || {}
      const childCompact = COMPACT[childData.nodeType] || { width: 200, height: 72 }
      if (childData.collapsed !== false) {
        hideDescendants(child)
        child.resize(childCompact.width, childCompact.height)
      } else {
        layoutNode(child, childCompact, true)
      }
      const childRight = 20 + child.getSize().width
      if (childRight > maxRight) maxRight = childRight
      offsetY += child.getSize().height + 8
    })
    const expandedH = offsetY - 8 + 16
    node.resize(Math.max(compact.width, maxRight + 16), expandedH)
  }

  graph._suppressAutoResize = false

  if (!skipCascade) {
    const parent = node.getParent()
    if (parent && parent.isNode && parent.isNode()) {
      const parentData = parent.getData() || {}
      const parentCollapsed = parentData.collapsed !== false
      if (!parentCollapsed) {
        const parentCompact = COMPACT[parentData.nodeType] || { width: 200, height: 72 }
        layoutNode(parent, parentCompact)
      }
    }
  }
}
</script>

<style scoped>
.canvas-node {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  border: 2px solid #e2e8f0;
  box-sizing: border-box;
  position: relative;
}

.canvas-node.expanded {
  background: #f8fafc;
  border-radius: 12px;
}

.canvas-node.flow {
  border-width: 2.5px;
  border-style: solid;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.canvas-node.subflow {
  border-style: dashed;
  border-radius: 10px;
}

.canvas-node.activity-unit {
  border-style: solid;
}

.canvas-node.business-activity {
  border-style: dashed;
  border-width: 2px;
  border-radius: 10px;
}

.node-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  flex-shrink: 0;
  background: var(--accent-color, #6366f1);
  border-radius: 12px 0 0 12px;
}

.canvas-node.flow .node-accent {
  width: 5px;
}

.node-body {
  flex-shrink: 0;
  padding: 12px 14px 12px 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  background: #fff;
  transition: border-color 0.2s;
}

.node-body.expanded {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 14px;
}

.canvas-node.flow .node-body {
  padding: 14px 18px 14px 22px;
}

.canvas-node.flow .node-body.expanded {
  padding-bottom: 16px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.node-icon {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  background: var(--accent-color, #6366f1);
}

.node-icon.flow {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  font-size: 14px;
}

.node-icon.subflow {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  font-size: 12px;
}

.node-type-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
  color: var(--accent-color, #6366f1);
  background: transparent;
  border: 1px solid;
  opacity: 0.6;
}

.node-type-badge.flow {
  font-size: 11px;
  padding: 2px 8px;
}

.node-type-badge.subflow {
  opacity: 0.7;
}

.node-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 30px;
}

.canvas-node.flow .node-name {
  font-size: 15px;
}

.canvas-node.subflow .node-name {
  font-size: 13px;
}

.toggle-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 26px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 0 2px;
  transition: all 0.15s;
  z-index: 20;
  min-width: 28px;
}

.toggle-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.toggle-icon {
  font-size: 10px;
  color: #64748b;
  line-height: 1;
}

.toggle-count {
  font-size: 9px;
  font-weight: 700;
  color: #64748b;
  line-height: 1;
}
</style>
