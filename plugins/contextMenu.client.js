import ContextMenu from 'v-contextmenu';
import "v-contextmenu/dist/themes/default.css";

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(ContextMenu)
  })