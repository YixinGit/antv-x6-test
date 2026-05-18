<template>
  <div class="flow-assembly">
    <BusinessUnitList :flows="flows" :subflows="subflows" :units="units" />
    <FlowCanvas
      @node-select="onNodeSelect"
      @graph-ready="onGraphReady"
    />
    <DetailPanel
      :selected-node="selectedNode"
      :graph="graph"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BusinessUnitList from '../components/BusinessUnitList.vue'
import FlowCanvas from '../components/FlowCanvas.vue'
import DetailPanel from '../components/DetailPanel.vue'
import { flows, subflows, businessUnits } from '../data/businessUnits.js'

const units = businessUnits
const selectedNode = ref(null)
const graph = ref(null)

function onNodeSelect(node) {
  selectedNode.value = node
}

function onGraphReady(instance) {
  graph.value = instance
}
</script>

<style scoped>
.flow-assembly {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
</style>
