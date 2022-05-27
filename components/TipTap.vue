<template>
  <div class="editor">
    <menu-bar v-if="editor"
      class="editor__header"
      :editor="editor"
    />
    <editor-content :editor="editor" />
  </div>
</template>

<script>
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

export default {
  components: {
    EditorContent,
  },

  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },

  data() {
    return {
      editor: null,
    }
  },

  watch: {
    modelValue(value) {
      // HTML
      const isSame = this.editor.getHTML() === value

      // JSON
      // const isSame = JSON.stringify(this.editor.getJSON()) === JSON.stringify(value)

      if (isSame) {
        return
      }

      this.editor.commands.setContent(value, false)
    },
  },

  mounted() {
    this.editor = new Editor({
      extensions: [
        StarterKit,
        Placeholder
      ],
      content: this.modelValue,
      onUpdate: () => {
        // HTML
        this.$emit('update:modelValue', this.editor.getHTML())

        // JSON
        // this.$emit('update:modelValue', this.editor.getJSON())
      },
    })
  },

  beforeUnmount() {
    this.editor.destroy()
  },
}
</script>