// src/composables/useAppFacade.ts
import { ref } from 'vue'

export function useAppFacade() {
  const lastActionStatus = ref('')

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      lastActionStatus.value = 'Copié avec succès !'
      setTimeout(() => lastActionStatus.value = '', 3000)
      return true
    } catch (err) {
      lastActionStatus.value = 'Erreur lors de la copie'
      return false
    }
  }

  return {
    copyToClipboard,
    lastActionStatus
  }
}