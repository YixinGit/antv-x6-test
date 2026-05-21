<template>
  <div class="gantt-page">
    <div class="gantt-header">
      <router-link to="/" class="back-link">← 返回首页</router-link>
      <h2>甘特图</h2>
      <div class="header-actions">
        <button
          class="action-btn"
          :class="{ active: showCriticalPath }"
          @click="toggleCriticalPath"
        >
          关键路径
        </button>
        <button
          class="action-btn"
          :class="{ active: showDependency }"
          @click="toggleDependency"
        >
          依赖关系
        </button>
      </div>
    </div>
    <div ref="containerRef" class="gantt-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Gantt } from '@visactor/vtable-gantt'

const containerRef = ref(null)
let ganttInstance = null
const showCriticalPath = ref(false)
const showDependency = ref(false)

const records = [
  {
    id: 'flow-1',
    title: '用户生命周期管理',
    start: '2024-08-01',
    end: '2024-08-15',
    duration: '14天',
    progress: 50,
    isCritical: true,
    children: [
      {
        id: 'sub-1',
        title: '注册认证子流程',
        start: '2024-08-01',
        end: '2024-08-08',
        duration: '7天',
        progress: 75,
        isCritical: false,
        children: [
          {
            id: 'ba-1',
            title: '信息核验',
            start: '2024-08-01',
            end: '2024-08-05',
            duration: '4天',
            progress: 100,
            isCritical: false,
            children: [
              {
                id: 'unit-1',
                title: '用户注册',
                start: '2024-08-01',
                end: '2024-08-03',
                duration: '2天',
                progress: 100,
                isCritical: false,
              },
              {
                id: 'unit-4',
                title: '消息推送',
                start: '2024-08-03',
                end: '2024-08-05',
                duration: '2天',
                progress: 100,
                isCritical: false,
              },
            ],
          },
          {
            id: 'ba-2',
            title: '账户开通',
            start: '2024-08-05',
            end: '2024-08-08',
            duration: '3天',
            progress: 30,
            isCritical: false,
          },
        ],
      },
      {
        id: 'sub-2',
        title: '风控审核子流程',
        start: '2024-08-06',
        end: '2024-08-15',
        duration: '9天',
        progress: 40,
        isCritical: true,
        children: [
          {
            id: 'ba-3',
            title: '风险评估执行',
            start: '2024-08-06',
            end: '2024-08-15',
            duration: '9天',
            progress: 40,
            isCritical: true,
            children: [
              {
                id: 'unit-2',
                title: '风险评估',
                start: '2024-08-06',
                end: '2024-08-08',
                duration: '2天',
                progress: 60,
                isCritical: true,
              },
              {
                id: 'unit-5',
                title: '数据清洗',
                start: '2024-08-08',
                end: '2024-08-10',
                duration: '2天',
                progress: 30,
                isCritical: true,
              },
              {
                id: 'unit-6',
                title: '内容审核',
                start: '2024-08-10',
                end: '2024-08-12',
                duration: '2天',
                progress: 50,
                isCritical: true,
              },
              {
                id: 'unit-8',
                title: '日志归档',
                start: '2024-08-12',
                end: '2024-08-15',
                duration: '3天',
                progress: 20,
                isCritical: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'flow-2',
    title: '订单履约流程',
    start: '2024-08-08',
    end: '2024-08-20',
    duration: '12天',
    progress: 25,
    isCritical: false,
    children: [
      {
        id: 'sub-3',
        title: '支付结算子流程',
        start: '2024-08-08',
        end: '2024-08-20',
        duration: '12天',
        progress: 25,
        isCritical: false,
        children: [
          {
            id: 'ba-4',
            title: '交易处理',
            start: '2024-08-08',
            end: '2024-08-20',
            duration: '12天',
            progress: 25,
            isCritical: false,
            children: [
              {
                id: 'unit-3',
                title: '订单处理',
                start: '2024-08-08',
                end: '2024-08-11',
                duration: '3天',
                progress: 50,
                isCritical: false,
              },
              {
                id: 'unit-7',
                title: '数据统计',
                start: '2024-08-11',
                end: '2024-08-20',
                duration: '9天',
                progress: 10,
                isCritical: false,
              },
            ],
          },
        ],
      },
    ],
  },
]

const columns = [
  {
    field: 'title',
    title: '任务名称',
    width: 'auto',
    sort: true,
    tree: true,
    editor: 'input',
  },
  {
    field: 'start',
    title: '开始时间',
    width: 'auto',
    sort: true,
  },
  {
    field: 'end',
    title: '结束时间',
    width: 'auto',
    sort: true,
  },
  {
    field: 'duration',
    title: '工期',
    width: 60,
  },
]

const dependencyLinksData = [
  {
    type: 'finish_to_start',
    linkedFromTaskKey: 'unit-1',
    linkedToTaskKey: 'unit-4',
  },
  {
    type: 'finish_to_start',
    linkedFromTaskKey: 'ba-1',
    linkedToTaskKey: 'ba-2',
  },
  {
    type: 'finish_to_start',
    linkedFromTaskKey: 'unit-2',
    linkedToTaskKey: 'unit-5',
  },
  {
    type: 'finish_to_start',
    linkedFromTaskKey: 'unit-5',
    linkedToTaskKey: 'unit-6',
  },
  {
    type: 'finish_to_start',
    linkedFromTaskKey: 'unit-6',
    linkedToTaskKey: 'unit-8',
  },
  {
    type: 'finish_to_start',
    linkedFromTaskKey: 'unit-3',
    linkedToTaskKey: 'unit-7',
  },
]

const option = {
  overscrollBehavior: 'none',
  taskKeyField: 'id',
  records,
  taskListTable: {
    columns,
    tableWidth: 300,
    minTableWidth: 150,
    maxTableWidth: 600,
    hierarchyExpandLevel: 3,
    theme: {
      headerStyle: {
        borderColor: '#e1e4e8',
        borderLineWidth: 1,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        bgColor: '#EEF1F5',
      },
      bodyStyle: {
        borderColor: '#e1e4e8',
        borderLineWidth: [1, 0, 1, 0],
        fontSize: 13,
        color: '#4D4D4D',
        bgColor: '#FFF',
      },
    },
  },
  frame: {
    outerFrameStyle: {
      borderLineWidth: 1,
      borderColor: '#e1e4e8',
      cornerRadius: 4,
    },
    verticalSplitLine: {
      lineColor: '#e1e4e8',
      lineWidth: 2,
    },
    verticalSplitLineMoveable: true,
  },
  grid: {
    verticalLine: {
      lineWidth: 1,
      lineColor: '#e1e4e8',
    },
    horizontalLine: {
      lineWidth: 1,
      lineColor: '#e1e4e8',
    },
  },
  headerRowHeight: 40,
  rowHeight: 40,
  taskBar: {
    startDateField: 'start',
    endDateField: 'end',
    progressField: 'progress',
    resizable: true,
    moveable: true,
    labelText: '{title}',
    barStyle(args) {
      if (showCriticalPath.value && args.taskRecord.isCritical) {
        return {
          width: 20,
          barColor: '#ea4335',
          completedBarColor: '#f6b26b',
          cornerRadius: 4,
          borderLineWidth: 2,
          borderColor: '#c62828',
        }
      }
      if (showCriticalPath.value && !args.taskRecord.isCritical) {
        return {
          width: 20,
          barColor: '#d3d7de',
          completedBarColor: '#e8eaed',
          cornerRadius: 4,
          borderLineWidth: 1,
          borderColor: '#bdc1c6',
          opacity: 0.6,
        }
      }
      return {
        width: 20,
        barColor: '#1a73e8',
        completedBarColor: '#34a853',
        cornerRadius: 4,
        borderLineWidth: 1,
        borderColor: '#1557b0',
      }
    },
    hoverBarStyle: {
      barOverlayColor: 'rgba(26, 115, 232, 0.15)',
    },
  },
  timelineHeader: {
    colWidth: 40,
    backgroundColor: '#EEF1F5',
    scales: [
      {
        unit: 'month',
        step: 1,
        format(date) {
          return `${date.dateIndex}月`
        },
        style: {
          fontSize: 14,
          fontWeight: 'bold',
          color: '#333',
          textAlign: 'center',
          textBaseline: 'middle',
          backgroundColor: '#dce1e8',
        },
      },
      {
        unit: 'day',
        step: 1,
        format(date) {
          return date.dateIndex.toString()
        },
        style: {
          fontSize: 12,
          color: '#666',
          textAlign: 'center',
          textBaseline: 'middle',
        },
      },
    ],
  },
  markLine: [
    {
      date: '2024-08-20',
      scrollToMarkLine: true,
      position: 'left',
      style: {
        lineColor: '#ea4335',
        lineWidth: 1,
      },
    },
  ],
  rowSeriesNumber: {
    title: '序号',
    dragOrder: true,
    headerStyle: {
      bgColor: '#EEF1F5',
      borderColor: '#e1e4e8',
    },
    style: {
      borderColor: '#e1e4e8',
    },
  },
}

let resizeObserver = null

function createGantt() {
  if (!containerRef.value) return
  if (ganttInstance) {
    ganttInstance.release?.()
    resizeObserver?.disconnect()
  }
  ganttInstance = new Gantt(containerRef.value, {
    ...option,
    dependencyLinks: showDependency.value ? dependencyLinksData : [],
  })
  resizeObserver = new ResizeObserver(() => {
    ganttInstance?._resize()
  })
  resizeObserver.observe(containerRef.value)
}

function toggleCriticalPath() {
  showCriticalPath.value = !showCriticalPath.value
  createGantt()
}

function toggleDependency() {
  showDependency.value = !showDependency.value
  createGantt()
}

onMounted(() => {
  createGantt()
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (ganttInstance) {
    ganttInstance.release?.()
    ganttInstance = null
  }
})
</script>

<style scoped>
.gantt-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
}

.gantt-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e1e4e8;
  flex-shrink: 0;
}

.gantt-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.back-link {
  color: #1a73e8;
  text-decoration: none;
  font-size: 14px;
}

.back-link:hover {
  text-decoration: underline;
}

.header-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 16px;
  border: 1px solid #d3d7de;
  border-radius: 4px;
  background: #fff;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #1a73e8;
  color: #1a73e8;
}

.action-btn.active {
  background: #1a73e8;
  color: #fff;
  border-color: #1a73e8;
}

.gantt-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: 0;
}
</style>
