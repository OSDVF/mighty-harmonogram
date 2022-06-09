<template>
  <div>
    <div class="editor">
      <menu-bar
        v-if="editor"
        class="editor__header"
        :editor="editor"
        :title="title"
        @applied="$emit('update:modelValue', editor.getHTML())"
      />
      <editor-content
        @click="focusProseMirror"
        @keyup="keyUp"
        :editor="editor"
        class="editor__content"
      />
    </div>
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
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Link from '@tiptap/extension-link'

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
        TextStyle,
        Color,
        Link.configure({
          autolink: false,
          openOnClick: false,
          linkOnPaste: false,
        })
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
  methods: {
    focusProseMirror(event) {
      event.target?.children[0]?.focus();
    },
    keyUp(evt) {
      evt = evt || window.event;
      var isEscape = false;
      if ("key" in evt) {
        isEscape = (evt.key === "Escape" || evt.key === "Esc");
      } else {
        isEscape = (evt.keyCode === 27);
      }
      if (isEscape) {
        this.$emit('close');
      }
    }
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
  position: fixed;
  top: 10vh;
  left: 5px;
  bottom: 5px;
  right: 5px;
  background: white;
  border: 3px solid rgb(63, 63, 63);
  padding: 10px;
  border-radius: 7px;
  z-index: 10;
}
.editor__content {
  overflow: auto;
  min-height: 100%;
  & > div {
    height: 100%;
  }
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