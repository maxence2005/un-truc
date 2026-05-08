import type { Component } from 'vue'

export interface ToolConfig {
    id: string
    name: string
    description: string
    icon: string
    component: () => Promise<{ default: Component }>
}