<template>
  <div class="editor">
    <menu-bar
      v-if="editor"
      class="editor__header"
      :editor="editor"
      :title="title"
    />
    <editor-content :editor="editor" />
    <div
      @click="$emit('close')"
      class="editor__close"
    >
      ✔️
    </div>
  </div>
</template>

<script>
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

export default {
  components: {
    EditorContent,
  },

  props: {
    modelValue: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: ''
    }
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
        Placeholder.configure({
          placeholder: 'Napište něco...'
        }),
        Highlight,
        TaskList,
        TaskItem.configure({
          nested: false,
        }),
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

<style lang="scss">
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
.editor {
  position: absolute;
  top: 10%;
  left: 5px;
  bottom: 5px;
  right: 5px;
  background: white;
  border: 3px solid rgb(63, 63, 63);
  padding: 10px;
  border-radius: 7px;
  z-index: 10;
}
.editor__close {
  position: absolute;
  right: 5px;
  top: 5px;
  cursor: pointer;
  background: #00000011;
  border-radius: 2px;
  font-size: 20px;
  padding: 5px;
}
ul[data-type="taskList"] {
  list-style: none;
  padding: 0;

  p {
    margin: 0;
  }

  li {
    display: flex;

    > label {
      flex: 0 0 auto;
      margin-right: 0.5rem;
      user-select: none;
    }

    > div {
      flex: 1 1 auto;
    }
  }
}
</style>