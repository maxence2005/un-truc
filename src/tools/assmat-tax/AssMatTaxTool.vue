<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAppFacade } from '@/composables/useAppFacade'

const { showPopup } = useAppFacade()

const smicRates = {
  '2024_EARLY': 11.65,
  '2024_LATE': 11.88,
  '2025': 11.88,
  '2026': 12.02
}

const selectedPeriod = ref('2026')
const isDisabledChild = ref(false)
const is24hShift = ref(false)
const hoursPerDay = ref(8)
const daysCount = ref(20)

const currentSmic = computed(() => smicRates[selectedPeriod.value as keyof typeof smicRates])

const dailyDeduction = computed(() => {
  const smic = currentSmic.value
  let multiplier = 3
  
  if (isDisabledChild.value) multiplier = 4
  if (is24hShift.value) multiplier = isDisabledChild.value ? 5 : 4

  const baseRate = multiplier * smic
  
  if (hoursPerDay.value < 8 && !is24hShift.value) {
    return (baseRate * hoursPerDay.value) / 8
  }
  
  return baseRate
})

const totalDeduction = computed(() => {
  return dailyDeduction.value * daysCount.value
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}

const handleExplain = () => {
  showPopup(
    "INFO SYSTÈME", 
    "L'abattement forfaitaire est calculé sur la base de 3 SMIC horaires par jour de garde de 8h ou plus. En dessous de 8h, il est proratisé. Les taux utilisés ici sont les taux bruts officiels."
  )
}
</script>

<template>
  <div class="assmat-tool">
    <div class="back-nav">
      <RouterLink to="/" class="btn-back">
        <span class="material-symbols-outlined">arrow_back</span> RETOUR
      </RouterLink>
    </div>
    <div class="window-box tool-window">
      <header class="window-header">
        <span class="window-title">C:\TOOLS\ASSMAT_TAX.EXE</span>
        <div class="window-controls">
          <div class="control-box"></div>
          <div class="control-box"></div>
          <div class="control-box"></div>
        </div>
      </header>
      
      <div class="tool-content">
        <h2 class="glitch-text">Calculateur Abattement</h2>
        
          <div class="form-grid">
            <div class="form-group">
              <label>Période (Taux SMIC)</label>
              <select v-model="selectedPeriod" class="custom-select">
                <option value="2024_EARLY">Jan - Avril 2024 (11.65€)</option>
                <option value="2024_LATE">Mai - Déc 2024 (11.88€)</option>
                <option value="2025">Année 2025 (11.88€)</option>
                <option value="2026">Année 2026 (12.02€)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Nombre de jours</label>
              <input v-model="daysCount" type="number" min="0" max="31" class="custom-input" />
            </div>

            <div class="form-group">
              <label>Heures par jour</label>
              <input v-model="hoursPerDay" type="number" min="1" max="24" class="custom-input" />
            </div>

            <div class="form-group options-group">
              <label class="checkbox-label">
                <input v-model="isDisabledChild" type="checkbox" />
                <span>Enfant handicapé</span>
              </label>
              <label class="checkbox-label">
                <input v-model="is24hShift" type="checkbox" />
                <span>Garde 24h consécutives</span>
              </label>
            </div>
          </div>

        <div class="result-box">
          <div class="result-header">RÉSULTAT DU CALCUL</div>
          <div class="result-main">
            <div class="result-item">
              <span>Abattement journalier :</span>
              <span class="value">{{ formatCurrency(dailyDeduction) }}</span>
            </div>
            <div class="result-item total">
              <span>TOTAL DÉDUCTIBLE :</span>
              <span class="value glitch-text-permanent">{{ formatCurrency(totalDeduction) }}</span>
            </div>
          </div>
          <div class="result-footer">
            <button class="btn-info" @click="handleExplain">COMPRENDRE LE CALCUL</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables" as *;
@use "@/assets/styles/mixins" as *;

.assmat-tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 20px;
}

.back-nav {
  width: 100%;
  max-width: 600px;
  display: flex;
}

.btn-back {
  border: $border-width solid $black;
  padding: 8px 16px;
  background-color: $white;
  font-weight: bold;
  font-size: 0.875rem;
  box-shadow: 3px 3px 0px 0px $black;
  display: flex;
  align-items: center;
  gap: 8px;
  @include inset-shadow-active;

  &:hover {
    background-color: $black;
    color: $white;
    @include glitch-effect;
  }
}

.tool-window {
  @include window-box;
  width: 100%;
  max-width: 600px;
}

.window-header {
  background-color: $header-blue;
  border-bottom: $border-width solid $black;
  padding: 4px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.window-title {
  color: $white;
  font-size: 0.875rem;
  font-weight: bold;
}

.window-controls {
  display: flex;
  gap: 4px;
}

.control-box {
  width: 12px;
  height: 12px;
  border: 1px solid $black;
  background-color: $surface-pc-beige;
}

.tool-content {
  padding: 24px;

  h2 {
    font-size: 1.5rem;
    margin-bottom: 24px;
    text-transform: uppercase;
    text-align: center;
    @include glitch-effect;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 32px;

  @media (min-width: 480px) {
    grid-template-columns: 1fr 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-weight: bold;
    font-size: 0.875rem;
    text-transform: uppercase;
  }

  &.options-group {
    grid-column: 1 / -1;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 24px;
    padding: 12px;
    background-color: rgba(0,0,0,0.05);
    border: 1px dashed $black;
  }
}

.custom-input, .custom-select {
  padding: 8px 12px;
  border: $border-width solid $black;
  background-color: $white;
  font-family: inherit;
  font-size: 1rem;
  box-shadow: 3px 3px 0px 0px $black;
  outline: none;

  &:focus {
    background-color: $workspace-off-white;
    transform: translate(-1px, -1px);
    box-shadow: 4px 4px 0px 0px $black;
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.875rem;

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: $header-blue;
  }
}

.result-box {
  background-color: $black;
  color: $white;
  padding: 20px;
  border: $border-width solid $black;
  box-shadow: 6px 6px 0px 0px rgba(0,0,0,0.2);

  .result-header {
    font-size: 0.75rem;
    letter-spacing: 2px;
    margin-bottom: 16px;
    border-bottom: 1px solid #444;
    padding-bottom: 8px;
  }

  .result-main {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .result-item {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .value {
      font-weight: bold;
      font-size: 1.25rem;
    }

    &.total {
      margin-top: 8px;
      padding-top: 16px;
      border-top: 2px solid $white;
      
      span:first-child {
        font-size: 1.125rem;
        font-weight: 900;
      }

      .value {
        font-size: 1.75rem;
        color: $glitch-cyan;
      }
    }
  }

  .result-footer {
    margin-top: 24px;
    display: flex;
    justify-content: center;
  }
}

.btn-info {
  background-color: transparent;
  border: 1px solid $white;
  color: $white;
  padding: 4px 12px;
  font-size: 0.75rem;
  cursor: pointer;

  &:hover {
    background-color: $white;
    color: $black;
  }
}
</style>
