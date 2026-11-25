import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { Compartment, EditorSelection, EditorState, RangeSetBuilder, StateEffect, StateField } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
  drawSelection,
  gutter,
  GutterMarker,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightWhitespace,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab, redo, undo } from '@codemirror/commands';
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  indentUnit,
} from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { EditorDocument, MacroAction, NppPreferences, SearchOptions } from '../types/editor';
import { compileSearchRegex, getCodeMirrorLanguageExtension, getLanguageMeta } from '../utils/languageUtils';
import { createNppCodeMirrorTheme } from '../utils/editorThemes';

export interface CodeEditorHandle {
  focus: () => void;
  undo: () => void;
  redo: () => void;
  cut: () => void;
  copy: () => void;
  paste: () => void;
  selectAll: () => void;
  goToLine: (line: number, col?: number) => void;
  goToOffset: (offset: number) => void;
  findNext: (options: SearchOptions, backwards?: boolean) => boolean;
  replaceCurrent: (options: SearchOptions) => boolean;
  replaceAll: (options: SearchOptions) => number;
  insertText: (text: string) => void;
  duplicateLine: () => void;
  moveLineUp: () => void;
  moveLineDown: () => void;
  toggleComment: () => void;
  transformSelectionOrDoc: (fn: (text: string) => string, wholeDocIfEmpty?: boolean) => void;
  nextBookmark: () => void;
  prevBookmark: () => void;
  scrollToRatio: (ratio: number) => void;
  getScrollRatio: () => { top: number; visible: number };
  getSelectionText: () => string;
  goToMatchingBrace: () => void;
}

interface CodeEditorPaneProps {
  doc: EditorDocument;
  preferences: NppPreferences;
  isOverwriteMode: boolean;
  isActivePane: boolean;
  isRecordingMacro: boolean;
  onFocusPane: () => void;
  onContentChange: (docId: string, content: string) => void;
  onCursorChange: (
    docId: string,
    line: number,
    col: number,
    pos: number,
    selLen: number,
    selLines: number
  ) => void;
  onToggleBookmark: (docId: string, line: number) => void;
  onScrollChange?: (docId: string, topRatio: number, visibleRatio: number) => void;
  onRecordMacroAction?: (action: MacroAction) => void;
}

class BookmarkMarker extends GutterMarker {
  toDOM() {
    const span = document.createElement('span');
    span.className = 'npp-bookmark-dot';
    span.title = 'Bookmark (click to toggle)';
    return span;
  }
}

const bookmarkMarkerInstance = new BookmarkMarker();

class EolWidget extends WidgetType {
  constructor(readonly eolLabel: string) {
    super();
  }
  eq(other: EolWidget) {
    return other.eolLabel === this.eolLabel;
  }
  toDOM() {
    const span = document.createElement('span');
    span.className = 'npp-eol-badge';
    span.textContent = this.eolLabel;
    return span;
  }
}

const setBookmarksEffect = StateEffect.define<number[]>();
const setMarksEffect = StateEffect.define<{ terms: string[]; matchCase: boolean }>();

export const CodeEditorPane = React.forwardRef<CodeEditorHandle, CodeEditorPaneProps>(
  (
    {
      doc,
      preferences,
      isOverwriteMode,
      isActivePane,
      isRecordingMacro,
      onFocusPane,
      onContentChange,
      onCursorChange,
      onToggleBookmark,
      onScrollChange,
      onRecordMacroAction,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    // Keep latest callbacks in refs to avoid recreating CodeMirror instance
    const callbacksRef = useRef({
      onFocusPane,
      onContentChange,
      onCursorChange,
      onToggleBookmark,
      onScrollChange,
      onRecordMacroAction,
    });
    callbacksRef.current = {
      onFocusPane,
      onContentChange,
      onCursorChange,
      onToggleBookmark,
      onScrollChange,
      onRecordMacroAction,
    };

    const docRef = useRef(doc);
    docRef.current = doc;
    const isOverwriteRef = useRef(isOverwriteMode);
    isOverwriteRef.current = isOverwriteMode;
    const isRecordingRef = useRef(isRecordingMacro);
    isRecordingRef.current = isRecordingMacro;

    // Compartments for live reconfiguration
    const compartments = useRef({
      theme: new Compartment(),
      language: new Compartment(),
      wrap: new Compartment(),
      whitespace: new Compartment(),
      eol: new Compartment(),
      lineNumbers: new Compartment(),
      readOnly: new Compartment(),
      tabSize: new Compartment(),
      closeBrackets: new Compartment(),
      activeLine: new Compartment(),
    }).current;

    const createEolExtension = (showEol: boolean, eolType: string) => {
      if (!showEol) return [];
      const label = eolType === 'CRLF' ? 'CRLF' : eolType === 'CR' ? 'CR' : 'LF';
      return ViewPlugin.fromClass(
        class {
          decorations: DecorationSet;
          constructor(view: EditorView) {
            this.decorations = this.build(view);
          }
          update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
              this.decorations = this.build(update.view);
            }
          }
          build(view: EditorView) {
            const builder = new RangeSetBuilder<Decoration>();
            for (const { from, to } of view.visibleRanges) {
              let pos = from;
              while (pos <= to) {
                const line = view.state.doc.lineAt(pos);
                if (line.to < view.state.doc.length) {
                  builder.add(
                    line.to,
                    line.to,
                    Decoration.widget({
                      widget: new EolWidget(label),
                      side: 1,
                    })
                  );
                }
                pos = line.to + 1;
              }
            }
            return builder.finish();
          }
        },
        { decorations: (v) => v.decorations }
      );
    };

    // Initialize EditorView once per doc.id
    useEffect(() => {
      if (!containerRef.current) return;

      const bookmarkField = StateField.define<number[]>({
        create: () => doc.bookmarks || [],
        update(value, tr) {
          for (const e of tr.effects) {
            if (e.is(setBookmarksEffect)) return e.value;
          }
          return value;
        },
      });

      const marksField = StateField.define<DecorationSet>({
        create: () => Decoration.none,
        update(deco, tr) {
          for (const e of tr.effects) {
            if (e.is(setMarksEffect)) {
              const { terms, matchCase } = e.value;
              if (!terms.length) return Decoration.none;
              const builder = new RangeSetBuilder<Decoration>();
              const text = tr.state.doc.toString();
              const ranges: { from: number; to: number }[] = [];
              for (const term of terms) {
                if (!term) continue;
                const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const re = new RegExp(esc, matchCase ? 'g' : 'gi');
                let m: RegExpExecArray | null;
                while ((m = re.exec(text)) !== null) {
                  if (m[0].length === 0) {
                    re.lastIndex++;
                    continue;
                  }
                  ranges.push({ from: m.index, to: m.index + m[0].length });
                  if (ranges.length > 3000) break;
                }
              }
              ranges.sort((a, b) => a.from - b.from || a.to - b.to);
              for (const r of ranges) {
                builder.add(r.from, r.to, Decoration.mark({ class: 'npp-mark-highlight' }));
              }
              return builder.finish();
            }
          }
          if (tr.docChanged) {
            return deco.map(tr.changes);
          }
          return deco;
        },
        provide: (f) => EditorView.decorations.from(f),
      });

      const bookmarkGutter = gutter({
        class: 'cm-npp-bookmark-gutter w-4 cursor-pointer',
        markers: (view) => {
          const bms = view.state.field(bookmarkField);
          const builder = new RangeSetBuilder<GutterMarker>();
          const sorted = [...bms].sort((a, b) => a - b);
          for (const lineNum of sorted) {
            if (lineNum >= 1 && lineNum <= view.state.doc.lines) {
              const line = view.state.doc.line(lineNum);
              builder.add(line.from, line.from, bookmarkMarkerInstance);
            }
          }
          return builder.finish();
        },
        domEventHandlers: {
          mousedown(view, line) {
            const lineNum = view.state.doc.lineAt(line.from).number;
            callbacksRef.current.onToggleBookmark(docRef.current.id, lineNum);
            return true;
          },
        },
      });

      const effectiveFontSize = Math.max(8, Math.min(36, preferences.fontSize + preferences.zoomLevel * 2));

      const overwriteInputHandler = EditorView.inputHandler.of((view, from, to, text) => {
        if (isRecordingRef.current && text) {
          callbacksRef.current.onRecordMacroAction?.({ type: 'insert', text });
        }
        if (isOverwriteRef.current && from === to && text.length === 1 && text !== '\n') {
          const line = view.state.doc.lineAt(from);
          if (from < line.to) {
            view.dispatch({
              changes: { from, to: from + 1, insert: text },
              selection: { anchor: from + 1 },
            });
            return true;
          }
        }
        return false;
      });

      const updateListener = EditorView.updateListener.of((update) => {
        if (update.focusChanged && update.view.hasFocus) {
          callbacksRef.current.onFocusPane();
        }
        if (update.docChanged) {
          const newVal = update.state.doc.toString();
          callbacksRef.current.onContentChange(docRef.current.id, newVal);
        }
        if (update.selectionSet || update.docChanged) {
          const sel = update.state.selection.main;
          const lineObj = update.state.doc.lineAt(sel.head);
          const line = lineObj.number;
          const col = sel.head - lineObj.from + 1;
          const pos = sel.head;
          const selLen = Math.abs(sel.to - sel.from);
          let selLines = 0;
          if (selLen > 0) {
            const startLine = update.state.doc.lineAt(sel.from).number;
            const endLine = update.state.doc.lineAt(sel.to).number;
            selLines = endLine - startLine + 1;
          }
          callbacksRef.current.onCursorChange(docRef.current.id, line, col, pos, selLen, selLines);
        }
      });

      const state = EditorState.create({
        doc: doc.content,
        extensions: [
          bookmarkField,
          marksField,
          bookmarkGutter,
          compartments.lineNumbers.of(preferences.showLineNumbers ? lineNumbers() : []),
          foldGutter({
            openText: '▾',
            closedText: '▸',
          }),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          compartments.closeBrackets.of(preferences.autoCloseBrackets ? closeBrackets() : []),
          compartments.activeLine.of(
            preferences.highlightCurrentLine ? [highlightActiveLine(), highlightActiveLineGutter()] : []
          ),
          compartments.wrap.of(preferences.wordWrap ? EditorView.lineWrapping : []),
          compartments.whitespace.of(preferences.showWhitespace ? highlightWhitespace() : []),
          compartments.eol.of(createEolExtension(preferences.showEol, doc.eol)),
          compartments.tabSize.of([
            EditorState.tabSize.of(preferences.tabSize),
            indentUnit.of(preferences.indentWithSpaces ? ' '.repeat(preferences.tabSize) : '\t'),
          ]),
          compartments.readOnly.of(EditorState.readOnly.of(doc.isReadOnly)),
          compartments.language.of(getCodeMirrorLanguageExtension(doc.language)),
          compartments.theme.of(createNppCodeMirrorTheme(preferences.themeId, effectiveFontSize)),
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...foldKeymap, indentWithTab]),
          overwriteInputHandler,
          updateListener,
        ],
      });

      const view = new EditorView({
        state,
        parent: containerRef.current,
      });

      const scroller = view.scrollDOM;
      const handleScroll = () => {
        const maxScroll = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
        const topRatio = scroller.scrollTop / maxScroll;
        const visibleRatio = Math.min(1, scroller.clientHeight / Math.max(1, scroller.scrollHeight));
        callbacksRef.current.onScrollChange?.(docRef.current.id, topRatio, visibleRatio);
      };
      scroller.addEventListener('scroll', handleScroll, { passive: true });

      viewRef.current = view;

      // Restore cursor position safely
      if (doc.cursorPos > 0 && doc.cursorPos <= state.doc.length) {
        view.dispatch({
          selection: { anchor: doc.cursorPos },
          scrollIntoView: true,
        });
      }

      return () => {
        scroller.removeEventListener('scroll', handleScroll);
        view.destroy();
        viewRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doc.id]);

    // Sync external content updates (e.g. from Find in Files replace or Reload)
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      const currentText = view.state.doc.toString();
      if (currentText !== doc.content) {
        const prevPos = Math.min(view.state.selection.main.head, doc.content.length);
        view.dispatch({
          changes: { from: 0, to: currentText.length, insert: doc.content },
          selection: { anchor: prevPos },
        });
      }
    }, [doc.content]);

    // Sync bookmarks and marks
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: [
          setBookmarksEffect.of(doc.bookmarks || []),
          setMarksEffect.of({ terms: doc.marks || [], matchCase: false }),
        ],
      });
    }, [doc.bookmarks, doc.marks]);

    // Reconfigure compartments when preferences or doc metadata change
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      const effectiveFontSize = Math.max(8, Math.min(36, preferences.fontSize + preferences.zoomLevel * 2));
      view.dispatch({
        effects: [
          compartments.theme.reconfigure(createNppCodeMirrorTheme(preferences.themeId, effectiveFontSize)),
          compartments.language.reconfigure(getCodeMirrorLanguageExtension(doc.language)),
          compartments.wrap.reconfigure(preferences.wordWrap ? EditorView.lineWrapping : []),
          compartments.whitespace.reconfigure(preferences.showWhitespace ? highlightWhitespace() : []),
          compartments.eol.reconfigure(createEolExtension(preferences.showEol, doc.eol)),
          compartments.lineNumbers.reconfigure(preferences.showLineNumbers ? lineNumbers() : []),
          compartments.readOnly.reconfigure(EditorState.readOnly.of(doc.isReadOnly)),
          compartments.closeBrackets.reconfigure(preferences.autoCloseBrackets ? closeBrackets() : []),
          compartments.activeLine.reconfigure(
            preferences.highlightCurrentLine ? [highlightActiveLine(), highlightActiveLineGutter()] : []
          ),
          compartments.tabSize.reconfigure([
            EditorState.tabSize.of(preferences.tabSize),
            indentUnit.of(preferences.indentWithSpaces ? ' '.repeat(preferences.tabSize) : '\t'),
          ]),
        ],
      });
    }, [
      preferences.themeId,
      preferences.fontSize,
      preferences.zoomLevel,
      preferences.wordWrap,
      preferences.showWhitespace,
      preferences.showEol,
      preferences.showLineNumbers,
      preferences.autoCloseBrackets,
      preferences.highlightCurrentLine,
      preferences.tabSize,
      preferences.indentWithSpaces,
      doc.language,
      doc.isReadOnly,
      doc.eol,
      compartments,
    ]);

    useImperativeHandle(ref, () => ({
      focus: () => viewRef.current?.focus(),
      undo: () => {
        if (viewRef.current) undo(viewRef.current);
      },
      redo: () => {
        if (viewRef.current) redo(viewRef.current);
      },
      cut: async () => {
        const view = viewRef.current;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        if (from === to) return;
        const text = view.state.sliceDoc(from, to);
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // ignore
        }
        if (!docRef.current.isReadOnly) {
          view.dispatch({ changes: { from, to, insert: '' } });
        }
      },
      copy: async () => {
        const view = viewRef.current;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        const text =
          from === to
            ? view.state.doc.lineAt(from).text
            : view.state.sliceDoc(from, to);
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // ignore
        }
      },
      paste: async () => {
        const view = viewRef.current;
        if (!view || docRef.current.isReadOnly) return;
        try {
          const text = await navigator.clipboard.readText();
          const { from, to } = view.state.selection.main;
          view.dispatch({
            changes: { from, to, insert: text },
            selection: { anchor: from + text.length },
          });
        } catch {
          // Clipboard read requires browser permission; focus so user can paste natively
          view.focus();
        }
      },
      selectAll: () => {
        const view = viewRef.current;
        if (!view) return;
        view.dispatch({
          selection: { anchor: 0, head: view.state.doc.length },
        });
        view.focus();
      },
      goToLine: (line: number, col = 1) => {
        const view = viewRef.current;
        if (!view) return;
        const clampedLine = Math.max(1, Math.min(line, view.state.doc.lines));
        const lineInfo = view.state.doc.line(clampedLine);
        const clampedCol = Math.max(0, Math.min(col - 1, lineInfo.length));
        const pos = lineInfo.from + clampedCol;
        view.dispatch({
          selection: { anchor: pos },
          scrollIntoView: true,
        });
        view.focus();
      },
      goToOffset: (offset: number) => {
        const view = viewRef.current;
        if (!view) return;
        const pos = Math.max(0, Math.min(offset, view.state.doc.length));
        view.dispatch({
          selection: { anchor: pos },
          scrollIntoView: true,
        });
        view.focus();
      },
      findNext: (options: SearchOptions, backwards = false) => {
        const view = viewRef.current;
        if (!view) return false;
        const regex = compileSearchRegex(options);
        if (!regex) return false;

        const text = view.state.doc.toString();
        const sel = view.state.selection.main;
        const matches: { from: number; to: number }[] = [];
        let m: RegExpExecArray | null;
        regex.lastIndex = 0;
        while ((m = regex.exec(text)) !== null) {
          if (m[0].length === 0) {
            regex.lastIndex++;
            continue;
          }
          matches.push({ from: m.index, to: m.index + m[0].length });
          if (matches.length >= 10000) break;
        }
        if (matches.length === 0) return false;

        let target: { from: number; to: number } | undefined;
        if (!backwards) {
          target = matches.find((mt) => mt.from >= sel.to);
          if (!target && options.wrapAround) target = matches[0];
        } else {
          for (let i = matches.length - 1; i >= 0; i--) {
            if (matches[i].to <= sel.from) {
              target = matches[i];
              break;
            }
          }
          if (!target && options.wrapAround) target = matches[matches.length - 1];
        }

        if (!target) return false;
        view.dispatch({
          selection: EditorSelection.range(target.from, target.to),
          scrollIntoView: true,
        });
        view.focus();
        return true;
      },
      replaceCurrent: (options: SearchOptions) => {
        const view = viewRef.current;
        if (!view || docRef.current.isReadOnly) return false;
        const regex = compileSearchRegex(options);
        if (!regex) return false;

        const sel = view.state.selection.main;
        const selected = view.state.sliceDoc(sel.from, sel.to);
        regex.lastIndex = 0;
        const m = regex.exec(selected);
        if (m && m[0].length === selected.length) {
          const replacement =
            options.mode === 'extended'
              ? options.replaceWith
                  .replace(/\\n/g, '\n')
                  .replace(/\\r/g, '\r')
                  .replace(/\\t/g, '\t')
              : options.replaceWith;
          view.dispatch({
            changes: { from: sel.from, to: sel.to, insert: replacement },
            selection: { anchor: sel.from + replacement.length },
          });
        }
        // Advance to next match
        const nextText = view.state.doc.toString();
        const curPos = view.state.selection.main.to;
        regex.lastIndex = curPos;
        let nextMatch = regex.exec(nextText);
        if (!nextMatch && options.wrapAround) {
          regex.lastIndex = 0;
          nextMatch = regex.exec(nextText);
        }
        if (nextMatch) {
          view.dispatch({
            selection: EditorSelection.range(nextMatch.index, nextMatch.index + nextMatch[0].length),
            scrollIntoView: true,
          });
          return true;
        }
        return false;
      },
      replaceAll: (options: SearchOptions) => {
        const view = viewRef.current;
        if (!view || docRef.current.isReadOnly) return 0;
        const regex = compileSearchRegex(options);
        if (!regex) return 0;

        const replacement =
          options.mode === 'extended'
            ? options.replaceWith
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t')
            : options.replaceWith;

        const sel = view.state.selection.main;
        const useSelection = options.inSelection && sel.from !== sel.to;
        const from = useSelection ? sel.from : 0;
        const to = useSelection ? sel.to : view.state.doc.length;
        const slice = view.state.sliceDoc(from, to);

        let count = 0;
        const newSlice = slice.replace(regex, (...args) => {
          count++;
          if (options.mode === 'regex') {
            return replacement.replace(/\$(\d+)/g, (_, idx) => args[Number(idx)] ?? '');
          }
          return replacement;
        });

        if (count > 0) {
          view.dispatch({
            changes: { from, to, insert: newSlice },
          });
        }
        return count;
      },
      insertText: (text: string) => {
        const view = viewRef.current;
        if (!view || docRef.current.isReadOnly) return;
        const { from, to } = view.state.selection.main;
        view.dispatch({
          changes: { from, to, insert: text },
          selection: { anchor: from + text.length },
        });
        view.focus();
      },
      duplicateLine: () => {
        const view = viewRef.current;
        if (!view || docRef.current.isReadOnly) return;
        const sel = view.state.selection.main;
        if (sel.from !== sel.to) {
          const text = view.state.sliceDoc(sel.from, sel.to);
          view.dispatch({
            changes: { from: sel.to, to: sel.to, insert: text },
            selection: EditorSelection.range(sel.to, sel.to + text.length),
          });
        } else {
          const line = view.state.doc.lineAt(sel.head);
          view.dispatch({
            changes: { from: line.to, to: line.to, insert: '\n' + line.text },
          });
        }
      },
      moveLineUp: () => {
        const view = viewRef.current;
        if (!view || docRef.current.isReadOnly) return;
        const line = view.state.doc.lineAt(view.state.selection.main.head);
        if (line.number <= 1) return;
        const prevLine = view.state.doc.line(line.number - 1);
        const col = view.state.selection.main.head - line.from;
        view.dispatch({
          changes: { from: prevLine.from, to: line.to, insert: line.text + '\n' + prevLine.text },
          selection: { anchor: prevLine.from + Math.min(col, line.text.length) },
        });
      },
      moveLineDown: () => {
        const view = viewRef.current;
        if (!view || docRef.current.isReadOnly) return;
        const line = view.state.doc.lineAt(view.state.selection.main.head);
        if (line.number >= view.state.doc.lines) return;
        const nextLine = view.state.doc.line(line.number + 1);
        const col = view.state.selection.main.head - line.from;
        view.dispatch({
          changes: { from: line.from, to: nextLine.to, insert: nextLine.text + '\n' + line.text },
          selection: { anchor: line.from + nextLine.text.length + 1 + Math.min(col, line.text.length) },
        });
      },
      toggleComment: () => {
        const view = viewRef.current;
        if (!view || docRef.current.isReadOnly) return;
        const meta = getLanguageMeta(docRef.current.language);
        const prefix = meta.lineComment || '//';
        const sel = view.state.selection.main;
        const startLine = view.state.doc.lineAt(sel.from).number;
        const endLine = view.state.doc.lineAt(sel.to).number;
        const changes: { from: number; to: number; insert: string }[] = [];

        let allCommented = true;
        for (let l = startLine; l <= endLine; l++) {
          const lineText = view.state.doc.line(l).text.trimStart();
          if (!lineText.startsWith(prefix)) {
            allCommented = false;
            break;
          }
        }

        for (let l = startLine; l <= endLine; l++) {
          const lineObj = view.state.doc.line(l);
          if (allCommented) {
            const idx = lineObj.text.indexOf(prefix);
            if (idx !== -1) {
              const extraSpace = lineObj.text[idx + prefix.length] === ' ' ? 1 : 0;
              changes.push({
                from: lineObj.from + idx,
                to: lineObj.from + idx + prefix.length + extraSpace,
                insert: '',
              });
            }
          } else {
            changes.push({
              from: lineObj.from,
              to: lineObj.from,
              insert: prefix + ' ',
            });
          }
        }
        view.dispatch({ changes });
      },
      transformSelectionOrDoc: (fn: (text: string) => string, wholeDocIfEmpty = true) => {
        const view = viewRef.current;
        if (!view || docRef.current.isReadOnly) return;
        const sel = view.state.selection.main;
        if (sel.from !== sel.to) {
          const slice = view.state.sliceDoc(sel.from, sel.to);
          const replaced = fn(slice);
          view.dispatch({
            changes: { from: sel.from, to: sel.to, insert: replaced },
            selection: EditorSelection.range(sel.from, sel.from + replaced.length),
          });
        } else if (wholeDocIfEmpty) {
          const full = view.state.doc.toString();
          const replaced = fn(full);
          view.dispatch({
            changes: { from: 0, to: full.length, insert: replaced },
          });
        }
      },
      nextBookmark: () => {
        const view = viewRef.current;
        const bms = [...(docRef.current.bookmarks || [])].sort((a, b) => a - b);
        if (!view || bms.length === 0) return;
        const curLine = view.state.doc.lineAt(view.state.selection.main.head).number;
        const target = bms.find((b) => b > curLine) ?? bms[0];
        const lineInfo = view.state.doc.line(Math.min(target, view.state.doc.lines));
        view.dispatch({ selection: { anchor: lineInfo.from }, scrollIntoView: true });
      },
      prevBookmark: () => {
        const view = viewRef.current;
        const bms = [...(docRef.current.bookmarks || [])].sort((a, b) => a - b);
        if (!view || bms.length === 0) return;
        const curLine = view.state.doc.lineAt(view.state.selection.main.head).number;
        let target = bms[bms.length - 1];
        for (let i = bms.length - 1; i >= 0; i--) {
          if (bms[i] < curLine) {
            target = bms[i];
            break;
          }
        }
        const lineInfo = view.state.doc.line(Math.min(target, view.state.doc.lines));
        view.dispatch({ selection: { anchor: lineInfo.from }, scrollIntoView: true });
      },
      scrollToRatio: (ratio: number) => {
        const view = viewRef.current;
        if (!view) return;
        const scroller = view.scrollDOM;
        const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        scroller.scrollTop = Math.max(0, Math.min(1, ratio)) * maxScroll;
      },
      getScrollRatio: () => {
        const view = viewRef.current;
        if (!view) return { top: 0, visible: 1 };
        const scroller = view.scrollDOM;
        const maxScroll = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
        return {
          top: scroller.scrollTop / maxScroll,
          visible: Math.min(1, scroller.clientHeight / Math.max(1, scroller.scrollHeight)),
        };
      },
      getSelectionText: () => {
        const view = viewRef.current;
        if (!view) return '';
        const { from, to } = view.state.selection.main;
        return from === to ? '' : view.state.sliceDoc(from, to);
      },
      goToMatchingBrace: () => {
        const view = viewRef.current;
        if (!view) return;
        const pos = view.state.selection.main.head;
        const text = view.state.doc.toString();
        const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}', ')': '(', ']': '[', '}': '{' };
        const openChars = new Set(['(', '[', '{']);
        let ch = text[pos];
        let start = pos;
        if (!pairs[ch] && pos > 0 && pairs[text[pos - 1]]) {
          ch = text[pos - 1];
          start = pos - 1;
        }
        if (!pairs[ch]) return;
        const targetChar = pairs[ch];
        const forward = openChars.has(ch);
        let depth = 0;
        if (forward) {
          for (let i = start; i < text.length; i++) {
            if (text[i] === ch) depth++;
            else if (text[i] === targetChar) {
              depth--;
              if (depth === 0) {
                view.dispatch({ selection: { anchor: i }, scrollIntoView: true });
                return;
              }
            }
          }
        } else {
          for (let i = start; i >= 0; i--) {
            if (text[i] === ch) depth++;
            else if (text[i] === targetChar) {
              depth--;
              if (depth === 0) {
                view.dispatch({ selection: { anchor: i }, scrollIntoView: true });
                return;
              }
            }
          }
        }
      },
    }));

    return (
      <div
        ref={containerRef}
        onMouseDown={onFocusPane}
        onTouchStart={onFocusPane}
        className={`relative w-full h-full overflow-hidden ${
          isActivePane ? '' : 'opacity-95'
        }`}
        dir="auto"
      />
    );
  }
);

CodeEditorPane.displayName = 'CodeEditorPane';
