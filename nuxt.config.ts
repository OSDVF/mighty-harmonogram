import { defineNuxtConfig } from 'nuxt'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
    ssr: false,
    components: [
        '~/components',
        { path: 'node_modules/vue3-timepicker/src', level: 1 },
        { path: 'node_modules/@imengyu/vue3-context-menu', level: 1 }
    ],
    plugins: [
        '~/plugins/contextMenu.client.js'
    ],
    vue: {
        config: {
            devtools: true
        }
    }
})
