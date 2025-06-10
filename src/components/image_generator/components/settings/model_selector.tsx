'use client'

import React from 'react'
import type { ModelOption } from '../../types'

interface ModelSelectorProps {
  models: ModelOption[]
  selected_model_id: string
  on_select: (model_id: string) => void
  user_mp: number
}

export function ModelSelector({
  models,
  selected_model_id,
  on_select,
  user_mp
}: ModelSelectorProps) {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text">Model</span>
      </label>
      <select
        value={selected_model_id}
        onChange={(e) => on_select(e.target.value)}
        className="select select-bordered w-full"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} ({model.cost} MP)
            {model.cost > user_mp && ' - Insufficient MP'}
          </option>
        ))}
      </select>
      <label className="label">
        <span className="label-text-alt text-xs">
          Selected model uses {models.find(m => m.id === selected_model_id)?.cost || 0} MP
        </span>
      </label>
    </div>
  )
}