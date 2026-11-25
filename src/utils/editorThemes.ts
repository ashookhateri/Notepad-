import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { NppThemeId } from '../types/editor';

export interface ThemeDefinition {
  id: NppThemeId;
  label: string;
  isDark: boolean;
  bg: string;
  fg: string;
  gutterBg: string;
  gutterFg: string;
  gutterBorder: string;
  activeLine: string;
  selection: string;
  caret: string;
}

export const NPP_THEMES: Record<NppThemeId, ThemeDefinition> = {
  Default: {
    id: 'Default',
    label: 'Default (stylers.xml)',
    isDark: false,
    bg: '#FFFFFF',
    fg: '#000000',
    gutterBg: '#F0F0F0',
    gutterFg: '#808080',
    gutterBorder: '#D4D4D4',
    activeLine: '#E8E8FF',
    selection: '#C0C0C0',
    caret: '#000000',
  },
  DarkModeDefault: {
    id: 'DarkModeDefault',
    label: 'DarkModeDefault',
    isDark: true,
    bg: '#1E1E1E',
    fg: '#DCDCDC',
    gutterBg: '#252526',
    gutterFg: '#858585',
    gutterBorder: '#3C3C3C',
    activeLine: '#2A2D2E',
    selection: '#264F78',
    caret: '#AEAFAD',
  },
  Obsidian: {
    id: 'Obsidian',
    label: 'Obsidian',
    isDark: true,
    bg: '#293134',
    fg: '#E0E2E4',
    gutterBg: '#2F393C',
    gutterFg: '#81969A',
    gutterBorder: '#3F4B4E',
    activeLine: '#2F393C',
    selection: '#4E5B61',
    caret: '#D8D8D8',
  },
  Monokai: {
    id: 'Monokai',
    label: 'Monokai',
    isDark: true,
    bg: '#272822',
    fg: '#F8F8F2',
    gutterBg: '#2F302A',
    gutterFg: '#90908A',
    gutterBorder: '#3E3D32',
    activeLine: '#3E3D32',
    selection: '#49483E',
    caret: '#F8F8F0',
  },
  SolarizedLight: {
    id: 'SolarizedLight',
    label: 'Solarized-light',
    isDark: false,
    bg: '#FDF6E3',
    fg: '#657B83',
    gutterBg: '#EEE8D5',
    gutterFg: '#93A1A1',
    gutterBorder: '#DCD5C2',
    activeLine: '#EEE8D5',
    selection: '#D3CCB8',
    caret: '#586E75',
  },
  Zenburn: {
    id: 'Zenburn',
    label: 'Zenburn',
    isDark: true,
    bg: '#3F3F3F',
    fg: '#DCDCCC',
    gutterBg: '#333333',
    gutterFg: '#7F9F7F',
    gutterBorder: '#4F4F4F',
    activeLine: '#4A4A4A',
    selection: '#21322F',
    caret: '#DCDCCC',
  },
  Twilight: {
    id: 'Twilight',
    label: 'Twilight',
    isDark: true,
    bg: '#141414',
    fg: '#F8F8F8',
    gutterBg: '#1D1D1D',
    gutterFg: '#6D6D6D',
    gutterBorder: '#2C2C2C',
    activeLine: '#222222',
    selection: '#38404B',
    caret: '#FFFFFF',
  },
  Cobalt: {
    id: 'Cobalt',
    label: 'Cobalt',
    isDark: true,
    bg: '#002240',
    fg: '#FFFFFF',
    gutterBg: '#001B33',
    gutterFg: '#7D9EC0',
    gutterBorder: '#003566',
    activeLine: '#003B6F',
    selection: '#0050A0',
    caret: '#FFFFFF',
  },
};

export function createNppCodeMirrorTheme(themeId: NppThemeId, fontSizePx: number): Extension {
  const th = NPP_THEMES[themeId] || NPP_THEMES.Default;

  const baseTheme = EditorView.theme(
    {
      '&': {
        backgroundColor: th.bg,
        color: th.fg,
        fontSize: `${fontSizePx}px`,
        height: '100%',
      },
      '.cm-content': {
        caretColor: th.caret,
        padding: '6px 0',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: th.caret,
        borderLeftWidth: '2px',
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: `${th.selection} !important`,
      },
      '.cm-gutters': {
        backgroundColor: th.gutterBg,
        color: th.gutterFg,
        borderRight: `1px solid ${th.gutterBorder}`,
      },
      '.cm-activeLine': {
        backgroundColor: th.activeLine,
      },
      '.cm-activeLineGutter': {
        backgroundColor: th.isDark ? '#333336' : '#E2E4EC',
        color: th.isDark ? '#E0E0E0' : '#000000',
        fontWeight: '600',
      },
      '.cm-matchingBracket': {
        backgroundColor: th.isDark ? 'rgba(86, 156, 214, 0.25)' : '#FFFF80',
        color: '#FF0000 !important',
        fontWeight: 'bold',
        outline: th.isDark ? '1px solid #569CD6' : '1px solid #C0C000',
      },
      '.cm-foldPlaceholder': {
        backgroundColor: th.gutterBg,
        border: `1px solid ${th.gutterBorder}`,
        color: th.gutterFg,
        padding: '0 4px',
        borderRadius: '2px',
      },
    },
    { dark: th.isDark }
  );

  // Scintilla classic syntax colors for Light vs Dark themes
  const highlightStyle = th.isDark
    ? HighlightStyle.define([
        { tag: t.keyword, color: '#569CD6', fontWeight: 'bold' },
        { tag: [t.controlKeyword, t.operatorKeyword], color: '#C586C0', fontWeight: 'bold' },
        { tag: [t.name, t.deleted, t.character, t.macroName], color: '#9CDCFE' },
        { tag: [t.propertyName], color: '#9CDCFE' },
        { tag: [t.function(t.variableName), t.labelName], color: '#DCDCAA' },
        { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#4FC1FF' },
        { tag: [t.definition(t.name), t.separator], color: '#DCDCDC' },
        { tag: [t.typeName, t.className, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: '#4EC9B0' },
        { tag: [t.number, t.integer, t.float], color: '#B5CEA8' },
        { tag: [t.operator, t.punctuation], color: '#D4D4D4' },
        { tag: [t.string, t.special(t.string)], color: '#CE9178' },
        { tag: [t.meta, t.comment], color: '#6A9955', fontStyle: 'italic' },
        { tag: t.strong, fontWeight: 'bold' },
        { tag: t.emphasis, fontStyle: 'italic' },
        { tag: t.tagName, color: '#569CD6' },
        { tag: t.attributeName, color: '#9CDCFE' },
        { tag: t.attributeValue, color: '#CE9178' },
        { tag: t.bool, color: '#569CD6', fontWeight: 'bold' },
        { tag: t.heading, color: '#569CD6', fontWeight: 'bold' },
        { tag: t.invalid, color: '#F44747' },
      ])
    : HighlightStyle.define([
        // Classic Notepad++ stylers.xml palette!
        { tag: t.keyword, color: '#0000FF', fontWeight: 'bold' },
        { tag: [t.controlKeyword, t.operatorKeyword], color: '#0000FF', fontWeight: 'bold' },
        { tag: [t.name, t.deleted, t.character, t.macroName], color: '#000000' },
        { tag: [t.propertyName], color: '#000080' },
        { tag: [t.function(t.variableName), t.labelName], color: '#000080', fontWeight: '600' },
        { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#008080' },
        { tag: [t.typeName, t.className, t.modifier, t.self, t.namespace], color: '#8000FF', fontWeight: 'bold' },
        { tag: [t.number, t.integer, t.float], color: '#FF8000' },
        { tag: [t.operator, t.punctuation], color: '#000080' },
        { tag: [t.string, t.special(t.string)], color: '#808080' },
        { tag: [t.meta, t.comment], color: '#008000', fontStyle: 'italic' },
        { tag: t.strong, fontWeight: 'bold' },
        { tag: t.emphasis, fontStyle: 'italic' },
        { tag: t.tagName, color: '#0000FF', fontWeight: 'bold' },
        { tag: t.attributeName, color: '#FF0000' },
        { tag: t.attributeValue, color: '#8000FF' },
        { tag: t.bool, color: '#0000FF', fontWeight: 'bold' },
        { tag: t.heading, color: '#0000FF', fontWeight: 'bold' },
        { tag: t.invalid, color: '#FF0000', textDecoration: 'underline' },
      ]);

  return [baseTheme, syntaxHighlighting(highlightStyle)];
}
