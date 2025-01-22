import { Editor } from "@monaco-editor/react";
import { useTheme } from "next-themes";


interface EditorProps {
    language: string; 
    code: string;
    onCodeChange: (code: string) => void;
}

const monacoThemeMap = {
    dark: "vs-dark",
    light: "vs-light"
}

const MonacoEditor = ({
    language,
    code,
    onCodeChange,
}: EditorProps) => {
    const { theme } = useTheme();

    return ( <div>
        <Editor
            height="70vh"
            defaultLanguage="cpp"
            language={language}
            theme={theme === "dark" ? monacoThemeMap.dark : monacoThemeMap.light}
            value={code}
            onChange={(value, _) => onCodeChange(value || "")}
            options={{
                readOnly: false,
                fontSize: 16,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                quickSuggestions: true,
                parameterHints: {
                    enabled: true,
                },
                wordBasedSuggestions: "allDocuments",
                automaticLayout: true,
                trimAutoWhitespace: true,
                autoClosingQuotes: 'always',
                autoClosingBrackets: 'always',
                autoClosingOvertype: 'always',
                autoIndent: 'full',
                autoClosingComments: 'always',
                cursorStyle: 'line',
                scrollbar: {
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 8,
                    vertical: 'visible',
                    horizontal: 'visible',
                },
                minimap: {
                    enabled: false
                },
            }}
        />
    </div> );
}
 
export default MonacoEditor;