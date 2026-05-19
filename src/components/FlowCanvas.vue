<template>
  <div class="flow-canvas-wrapper">
    <div class="canvas-toolbar">
      <button
        v-for="btn in toolbarButtons"
        :key="btn.key"
        class="toolbar-btn"
        :title="btn.title"
        @click="btn.action"
      >
        <span v-html="btn.icon"></span>
      </button>
      <span class="toolbar-divider"></span>
      <span class="zoom-label">{{ zoomPercent }}%</span>
    </div>
    <div
      ref="containerRef"
      class="canvas-container"
      @dragover.prevent="onDragOver"
      @drop.prevent="onDrop"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Graph } from '@antv/x6'
import { register } from '@antv/x6-vue-shape'
import CanvasNode from './CanvasNode.vue'
import { flows, subflows, businessActivities, activityUnits } from '../data/businessUnits.js'

const emit = defineEmits(['node-select', 'graph-ready'])

const containerRef = ref(null)
let graph = null

const zoomPercent = ref(100)

const NODE_CONFIG = {
  flow: { shape: 'flow-node', width: 260, height: 90 },
  subflow: { shape: 'subflow-node', width: 230, height: 80 },
  'business-activity': { shape: 'ba-node', width: 220, height: 76 },
  'activity-unit': { shape: 'bu-node', width: 200, height: 72 },
}

const HIERARCHY_LEVEL = { flow: 4, subflow: 3, 'business-activity': 2, 'activity-unit': 1 }

const INDENT_X = 20

function getSubflowsOf(flowId) {
  return subflows.filter((s) => s.parentFlowId === flowId)
}

function getBAsOf(subflowId) {
  return businessActivities.filter((ba) => ba.parentSubflowId === subflowId)
}

function getBUsOf(baId) {
  return activityUnits.filter((bu) => bu.parentActivityId === baId)
}

const toolbarButtons = [
  {
    key: 'undo',
    title: '撤销 (Ctrl+Z)',
    icon: '↩',
    action: () => graph?.undo(),
  },
  {
    key: 'redo',
    title: '重做 (Ctrl+Shift+Z)',
    icon: '↪',
    action: () => graph?.redo(),
  },
  {
    key: 'zoom-in',
    title: '放大',
    icon: '+',
    action: () => graph?.zoom(0.1),
  },
  {
    key: 'zoom-out',
    title: '缩小',
    icon: '−',
    action: () => graph?.zoom(-0.1),
  },
  {
    key: 'fit',
    title: '适应画布',
    icon: '⊡',
    action: () => graph?.zoomToFit({ padding: 40, maxScale: 1 }),
  },
  {
    key: 'delete',
    title: '删除选中',
    icon: '✕',
    action: () => {
      const cells = graph?.getSelectedCells()
      if (cells?.length) graph?.removeCells(cells)
    },
  },
]

function updateZoom() {
  if (graph) zoomPercent.value = Math.round(graph.zoom() * 100)
}

function togglePorts(node, visibility) {
  const portIds = node.getPorts().map((p) => p.id)
  portIds.forEach((id) => {
    node.setPortProp(id, 'attrs/circle/visibility', visibility)
  })
}

function findContainerAtPoint(point) {
  const nodes = graph.getNodes()
  for (const node of nodes) {
    const data = node.getData()
    if (!data || (data.nodeType !== 'flow' && data.nodeType !== 'subflow')) continue
    const bbox = node.getBBox()
    if (bbox.containsPoint(point)) return node
  }
  return null
}

function fitParentToChildren(parent, compact) {
  const children = graph.getNodes().filter((n) => {
    const p = n.getParent()
    return p && p.id === parent.id && n.isVisible()
  })
  if (children.length === 0) {
    parent.resize(compact.width, compact.height)
    return
  }
  const parentPos = parent.getPosition()
  let maxY = compact.height
  let maxRight = compact.width
  children.forEach((c) => {
    const relativeX = c.getPosition().x - parentPos.x
    const relativeY = c.getPosition().y - parentPos.y
    const right = relativeX + c.getSize().width
    const bottom = relativeY + c.getSize().height
    if (right > maxRight) maxRight = right
    if (bottom > maxY) maxY = bottom
  })
  parent.resize(
    Math.max(compact.width, maxRight + 16),
    Math.max(compact.height, maxY + 16),
  )
}

function resizeAncestors(node) {
  let parent = node.getParent()
  while (parent && parent.isNode && parent.isNode()) {
    const parentData = parent.getData() || {}
    if (parentData.collapsed !== false) break
    const compact = NODE_CONFIG[parentData.nodeType] || NODE_CONFIG['activity-unit']
    fitParentToChildren(parent, compact)
    parent = parent.getParent()
  }
}

function embedChild(parent, child) {
  parent.embed(child)

  const parentData = parent.getData() || {}
  const compact = NODE_CONFIG[parentData.nodeType] || NODE_CONFIG['activity-unit']
  const collapsed = parentData.collapsed !== false

  const parentPos = parent.getPosition()
  child.setPosition({
    x: parentPos.x + INDENT_X,
    y: parentPos.y + compact.height + 4,
  })

  const childData = child.getData() || {}
  child.setData({ ...childData, collapsed: true }, { silent: true })

  if (collapsed) {
    child.hide()
  }

  // Update parent's childCount in data for reactive badge
  const children = graph.getNodes().filter((n) => {
    const p = n.getParent()
    return p && p.id === parent.id
  })
  console.log('[embedChild] parent:', parent.id, 'children:', children.length)
  parent.setData({ ...parentData, childCount: children.length })
  // Force VueShapeView to re-render
  const view = graph.findViewByCell(parent)
  if (view && view.renderVueComponent) {
    view.renderVueComponent()
    console.log('[embedChild] forced re-render')
  }

  parent.resize(compact.width, compact.height)
}

function createPorts() {
  return {
    groups: {
      top: { position: 'top', attrs: { circle: { r: 4, magnet: true, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' } } },
      bottom: { position: 'bottom', attrs: { circle: { r: 4, magnet: true, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' } } },
      left: { position: 'left', attrs: { circle: { r: 4, magnet: true, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' } } },
      right: { position: 'right', attrs: { circle: { r: 4, magnet: true, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' } } },
    },
    items: [
      { id: 'top', group: 'top', attrs: { circle: { visibility: 'hidden' } } },
      { id: 'bottom', group: 'bottom', attrs: { circle: { visibility: 'hidden' } } },
      { id: 'left', group: 'left', attrs: { circle: { visibility: 'hidden' } } },
      { id: 'right', group: 'right', attrs: { circle: { visibility: 'hidden' } } },
    ],
  }
}

function createNode(itemData) {
  const config = NODE_CONFIG[itemData.nodeType] || NODE_CONFIG['activity-unit']
  const isBU = itemData.nodeType === 'activity-unit'
  return graph.addNode({
    id: `${itemData.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    shape: config.shape,
    x: 0,
    y: 0,
    width: config.width,
    height: config.height,
    data: { ...itemData, collapsed: true },
    ports: isBU ? createPorts() : undefined,
  })
}

function buildTree(parent, data) {
  if (data.nodeType === 'flow') {
    const childSubflows = getSubflowsOf(data.id)
    childSubflows.forEach((subData) => {
      const subNode = createNode(subData)
      embedChild(parent, subNode)
      buildTree(subNode, subData)
    })
  } else if (data.nodeType === 'subflow') {
    const childBAs = getBAsOf(data.id)
    childBAs.forEach((baData) => {
      const baNode = createNode(baData)
      embedChild(parent, baNode)
      buildTree(baNode, baData)
    })
  } else if (data.nodeType === 'business-activity') {
    const childBUs = getBUsOf(data.id)
    childBUs.forEach((buData) => {
      const buNode = createNode(buData)
      embedChild(parent, buNode)
    })
  }
}

function onDragOver(event) {
  event.dataTransfer.dropEffect = 'copy'
}

function onDrop(event) {
  const json = event.dataTransfer.getData('application/json')
  if (!json || !graph) return
  const data = JSON.parse(json)
  const config = NODE_CONFIG[data.nodeType] || NODE_CONFIG['activity-unit']
  const point = graph.clientToLocal(event.clientX, event.clientY)
  const container = findContainerAtPoint(point)

  if (data.nodeType === 'flow') {
    const flowNode = createNode(data)
    buildTree(flowNode, data)

    if (container) {
      embedChild(container, flowNode)
    } else {
      flowNode.setPosition({
        x: point.x - config.width / 2,
        y: point.y - config.height / 2,
      }, { deep: true })
      flowNode.setData({ ...data, collapsed: true }, { silent: true })
    }
    return
  }

  if (data.nodeType === 'subflow') {
    const subNode = createNode(data)
    buildTree(subNode, data)

    if (container) {
      embedChild(container, subNode)
    } else {
      subNode.setPosition({
        x: point.x - config.width / 2,
        y: point.y - config.height / 2,
      }, { deep: true })
      subNode.setData({ ...data, collapsed: true }, { silent: true })
    }
    return
  }

  // Business unit
  if (container) {
    const containerData = container.getData() || {}
    const sourceLevel = HIERARCHY_LEVEL[containerData.nodeType] || 1
    const targetLevel = HIERARCHY_LEVEL[data.nodeType] || 1
    if (sourceLevel >= targetLevel) {
      const buNode = createNode(data)
      embedChild(container, buNode)
    }
    return
  }

  // Standalone BU
  graph.addNode({
    id: `${data.id}-${Date.now()}`,
    shape: config.shape,
    x: point.x - config.width / 2,
    y: point.y - config.height / 2,
    width: config.width,
    height: config.height,
    data: { ...data },
    ports: createPorts(),
  })
}

onMounted(() => {
  register({
    shape: 'flow-node',
    component: CanvasNode,
    width: 260,
    height: 90,
  })
  register({
    shape: 'subflow-node',
    component: CanvasNode,
    width: 230,
    height: 80,
  })
  register({
    shape: 'ba-node',
    component: CanvasNode,
    width: 220,
    height: 76,
  })
  register({
    shape: 'bu-node',
    component: CanvasNode,
    width: 200,
    height: 72,
  })

  graph = new Graph({
    container: containerRef.value,
    width: containerRef.value.offsetWidth,
    height: containerRef.value.offsetHeight,
    background: { color: '#f8fafc' },
    grid: {
      size: 10,
      visible: true,
      type: 'dot',
      args: { color: '#e2e8f0', thickness: 1 },
    },
    panning: { enabled: true, eventTypes: ['leftMouseDown', 'mouseWheel'] },
    mousewheel: {
      enabled: true,
      modifiers: ['ctrl', 'meta'],
      factor: 1.1,
    },
    connecting: {
      connector: { name: 'normal' },
      connectionPoint: 'boundary',
      router: { name: 'normal' },
      allowBlank: false,
      snap: { radius: 20 },
      createEdge() {
        return this.createEdge({
          shape: 'edge',
          attrs: {
            line: {
              stroke: '#6366f1',
              strokeWidth: 2,
              targetMarker: {
                name: 'block',
                width: 10,
                height: 8,
                args: { size: 8 },
              },
            },
          },
        })
      },
      validateConnection({ sourceCell, targetCell }) {
        if (!sourceCell || !targetCell) return false
        if (sourceCell.id === targetCell.id) return false
        const sourceType = sourceCell.getData()?.nodeType
        const targetType = targetCell.getData()?.nodeType
        return sourceType === 'activity-unit' && targetType === 'activity-unit'
      },
    },
    highlighting: {
      magnetAvailable: {
        name: 'stroke',
        args: { padding: 4, attrs: { stroke: '#6366f1', strokeWidth: 2, opacity: 0.6 } },
      },
      magnetAdsorbed: {
        name: 'stroke',
        args: { padding: 4, attrs: { stroke: '#6366f1', strokeWidth: 3 } },
      },
    },
    snapline: true,
    keyboard: { enabled: true },
    history: { enabled: true, ignoreAdd: false, ignoreRemove: false, ignoreChange: true },
    selecting: {
      enabled: true,
      rubberband: true,
      showNodeSelectionBox: true,
    },
  })

  graph.on('node:click', ({ node }) => {
    emit('node-select', node)
  })

  graph.on('node:selected', ({ node }) => {
    emit('node-select', node)
  })

  graph.on('node:unselected', () => {
    emit('node-select', null)
  })

  graph.on('blank:click', () => {
    emit('node-select', null)
  })

  graph.on('node:mouseenter', ({ node }) => {
    togglePorts(node, 'visible')
  })

  graph.on('node:mouseleave', ({ node }) => {
    togglePorts(node, 'hidden')
  })

  graph.on('scale', updateZoom)
  graph.on('translate', updateZoom)

  graph._suppressAutoResize = false
  graph.on('node:change:position', ({ cell }) => {
    if (!graph._suppressAutoResize) {
      resizeAncestors(cell)
    }
  })

  // Expose layout for CanvasNode toggle
  graph.layoutDescendants = (node) => {
    const data = node.getData() || {}
    const compact = NODE_CONFIG[data.nodeType] || NODE_CONFIG['activity-unit']
    // Need to call CanvasNode's layoutNode — use custom event
    graph.trigger('custom:layout', { node, compact })
  }

  emit('graph-ready', graph)
})

onUnmounted(() => {
  if (graph) {
    graph.dispose()
    graph = null
  }
})
</script>

<style scoped>
.flow-canvas-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f8fafc;
}

.canvas-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #475569;
  transition: all 0.15s;
  padding: 0;
}

.toolbar-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #1e293b;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e2e8f0;
  margin: 0 6px;
}

.zoom-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  min-width: 36px;
  text-align: center;
}

.canvas-container {
  flex: 1;
  overflow: hidden;
}
</style>
