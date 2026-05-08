import { ref } from 'vue'

export interface AppPopup {
  id: number
  title: string
  message: string
}

const popups = ref<AppPopup[]>([])

export function useAppFacade() {

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showPopup('Succès', 'Texte copié dans le presse-papiers !')
      return true
    } catch (err) {
      showPopup('Erreur', 'Impossible de copier le texte. Veuillez réessayer manuellement.')
      return false
    }
  }

  const closePopup = (id: number) => {
    popups.value = popups.value.filter(p => p.id !== id)
  }

  const showPopup = (title: string, message: string) => {
    const id = Date.now() + Math.random()
    popups.value.push({ id, title, message })

    setTimeout(() => {
      closePopup(id)
    }, 5000)
  }

  return {
    copyToClipboard,
    popups,
    showPopup,
    closePopup
  }
}
