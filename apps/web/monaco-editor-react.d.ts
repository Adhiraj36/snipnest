declare module '@monaco-editor/react' {
  import type { ComponentType } from 'react';

  type MonacoEditorProps = {
    height?: string | number;
    width?: string | number;
    theme?: string;
    language?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string | undefined) => void;
    options?: Record<string, unknown>;
  };

  const Editor: ComponentType<MonacoEditorProps>;
  export default Editor;
}
