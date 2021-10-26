// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * @packageDocumentation
 * @module notebook-extension
 */

import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  Dialog,
  ICommandPalette,
  InputDialog,
  ISessionContextDialogs,
  // MainAreaWidget,
  showDialog,
  // WidgetTracker,
  sessionContextDialogs
} from '@jupyterlab/apputils';

import { Cell, CodeCell, ICellModel, MarkdownCell } from '@dfnotebook/dfcells';

import { IEditorServices } from '@jupyterlab/codeeditor';

import { PageConfig } from '@jupyterlab/coreutils';

// import { IDocumentManager } from '@jupyterlab/docmanager';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { ILauncher } from '@jupyterlab/launcher';

import {
  IEditMenu,
  IFileMenu,
  IHelpMenu,
  IKernelMenu,
  IMainMenu,
  IRunMenu,
  IViewMenu
} from '@jupyterlab/mainmenu';

import * as nbformat from '@jupyterlab/nbformat';

import {
  INotebookTools,
  INotebookTracker,
  INotebookWidgetFactory
} from '@jupyterlab/notebook'

import {
  Notebook,
  NotebookTools,
  NotebookActions,
  NotebookModelFactory,
  NotebookPanel,
  NotebookTracker,
  NotebookWidgetFactory,
  StaticNotebook,
  CommandEditStatus,
  NotebookTrustStatus,
} from '@dfnotebook/dfnotebook';
import {
  IObservableList,
  IObservableUndoableList
} from '@jupyterlab/observables';

import { IPropertyInspectorProvider } from '@jupyterlab/property-inspector';

import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

// import { ServiceManager } from '@jupyterlab/services';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { IStateDB } from '@jupyterlab/statedb';

import { IStatusBar } from '@jupyterlab/statusbar';

import { ITranslator, nullTranslator } from '@jupyterlab/translation';

import { buildIcon, notebookIcon } from '@jupyterlab/ui-components';

import { ArrayExt } from '@lumino/algorithm';

import { CommandRegistry } from '@lumino/commands';

import {
  JSONExt,
  JSONObject,
  JSONValue,
  ReadonlyJSONValue,
  ReadonlyPartialJSONObject,
  UUID
} from '@lumino/coreutils';

import { DisposableSet } from '@lumino/disposable';

import { Message, MessageLoop } from '@lumino/messaging';

import { Menu, Panel } from '@lumino/widgets';

import { logNotebookOutput } from './nboutput';

/**
 * The command IDs used by the notebook plugin.
 */
namespace CommandIDs {
  export const createNew = 'notebook:create-new';

  export const interrupt = 'notebook:interrupt-kernel';

  export const restart = 'notebook:restart-kernel';

  export const restartClear = 'notebook:restart-clear-output';

  export const restartAndRunToSelected = 'notebook:restart-and-run-to-selected';

  export const restartRunAll = 'notebook:restart-run-all';

  export const reconnectToKernel = 'notebook:reconnect-to-kernel';

  export const changeKernel = 'notebook:change-kernel';

  export const createConsole = 'notebook:create-console';

  export const createOutputView = 'notebook:create-output-view';

  export const clearAllOutputs = 'notebook:clear-all-cell-outputs';

  export const closeAndShutdown = 'notebook:close-and-shutdown';

  export const trust = 'notebook:trust';

  export const exportToFormat = 'notebook:export-to-format';

  export const run = 'notebook:run-cell';

  export const runAndAdvance = 'notebook:run-cell-and-select-next';

  export const runAndInsert = 'notebook:run-cell-and-insert-below';

  export const runInConsole = 'notebook:run-in-console';

  export const runAll = 'notebook:run-all-cells';

  export const runAllAbove = 'notebook:run-all-above';

  export const runAllBelow = 'notebook:run-all-below';

  export const renderAllMarkdown = 'notebook:render-all-markdown';

  export const toCode = 'notebook:change-cell-to-code';

  export const toMarkdown = 'notebook:change-cell-to-markdown';

  export const toRaw = 'notebook:change-cell-to-raw';

  export const cut = 'notebook:cut-cell';

  export const copy = 'notebook:copy-cell';

  export const pasteAbove = 'notebook:paste-cell-above';

  export const pasteBelow = 'notebook:paste-cell-below';

  export const pasteAndReplace = 'notebook:paste-and-replace-cell';

  export const moveUp = 'notebook:move-cell-up';

  export const moveDown = 'notebook:move-cell-down';

  export const clearOutputs = 'notebook:clear-cell-output';

  export const deleteCell = 'notebook:delete-cell';

  export const insertAbove = 'notebook:insert-cell-above';

  export const insertBelow = 'notebook:insert-cell-below';

  export const selectAbove = 'notebook:move-cursor-up';

  export const selectBelow = 'notebook:move-cursor-down';

  export const extendAbove = 'notebook:extend-marked-cells-above';

  export const extendTop = 'notebook:extend-marked-cells-top';

  export const extendBelow = 'notebook:extend-marked-cells-below';

  export const extendBottom = 'notebook:extend-marked-cells-bottom';

  export const selectAll = 'notebook:select-all';

  export const deselectAll = 'notebook:deselect-all';

  export const editMode = 'notebook:enter-edit-mode';

  export const merge = 'notebook:merge-cells';

  export const mergeAbove = 'notebook:merge-cell-above';

  export const mergeBelow = 'notebook:merge-cell-below';

  export const split = 'notebook:split-cell-at-cursor';

  export const commandMode = 'notebook:enter-command-mode';

  export const toggleAllLines = 'notebook:toggle-all-cell-line-numbers';

  export const undoCellAction = 'notebook:undo-cell-action';

  export const redoCellAction = 'notebook:redo-cell-action';

  export const markdown1 = 'notebook:change-cell-to-heading-1';

  export const markdown2 = 'notebook:change-cell-to-heading-2';

  export const markdown3 = 'notebook:change-cell-to-heading-3';

  export const markdown4 = 'notebook:change-cell-to-heading-4';

  export const markdown5 = 'notebook:change-cell-to-heading-5';

  export const markdown6 = 'notebook:change-cell-to-heading-6';

  export const hideCode = 'notebook:hide-cell-code';

  export const showCode = 'notebook:show-cell-code';

  export const hideAllCode = 'notebook:hide-all-cell-code';

  export const showAllCode = 'notebook:show-all-cell-code';

  export const hideOutput = 'notebook:hide-cell-outputs';

  export const showOutput = 'notebook:show-cell-outputs';

  export const hideAllOutputs = 'notebook:hide-all-cell-outputs';

  export const showAllOutputs = 'notebook:show-all-cell-outputs';

  export const toggleRenderSideBySide = 'notebook:toggle-render-side-by-side';

  export const setSideBySideRatio = 'notebook:set-side-by-side-ratio';

  export const enableOutputScrolling = 'notebook:enable-output-scrolling';

  export const disableOutputScrolling = 'notebook:disable-output-scrolling';

  export const selectLastRunCell = 'notebook:select-last-run-cell';

  export const replaceSelection = 'notebook:replace-selection';

  export const autoClosingBrackets = 'notebook:toggle-autoclosing-brackets';

  export const toggleCollapseCmd = 'Collapsible_Headings:Toggle_Collapse';

  export const collapseAllCmd = 'Collapsible_Headings:Collapse_All';

  export const expandAllCmd = 'Collapsible_Headings:Expand_All';
}

/**
 * The name of the factory that creates notebooks.
 */
const FACTORY = 'Notebook';

/**
 * The excluded Export To ...
 * (returned from nbconvert's export list)
 */
const FORMAT_EXCLUDE = ['notebook', 'python', 'custom'];

/**
 * The notebook widget tracker provider.
 */
const trackerPlugin: JupyterFrontEndPlugin<INotebookTracker> = {
  id: 'dfnotebook-extension:tracker',
  provides: INotebookTracker,
  requires: [INotebookWidgetFactory, ITranslator],
  optional: [
    ICommandPalette,
    IFileBrowserFactory,
    ILauncher,
    ILayoutRestorer,
    IMainMenu,
    ISettingRegistry,
    ISessionContextDialogs
  ],
  activate: activateNotebookHandler,
  autoStart: true
};

/**
 * The notebook cell factory provider.
 */
const factory: JupyterFrontEndPlugin<NotebookPanel.IContentFactory> = {
  id: 'dfnotebook-extension:factory',
  provides: NotebookPanel.IContentFactory,
  requires: [IEditorServices],
  autoStart: true,
  activate: (app: JupyterFrontEnd, editorServices: IEditorServices) => {
    let editorFactory = editorServices.factoryService.newInlineEditor;
    return new NotebookPanel.ContentFactory({ editorFactory });
  }
};

/**
 * The notebook tools extension.
 */
const tools: JupyterFrontEndPlugin<INotebookTools> = {
  activate: activateNotebookTools,
  provides: INotebookTools,
  id: 'dfnotebook-extension:tools',
  autoStart: true,
  requires: [INotebookTracker, IEditorServices, IStateDB],
  optional: [IPropertyInspectorProvider]
};

/**
 * A plugin providing a CommandEdit status item.
 */
export const commandEditItem: JupyterFrontEndPlugin<void> = {
  id: 'dfnotebook-extension:mode-status',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [IStatusBar],
  activate: (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    translator: ITranslator,
    statusBar: IStatusBar | null
  ) => {
    if (!statusBar) {
      // Automatically disable if statusbar missing
      return;
    }
    const { shell } = app;
    const item = new CommandEditStatus(translator);

    // Keep the status item up-to-date with the current notebook.
    tracker.currentChanged.connect(() => {
      // FIXME as unknown
      const current = tracker.currentWidget as unknown as NotebookPanel;
      item.model.notebook = current && current.content;
    });

    statusBar.registerStatusItem('dfnotebook-extension:mode-status', {
      item,
      align: 'right',
      rank: 4,
      isActive: () =>
        !!shell.currentWidget &&
        !!tracker.currentWidget &&
        shell.currentWidget === tracker.currentWidget
    });
  }
};

/**
 * A plugin providing export commands in the main menu and command palette
 */
export const exportPlugin: JupyterFrontEndPlugin<void> = {
  id: 'dfnotebook-extension:export',
  autoStart: true,
  requires: [ITranslator, INotebookTracker],
  optional: [IMainMenu, ICommandPalette],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    tracker: INotebookTracker,
    mainMenu: IMainMenu | null,
    palette: ICommandPalette | null
  ) => {
    const trans = translator.load('jupyterlab');
    const { commands, shell } = app;
    const services = app.serviceManager;

    const isEnabled = (): boolean => {
      return Private.isEnabled(shell, tracker);
    };

    commands.addCommand(CommandIDs.exportToFormat, {
      label: args => {
        const formatLabel = args['label'] as string;
        return args['isPalette']
          ? trans.__('Save and Export Notebook: %1', formatLabel)
          : formatLabel;
      },
      execute: args => {
        const current = getCurrent(tracker, shell, args);

        if (!current) {
          return;
        }

        const url = PageConfig.getNBConvertURL({
          format: args['format'] as string,
          download: true,
          path: current.context.path
        });
        const { context } = current;

        if (context.model.dirty && !context.model.readOnly) {
          return context.save().then(() => {
            window.open(url, '_blank', 'noopener');
          });
        }

        return new Promise<void>(resolve => {
          window.open(url, '_blank', 'noopener');
          resolve(undefined);
        });
      },
      isEnabled
    });

    // Add a notebook group to the File menu.
    let exportTo: Menu | null | undefined;
    if (mainMenu) {
      exportTo = mainMenu.fileMenu.items.find(
        item =>
          item.type === 'submenu' &&
          item.submenu?.id === 'jp-mainmenu-file-notebookexport'
      )?.submenu;
    }

    void services.nbconvert.getExportFormats().then(response => {
      if (response) {
        const formatLabels: any = Private.getFormatLabels(translator);

        // Convert export list to palette and menu items.
        const formatList = Object.keys(response);
        formatList.forEach(function (key) {
          const capCaseKey = trans.__(key[0].toUpperCase() + key.substr(1));
          const labelStr = formatLabels[key] ? formatLabels[key] : capCaseKey;
          let args = {
            format: key,
            label: labelStr,
            isPalette: false
          };
          if (FORMAT_EXCLUDE.indexOf(key) === -1) {
            if (exportTo) {
              exportTo.addItem({
                command: CommandIDs.exportToFormat,
                args: args
              });
            }
            if (palette) {
              args = {
                format: key,
                label: labelStr,
                isPalette: true
              };
              const category = trans.__('Notebook Operations');
              palette.addItem({
                command: CommandIDs.exportToFormat,
                category,
                args
              });
            }
          }
        });
      }
    });
  }
};

/**
 * A plugin that adds a notebook trust status item to the status bar.
 */
export const notebookTrustItem: JupyterFrontEndPlugin<void> = {
  id: 'dfnotebook-extension:trust-status',
  autoStart: true,
  requires: [INotebookTracker, ITranslator],
  optional: [IStatusBar],
  activate: (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    tranlator: ITranslator,
    statusBar: IStatusBar | null
  ) => {
    if (!statusBar) {
      // Automatically disable if statusbar missing
      return;
    }
    const { shell } = app;
    const item = new NotebookTrustStatus(tranlator);

    // Keep the status item up-to-date with the current notebook.
    tracker.currentChanged.connect(() => {
      const current = tracker.currentWidget as unknown as NotebookPanel;
      item.model.notebook = current && current.content;
    });

    statusBar.registerStatusItem(
      'dfnotebook-extension:trust-status',
      {
        item,
        align: 'right',
        rank: 3,
        isActive: () =>
          !!shell.currentWidget &&
          !!tracker.currentWidget &&
          shell.currentWidget === tracker.currentWidget
      }
    );
  }
};

/**
 * The notebook widget factory provider.
 */
const widgetFactoryPlugin: JupyterFrontEndPlugin<NotebookWidgetFactory.IFactory> = {
  id: 'dfnotebook-extension:widget-factory',
  provides: INotebookWidgetFactory,
  requires: [
    NotebookPanel.IContentFactory,
    IEditorServices,
    IRenderMimeRegistry,
    ISessionContextDialogs,
    ITranslator
  ],
  activate: activateWidgetFactory,
  autoStart: true
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [
  factory,
  trackerPlugin,
  exportPlugin,
  tools,
  commandEditItem,
  notebookTrustItem,
  widgetFactoryPlugin,
  logNotebookOutput
];
export default plugins;

/**
 * Activate the notebook tools extension.
 */
function activateNotebookTools(
  app: JupyterFrontEnd,
  tracker: INotebookTracker,
  editorServices: IEditorServices,
  state: IStateDB,
  translator: ITranslator,
  inspectorProvider: IPropertyInspectorProvider | null
): INotebookTools {
  const trans = translator.load('jupyterlab');
  const id = 'notebook-tools';
  // FIXME as unknown
  const notebookTools = new NotebookTools({ tracker: tracker as unknown as NotebookTracker, translator });
  const activeCellTool = new NotebookTools.ActiveCellTool();
  const slideShow = NotebookTools.createSlideShowSelector(translator);
  const editorFactory = editorServices.factoryService.newInlineEditor;
  const cellMetadataEditor = new NotebookTools.CellMetadataEditorTool({
    editorFactory,
    collapsed: false,
    translator
  });
  const notebookMetadataEditor = new NotebookTools.NotebookMetadataEditorTool({
    editorFactory,
    translator
  });

  const services = app.serviceManager;

  // Create message hook for triggers to save to the database.
  const hook = (sender: any, message: Message): boolean => {
    switch (message.type) {
      case 'activate-request':
        void state.save(id, { open: true });
        break;
      case 'after-hide':
      case 'close-request':
        void state.remove(id);
        break;
      default:
        break;
    }
    return true;
  };
  const optionsMap: { [key: string]: JSONValue } = {};
  optionsMap.None = null;
  void services.nbconvert.getExportFormats().then(response => {
    if (response) {
      /**
       * The excluded Cell Inspector Raw NbConvert Formats
       * (returned from nbconvert's export list)
       */
      const rawFormatExclude = [
        'pdf',
        'slides',
        'script',
        'notebook',
        'custom'
      ];
      let optionValueArray: any = [
        [trans.__('PDF'), 'pdf'],
        [trans.__('Slides'), 'slides'],
        [trans.__('Script'), 'script'],
        [trans.__('Notebook'), 'notebook'],
        [trans.__('Custom'), 'custom']
      ];

      // convert exportList to palette and menu items
      const formatList = Object.keys(response);
      const formatLabels = Private.getFormatLabels(translator);
      formatList.forEach(function (key) {
        if (rawFormatExclude.indexOf(key) === -1) {
          const altOption = trans.__(key[0].toUpperCase() + key.substr(1));
          const option = formatLabels[key] ? formatLabels[key] : altOption;
          const mimeTypeValue = response[key].output_mimetype;
          optionValueArray.push([option, mimeTypeValue]);
        }
      });
      const nbConvert = NotebookTools.createNBConvertSelector(
        optionValueArray,
        translator
      );
      notebookTools.addItem({ tool: nbConvert, section: 'common', rank: 3 });
    }
  });
  notebookTools.title.icon = buildIcon;
  notebookTools.title.caption = trans.__('Notebook Tools');
  notebookTools.id = id;

  notebookTools.addItem({ tool: activeCellTool, section: 'common', rank: 1 });
  notebookTools.addItem({ tool: slideShow, section: 'common', rank: 2 });

  notebookTools.addItem({
    tool: cellMetadataEditor,
    section: 'advanced',
    rank: 1
  });
  notebookTools.addItem({
    tool: notebookMetadataEditor,
    section: 'advanced',
    rank: 2
  });

  MessageLoop.installMessageHook(notebookTools, hook);

  if (inspectorProvider) {
    tracker.widgetAdded.connect((sender, panel) => {
      const inspector = inspectorProvider.register(panel);
      inspector.render(notebookTools);
    });
  }

  // FIXME as unknown
  return notebookTools as unknown as INotebookTools;
}

/**
 * Activate the notebook widget factory.
 */
function activateWidgetFactory(
  app: JupyterFrontEnd,
  contentFactory: NotebookPanel.IContentFactory,
  editorServices: IEditorServices,
  rendermime: IRenderMimeRegistry,
  sessionContextDialogs: ISessionContextDialogs,
  translator: ITranslator
): NotebookWidgetFactory.IFactory {
  const factory = new NotebookWidgetFactory({
    name: FACTORY,
    fileTypes: ['notebook'],
    modelName: 'notebook',
    defaultFor: ['notebook'],
    preferKernel: true,
    canStartKernel: true,
    rendermime: rendermime,
    contentFactory,
    editorConfig: StaticNotebook.defaultEditorConfig,
    notebookConfig: StaticNotebook.defaultNotebookConfig,
    mimeTypeService: editorServices.mimeTypeService,
    sessionDialogs: sessionContextDialogs,
    translator: translator
  });
  app.docRegistry.addWidgetFactory(factory);
  return factory;
}

/**
 * Activate the notebook handler extension.
 */
function activateNotebookHandler(
  app: JupyterFrontEnd,
  factory: NotebookWidgetFactory.IFactory,
  translator: ITranslator,
  palette: ICommandPalette | null,
  browserFactory: IFileBrowserFactory | null,
  launcher: ILauncher | null,
  restorer: ILayoutRestorer | null,
  mainMenu: IMainMenu | null,
  settingRegistry: ISettingRegistry | null,
  sessionDialogs: ISessionContextDialogs | null
): INotebookTracker {
  const trans = translator.load('jupyterlab');
  const services = app.serviceManager;

  const { commands } = app;
  const tracker = new NotebookTracker({ namespace: 'notebook' });

  // Fetch settings if possible.
  const fetchSettings = settingRegistry
    ? settingRegistry.load(trackerPlugin.id)
    : Promise.reject(new Error(`No setting registry for ${trackerPlugin.id}`));

  // Handle state restoration.
  if (restorer) {
    fetchSettings
      .then(settings => {
        updateConfig(settings);
        settings.changed.connect(() => {
          updateConfig(settings);
        });
        commands.addCommand(CommandIDs.autoClosingBrackets, {
          execute: args => {
            const codeConfig = settings.get('codeCellConfig')
              .composite as JSONObject;
            const markdownConfig = settings.get('markdownCellConfig')
              .composite as JSONObject;
            const rawConfig = settings.get('rawCellConfig')
              .composite as JSONObject;

            const anyToggled =
              codeConfig.autoClosingBrackets ||
              markdownConfig.autoClosingBrackets ||
              rawConfig.autoClosingBrackets;
            const toggled = !!(args['force'] ?? !anyToggled);
            [
              codeConfig.autoClosingBrackets,
              markdownConfig.autoClosingBrackets,
              rawConfig.autoClosingBrackets
            ] = [toggled, toggled, toggled];

            void settings.set('codeCellConfig', codeConfig);
            void settings.set('markdownCellConfig', markdownConfig);
            void settings.set('rawCellConfig', rawConfig);
          },
          label: trans.__('Auto Close Brackets for All Notebook Cell Types'),
          isToggled: () =>
            ['codeCellConfig', 'markdownCellConfig', 'rawCellConfig'].some(
              x => (settings.get(x).composite as JSONObject).autoClosingBrackets
            )
        });
      })
      .catch((reason: Error) => {
        console.warn(reason.message);
        updateTracker({
          editorConfig: factory.editorConfig,
          notebookConfig: factory.notebookConfig,
          kernelShutdown: factory.shutdownOnClose
        });
      });
    void restorer.restore(tracker, {
      command: 'docmanager:open',
      args: panel => ({ path: panel.context.path, factory: FACTORY }),
      name: panel => panel.context.path,
      when: services.ready
    });
  }

  const registry = app.docRegistry;
  const modelFactory = new NotebookModelFactory({
    disableDocumentWideUndoRedo:
      factory.notebookConfig.disableDocumentWideUndoRedo
  });
  registry.addModelFactory(modelFactory);

  addCommands(app, tracker, translator, sessionDialogs);

  if (palette) {
    populatePalette(palette, translator);
  }

  let id = 0; // The ID counter for notebook panels.

  const ft = app.docRegistry.getFileType('notebook');

  factory.widgetCreated.connect((sender, widget) => {
    // If the notebook panel does not have an ID, assign it one.
    widget.id = widget.id || `notebook-${++id}`;

    // Set up the title icon
    widget.title.icon = ft?.icon;
    widget.title.iconClass = ft?.iconClass ?? '';
    widget.title.iconLabel = ft?.iconLabel ?? '';

    // Notify the widget tracker if restore data needs to update.
    widget.context.pathChanged.connect(() => {
      void tracker.save(widget);
    });
    // Add the notebook panel to the tracker.
    void tracker.add(widget);
  });

  /**
   * Update the settings of the current tracker.
   */
  function updateTracker(options: NotebookPanel.IConfig): void {
    tracker.forEach(widget => {
      widget.setConfig(options);
    });
  }

  /**
   * Update the setting values.
   */
  function updateConfig(settings: ISettingRegistry.ISettings): void {
    const code = {
      ...StaticNotebook.defaultEditorConfig.code,
      ...(settings.get('codeCellConfig').composite as JSONObject)
    };

    const markdown = {
      ...StaticNotebook.defaultEditorConfig.markdown,
      ...(settings.get('markdownCellConfig').composite as JSONObject)
    };

    const raw = {
      ...StaticNotebook.defaultEditorConfig.raw,
      ...(settings.get('rawCellConfig').composite as JSONObject)
    };

    factory.editorConfig = { code, markdown, raw };
    factory.notebookConfig = {
      scrollPastEnd: settings.get('scrollPastEnd').composite as boolean,
      defaultCell: settings.get('defaultCell').composite as nbformat.CellType,
      recordTiming: settings.get('recordTiming').composite as boolean,
      numberCellsToRenderDirectly: settings.get('numberCellsToRenderDirectly')
        .composite as number,
      renderCellOnIdle: settings.get('renderCellOnIdle').composite as boolean,
      observedTopMargin: settings.get('observedTopMargin').composite as string,
      observedBottomMargin: settings.get('observedBottomMargin')
        .composite as string,
      maxNumberOutputs: settings.get('maxNumberOutputs').composite as number,
      disableDocumentWideUndoRedo: settings.get(
        'experimentalDisableDocumentWideUndoRedo'
      ).composite as boolean
    };
    factory.shutdownOnClose = settings.get('kernelShutdown')
      .composite as boolean;

    modelFactory.disableDocumentWideUndoRedo = settings.get(
        'experimentalDisableDocumentWideUndoRedo'
    ).composite as boolean;

    updateTracker({
      editorConfig: factory.editorConfig,
      notebookConfig: factory.notebookConfig,
      kernelShutdown: factory.shutdownOnClose
    });
  }

  // Add main menu notebook menu.
  if (mainMenu) {
    populateMenus(app, mainMenu, tracker as unknown as INotebookTracker, translator, sessionDialogs);
  }

  // Utility function to create a new notebook.
  const createNew = (cwd: string, kernelName?: string) => {
    return commands
      .execute('docmanager:new-untitled', { path: cwd, type: 'notebook' })
      .then(model => {
        if (model != undefined) {
          return commands.execute('docmanager:open', {
            path: model.path,
            factory: FACTORY,
            kernel: { name: kernelName }
          });
        }
      });
  };

  // Add a command for creating a new notebook.
  commands.addCommand(CommandIDs.createNew, {
    label: args => {
      const kernelName = (args['kernelName'] as string) || '';
      if (args['isLauncher'] && args['kernelName'] && services.kernelspecs) {
        return (
          services.kernelspecs.specs?.kernelspecs[kernelName]?.display_name ??
          ''
        );
      }
      if (args['isPalette']) {
        return trans.__('New Notebook');
      }
      return trans.__('Notebook');
    },
    caption: trans.__('Create a new notebook'),
    icon: args => (args['isPalette'] ? undefined : notebookIcon),
    execute: args => {
      const cwd =
        (args['cwd'] as string) ||
        (browserFactory ? browserFactory.defaultBrowser.model.path : '');
      const kernelName = (args['kernelName'] as string) || '';
      return createNew(cwd, kernelName);
    }
  });

  // Add a launcher item if the launcher is available.
  if (launcher) {
    void services.ready.then(() => {
      let disposables: DisposableSet | null = null;
      const onSpecsChanged = () => {
        if (disposables) {
          disposables.dispose();
          disposables = null;
        }
        const specs = services.kernelspecs.specs;
        if (!specs) {
          return;
        }
        disposables = new DisposableSet();

        for (const name in specs.kernelspecs) {
          const rank = name === specs.default ? 0 : Infinity;
          const spec = specs.kernelspecs[name]!;
          let kernelIconUrl = spec.resources['logo-64x64'];
          disposables.add(
            launcher.add({
              command: CommandIDs.createNew,
              args: { isLauncher: true, kernelName: name },
              category: trans.__('Notebook'),
              rank,
              kernelIconUrl,
              metadata: {
                kernel: JSONExt.deepCopy(
                  spec.metadata || {}
                ) as ReadonlyJSONValue
              }
            })
          );
        }
      };
      onSpecsChanged();
      services.kernelspecs.specsChanged.connect(onSpecsChanged);
    });
  }

  // FIXME as unknown
  return tracker as unknown as INotebookTracker;
}

function getCurrent(
  tracker: INotebookTracker,
  shell: JupyterFrontEnd.IShell,
  args: ReadonlyPartialJSONObject
): NotebookPanel | null {
  const widget = tracker.currentWidget;
  const activate = args['activate'] !== false;

  if (activate && widget) {
    shell.activateById(widget.id);
  }

  return widget as unknown as NotebookPanel;
}

/**
 * Add the notebook commands to the application's command registry.
 */
function addCommands(
  app: JupyterFrontEnd,
  tracker: NotebookTracker,
  translator: ITranslator,
  sessionDialogs: ISessionContextDialogs | null
): void {
  const trans = translator.load('jupyterlab');
  const { commands, shell } = app;

  sessionDialogs = sessionDialogs ?? sessionContextDialogs;

  const isEnabled = (): boolean => {
    return Private.isEnabled(shell, tracker as unknown as INotebookTracker);
  };

  const isEnabledAndSingleSelected = (): boolean => {
    return Private.isEnabledAndSingleSelected(shell, tracker as unknown as INotebookTracker);
  };

  const refreshCellCollapsed = (notebook: Notebook): void => {
    for (const cell of notebook.widgets) {
      if (cell instanceof MarkdownCell && cell.headingCollapsed) {
        NotebookActions.setHeadingCollapse(cell, true, notebook);
      }
      if (cell.model.id === notebook.activeCell?.model?.id) {
        NotebookActions.expandParent(cell, notebook);
      }
    }
  };

  const isEnabledAndHeadingSelected = (): boolean => {
    return Private.isEnabledAndHeadingSelected(shell, tracker as unknown as INotebookTracker);
  };

  // Set up collapse signal for each header cell in a notebook
  tracker.currentChanged.connect(
    (sender: NotebookTracker, panel: NotebookPanel) => {
      if (!panel?.content?.model?.cells) {
        return;
      }
      panel.content.model.cells.changed.connect(
        (
          list: IObservableUndoableList<ICellModel>,
          args: IObservableList.IChangedArgs<ICellModel>
        ) => {
          const cell = panel.content.widgets[args.newIndex];
          if (
            cell instanceof MarkdownCell &&
            (args.type === 'add' || args.type === 'set')
          ) {
            cell.toggleCollapsedSignal.connect(
              (newCell: MarkdownCell, collapsing: boolean) => {
                NotebookActions.setHeadingCollapse(
                  newCell,
                  collapsing,
                  panel.content
                );
              }
            );
          }
          // Might be overkill to refresh this every time, but
          // it helps to keep the collapse state consistent.
          refreshCellCollapsed(panel.content);
        }
      );
      panel.content.activeCellChanged.connect(
        (notebook: Notebook, cell: Cell) => {
          NotebookActions.expandParent(cell, notebook);
        }
      );
    }
  );

  commands.addCommand(CommandIDs.runAndAdvance, {
    label: trans.__('Run Selected Cells'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        const { context, content } = current;

        return NotebookActions.runAndAdvance(content, context.sessionContext);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.run, {
    label: trans.__("Run Selected Cells and Don't Advance"),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        const { context, content } = current;

        return NotebookActions.run(content, context.sessionContext);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.runAndInsert, {
    label: trans.__('Run Selected Cells and Insert Below'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        const { context, content } = current;

        return NotebookActions.runAndInsert(content, context.sessionContext);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.runAll, {
    label: trans.__('Run All Cells'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        const { context, content } = current;

        return NotebookActions.runAll(content, context.sessionContext);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.runAllAbove, {
    label: trans.__('Run All Above Selected Cell'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        const { context, content } = current;

        return NotebookActions.runAllAbove(content, context.sessionContext);
      }
    },
    isEnabled: () => {
      // Can't run above if there are multiple cells selected,
      // or if we are at the top of the notebook.
      return (
        isEnabledAndSingleSelected() &&
        tracker.currentWidget!.content.activeCellIndex !== 0
      );
    }
  });
  commands.addCommand(CommandIDs.runAllBelow, {
    label: trans.__('Run Selected Cell and All Below'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        const { context, content } = current;

        return NotebookActions.runAllBelow(content, context.sessionContext);
      }
    },
    isEnabled: () => {
      // Can't run below if there are multiple cells selected,
      // or if we are at the bottom of the notebook.
      return (
        isEnabledAndSingleSelected() &&
        tracker.currentWidget!.content.activeCellIndex !==
          tracker.currentWidget!.content.widgets.length - 1
      );
    }
  });
  commands.addCommand(CommandIDs.renderAllMarkdown, {
    label: trans.__('Render All Markdown Cells'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);
      if (current) {
        const { context, content } = current;
        return NotebookActions.renderAllMarkdown(
          content,
          context.sessionContext
        );
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.restart, {
    label: trans.__('Restart Kernel…'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return sessionDialogs!.restart(current.sessionContext, translator);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.closeAndShutdown, {
    label: trans.__('Close and Shut Down'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (!current) {
        return;
      }

      const fileName = current.title.label;

      return showDialog({
        title: trans.__('Shut down the notebook?'),
        body: trans.__('Are you sure you want to close "%1"?', fileName),
        buttons: [Dialog.cancelButton(), Dialog.warnButton()]
      }).then(result => {
        if (result.button.accept) {
          return current.context.sessionContext.shutdown().then(() => {
            current.dispose();
          });
        }
      });
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.trust, {
    label: () => trans.__('Trust Notebook'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);
      if (current) {
        const { context, content } = current;
        return NotebookActions.trust(content).then(() => context.save());
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.restartClear, {
    label: trans.__('Restart Kernel and Clear All Outputs…'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        const { content, sessionContext } = current;

        return sessionDialogs!.restart(sessionContext, translator).then(() => {
          NotebookActions.clearAllOutputs(content);
        });
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.restartAndRunToSelected, {
    label: trans.__('Restart Kernel and Run up to Selected Cell…'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);
      if (current) {
        const { context, content } = current;
        return sessionDialogs!
          .restart(current.sessionContext, translator)
          .then(restarted => {
            if (restarted) {
              void NotebookActions.runAllAbove(
                content,
                context.sessionContext
              ).then(executed => {
                if (executed || content.activeCellIndex === 0) {
                  void NotebookActions.run(content, context.sessionContext);
                }
              });
            }
          });
      }
    },
    isEnabled: isEnabledAndSingleSelected
  });
  commands.addCommand(CommandIDs.restartRunAll, {
    label: trans.__('Restart Kernel and Run All Cells…'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        const { context, content, sessionContext } = current;

        return sessionDialogs!
          .restart(sessionContext, translator)
          .then(restarted => {
            if (restarted) {
              void NotebookActions.runAll(content, context.sessionContext);
            }
            return restarted;
          });
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.clearAllOutputs, {
    label: trans.__('Clear All Outputs'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.clearAllOutputs(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.clearOutputs, {
    label: trans.__('Clear Outputs'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.clearOutputs(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.interrupt, {
    label: trans.__('Interrupt Kernel'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (!current) {
        return;
      }

      const kernel = current.context.sessionContext.session?.kernel;

      if (kernel) {
        return kernel.interrupt();
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.toCode, {
    label: trans.__('Change to Code Cell Type'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.changeCellType(current.content, 'code');
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.toMarkdown, {
    label: trans.__('Change to Markdown Cell Type'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.changeCellType(current.content, 'markdown');
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.toRaw, {
    label: trans.__('Change to Raw Cell Type'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.changeCellType(current.content, 'raw');
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.cut, {
    label: trans.__('Cut Cells'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.cut(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.copy, {
    label: trans.__('Copy Cells'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.copy(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.pasteBelow, {
    label: trans.__('Paste Cells Below'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.paste(current.content, 'below');
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.pasteAbove, {
    label: trans.__('Paste Cells Above'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.paste(current.content, 'above');
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.pasteAndReplace, {
    label: trans.__('Paste Cells and Replace'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.paste(current.content, 'replace');
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.deleteCell, {
    label: trans.__('Delete Cells'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.deleteCells(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.split, {
    label: trans.__('Split Cell'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.splitCell(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.merge, {
    label: trans.__('Merge Selected Cells'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.mergeCells(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.mergeAbove, {
    label: trans.__('Merge Cell Above'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.mergeCells(current.content, true);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.mergeBelow, {
    label: trans.__('Merge Cell Below'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.mergeCells(current.content, false);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.insertAbove, {
    label: trans.__('Insert Cell Above'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.insertAbove(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.insertBelow, {
    label: trans.__('Insert Cell Below'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.insertBelow(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.selectAbove, {
    label: trans.__('Select Cell Above'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.selectAbove(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.selectBelow, {
    label: trans.__('Select Cell Below'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.selectBelow(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.extendAbove, {
    label: trans.__('Extend Selection Above'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.extendSelectionAbove(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.extendTop, {
    label: trans.__('Extend Selection to Top'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.extendSelectionAbove(current.content, true);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.extendBelow, {
    label: trans.__('Extend Selection Below'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.extendSelectionBelow(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.extendBottom, {
    label: trans.__('Extend Selection to Bottom'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.extendSelectionBelow(current.content, true);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.selectAll, {
    label: trans.__('Select All Cells'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.selectAll(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.deselectAll, {
    label: trans.__('Deselect All Cells'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.deselectAll(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.moveUp, {
    label: trans.__('Move Cells Up'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.moveUp(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.moveDown, {
    label: trans.__('Move Cells Down'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.moveDown(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.toggleAllLines, {
    label: trans.__('Toggle All Line Numbers'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.toggleAllLineNumbers(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.commandMode, {
    label: trans.__('Enter Command Mode'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        current.content.mode = 'command';
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.editMode, {
    label: trans.__('Enter Edit Mode'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        current.content.mode = 'edit';
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.undoCellAction, {
    label: trans.__('Undo Cell Operation'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.undo(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.redoCellAction, {
    label: trans.__('Redo Cell Operation'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.redo(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.changeKernel, {
    label: trans.__('Change Kernel…'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return sessionDialogs!.selectKernel(
          current.context.sessionContext,
          translator
        );
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.reconnectToKernel, {
    label: trans.__('Reconnect To Kernel'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (!current) {
        return;
      }

      const kernel = current.context.sessionContext.session?.kernel;

      if (kernel) {
        return kernel.reconnect();
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.markdown1, {
    label: trans.__('Change to Heading 1'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.setMarkdownHeader(current.content, 1);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.markdown2, {
    label: trans.__('Change to Heading 2'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.setMarkdownHeader(current.content, 2);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.markdown3, {
    label: trans.__('Change to Heading 3'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.setMarkdownHeader(current.content, 3);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.markdown4, {
    label: trans.__('Change to Heading 4'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.setMarkdownHeader(current.content, 4);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.markdown5, {
    label: trans.__('Change to Heading 5'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.setMarkdownHeader(current.content, 5);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.markdown6, {
    label: trans.__('Change to Heading 6'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.setMarkdownHeader(current.content, 6);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.hideCode, {
    label: trans.__('Collapse Selected Code'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.hideCode(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.showCode, {
    label: trans.__('Expand Selected Code'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.showCode(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.hideAllCode, {
    label: trans.__('Collapse All Code'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.hideAllCode(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.showAllCode, {
    label: trans.__('Expand All Code'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.showAllCode(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.hideOutput, {
    label: trans.__('Collapse Selected Outputs'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.hideOutput(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.showOutput, {
    label: trans.__('Expand Selected Outputs'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.showOutput(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.hideAllOutputs, {
    label: trans.__('Collapse All Outputs'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.hideAllOutputs(current.content);
      }
    },
    isEnabled
  });

  commands.addCommand(CommandIDs.toggleRenderSideBySide, {
    label: trans.__('Render Side-by-side'),
    execute: args => {
      Private.renderSideBySide = !Private.renderSideBySide;
      tracker.forEach(wideget => {
        if (wideget) {
          if (Private.renderSideBySide) {
            return NotebookActions.renderSideBySide(wideget.content);
          } else {
            return NotebookActions.renderNotSideBySide(wideget.content);
          }
        }
      });
      tracker.currentChanged.connect(() => {
        if (Private.renderSideBySide && tracker.currentWidget) {
          return NotebookActions.renderSideBySide(
            tracker.currentWidget.content
          );
        }
      });
    },
    isToggled: () => Private.renderSideBySide,
    isEnabled
  });

  commands.addCommand(CommandIDs.setSideBySideRatio, {
    label: trans.__('Set side-by-side ratio'),
    execute: args => {
      InputDialog.getNumber({
        title: trans.__('Width of the output in side-by-side mode'),
        value: 1
      })
        .then(result => {
          if (result.value) {
            document.documentElement.style.setProperty(
              '--jp-side-by-side-output-size',
              `${result.value}fr`
            );
          }
        })
        .catch(console.error);
    }
  });
  commands.addCommand(CommandIDs.showAllOutputs, {
    label: trans.__('Expand All Outputs'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.showAllOutputs(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.enableOutputScrolling, {
    label: trans.__('Enable Scrolling for Outputs'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.enableOutputScrolling(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.disableOutputScrolling, {
    label: trans.__('Disable Scrolling for Outputs'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.disableOutputScrolling(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.selectLastRunCell, {
    label: trans.__('Select current running or last run cell'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);

      if (current) {
        return NotebookActions.selectLastRunCell(current.content);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.replaceSelection, {
    label: trans.__('Replace Selection in Notebook Cell'),
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);
      const text: string = (args['text'] as string) || '';
      if (current) {
        return NotebookActions.replaceSelection(current.content, text);
      }
    },
    isEnabled
  });
  commands.addCommand(CommandIDs.toggleCollapseCmd, {
    label: 'Toggle Collapse Notebook Heading',
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);
      if (current) {
        return NotebookActions.toggleCurrentHeadingCollapse(current.content);
      }
    },
    isEnabled: isEnabledAndHeadingSelected
  });
  commands.addCommand(CommandIDs.collapseAllCmd, {
    label: 'Collapse All Cells',
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);
      if (current) {
        return NotebookActions.collapseAll(current.content);
      }
    }
  });
  commands.addCommand(CommandIDs.expandAllCmd, {
    label: 'Expand All Headings',
    execute: args => {
      const current = getCurrent(tracker as unknown as INotebookTracker, shell, args);
      if (current) {
        return NotebookActions.expandAllHeadings(current.content);
      }
    }
  });
}

/**
 * Populate the application's command palette with notebook commands.
 */
function populatePalette(
  palette: ICommandPalette,
  translator: ITranslator
): void {
  const trans = translator.load('jupyterlab');
  let category = trans.__('Notebook Operations');

  [
    CommandIDs.interrupt,
    CommandIDs.restart,
    CommandIDs.restartClear,
    CommandIDs.restartRunAll,
    CommandIDs.runAll,
    CommandIDs.renderAllMarkdown,
    CommandIDs.runAllAbove,
    CommandIDs.runAllBelow,
    CommandIDs.restartAndRunToSelected,
    CommandIDs.selectAll,
    CommandIDs.deselectAll,
    CommandIDs.clearAllOutputs,
    CommandIDs.toggleAllLines,
    CommandIDs.editMode,
    CommandIDs.commandMode,
    CommandIDs.changeKernel,
    CommandIDs.reconnectToKernel,
    CommandIDs.createConsole,
    CommandIDs.closeAndShutdown,
    CommandIDs.trust,
    CommandIDs.toggleCollapseCmd,
    CommandIDs.collapseAllCmd,
    CommandIDs.expandAllCmd
  ].forEach(command => {
    palette.addItem({ command, category });
  });

  palette.addItem({
    command: CommandIDs.createNew,
    category,
    args: { isPalette: true }
  });

  category = trans.__('Notebook Cell Operations');
  [
    CommandIDs.run,
    CommandIDs.runAndAdvance,
    CommandIDs.runAndInsert,
    CommandIDs.runInConsole,
    CommandIDs.clearOutputs,
    CommandIDs.toCode,
    CommandIDs.toMarkdown,
    CommandIDs.toRaw,
    CommandIDs.cut,
    CommandIDs.copy,
    CommandIDs.pasteBelow,
    CommandIDs.pasteAbove,
    CommandIDs.pasteAndReplace,
    CommandIDs.deleteCell,
    CommandIDs.split,
    CommandIDs.merge,
    CommandIDs.mergeAbove,
    CommandIDs.mergeBelow,
    CommandIDs.insertAbove,
    CommandIDs.insertBelow,
    CommandIDs.selectAbove,
    CommandIDs.selectBelow,
    CommandIDs.extendAbove,
    CommandIDs.extendTop,
    CommandIDs.extendBelow,
    CommandIDs.extendBottom,
    CommandIDs.moveDown,
    CommandIDs.moveUp,
    CommandIDs.undoCellAction,
    CommandIDs.redoCellAction,
    CommandIDs.markdown1,
    CommandIDs.markdown2,
    CommandIDs.markdown3,
    CommandIDs.markdown4,
    CommandIDs.markdown5,
    CommandIDs.markdown6,
    CommandIDs.hideCode,
    CommandIDs.showCode,
    CommandIDs.hideAllCode,
    CommandIDs.showAllCode,
    CommandIDs.hideOutput,
    CommandIDs.showOutput,
    CommandIDs.hideAllOutputs,
    CommandIDs.showAllOutputs,
    CommandIDs.toggleRenderSideBySide,
    CommandIDs.setSideBySideRatio,
    CommandIDs.enableOutputScrolling,
    CommandIDs.disableOutputScrolling
  ].forEach(command => {
    palette.addItem({ command, category });
  });
}

/**
 * Populates the application menus for the notebook.
 */
function populateMenus(
  app: JupyterFrontEnd,
  mainMenu: IMainMenu,
  tracker: INotebookTracker,
  translator: ITranslator,
  sessionDialogs: ISessionContextDialogs | null
): void {
  const trans = translator.load('jupyterlab');
  const { commands } = app;
  sessionDialogs = sessionDialogs || sessionContextDialogs;

  // Add undo/redo hooks to the edit menu.
  mainMenu.editMenu.undoers.add({
    // FIXME as unknown
    tracker: tracker as unknown as NotebookTracker,
    undo: widget => {
      widget.content.activeCell?.editor.undo();
    },
    redo: widget => {
      widget.content.activeCell?.editor.redo();
    }
  } as IEditMenu.IUndoer<NotebookPanel>);

  // Add a clearer to the edit menu
  mainMenu.editMenu.clearers.add({
    tracker: tracker as unknown as NotebookTracker,
    clearCurrentLabel: (n: number) => trans.__('Clear Output'),
    clearAllLabel: (n: number) => {
      return trans.__('Clear All Outputs');
    },
    clearCurrent: (current: NotebookPanel) => {
      return NotebookActions.clearOutputs(current.content);
    },
    clearAll: (current: NotebookPanel) => {
      return NotebookActions.clearAllOutputs(current.content);
    }
  } as IEditMenu.IClearer<NotebookPanel>);

  // Add a close and shutdown command to the file menu.
  mainMenu.fileMenu.closeAndCleaners.add({
    tracker: tracker as unknown as NotebookTracker,
    closeAndCleanupLabel: (n: number) =>
      trans.__('Close and Shutdown Notebook'),
    closeAndCleanup: (current: NotebookPanel) => {
      const fileName = current.title.label;
      return showDialog({
        title: trans.__('Shut down the Notebook?'),
        body: trans.__('Are you sure you want to close "%1"?', fileName),
        buttons: [Dialog.cancelButton(), Dialog.warnButton()]
      }).then(result => {
        if (result.button.accept) {
          return current.context.sessionContext.shutdown().then(() => {
            current.dispose();
          });
        }
      });
    }
  } as IFileMenu.ICloseAndCleaner<NotebookPanel>);

  // Add a kernel user to the Kernel menu
  mainMenu.kernelMenu.kernelUsers.add({
    // FIXME as unknown
    tracker: tracker as unknown as NotebookTracker,
    interruptKernel: current => {
      const kernel = current.sessionContext.session?.kernel;
      if (kernel) {
        return kernel.interrupt();
      }
      return Promise.resolve(void 0);
    },
    reconnectToKernel: current => {
      const kernel = current.sessionContext.session?.kernel;
      if (kernel) {
        return kernel.reconnect();
      }
      return Promise.resolve(void 0);
    },
    restartKernelAndClearLabel: (n: number) =>
      trans.__('Restart Kernel and Clear All Outputs…'),
    restartKernel: current =>
      sessionDialogs!.restart(current.sessionContext, translator),
    restartKernelAndClear: current => {
      return sessionDialogs!
        .restart(current.sessionContext, translator)
        .then(restarted => {
          if (restarted) {
            NotebookActions.clearAllOutputs(current.content);
          }
          return restarted;
        });
    },
    changeKernel: current =>
      sessionDialogs!.selectKernel(current.sessionContext, translator),
    shutdownKernel: current => current.sessionContext.shutdown()
  } as IKernelMenu.IKernelUser<NotebookPanel>);

  // Add a console creator the the Kernel menu
  mainMenu.fileMenu.consoleCreators.add({
    tracker: tracker as unknown as NotebookTracker,
    createConsoleLabel: (n: number) => trans.__('New Console for Notebook'),
    createConsole: current => Private.createConsole(commands, current, true)
  } as IFileMenu.IConsoleCreator<NotebookPanel>);

  // Add an IEditorViewer to the application view menu
  mainMenu.viewMenu.editorViewers.add({
    // FIXME as unknown
    tracker: tracker as unknown as NotebookTracker,
    toggleLineNumbers: widget => {
      NotebookActions.toggleAllLineNumbers(widget.content);
    },
    lineNumbersToggled: widget => {
      const config = widget.content.editorConfig;
      return !!(
        config.code.lineNumbers &&
        config.markdown.lineNumbers &&
        config.raw.lineNumbers
      );
    }
  } as IViewMenu.IEditorViewer<NotebookPanel>);

  // Add an ICodeRunner to the application run menu
  mainMenu.runMenu.codeRunners.add({
    tracker: tracker as unknown as NotebookTracker,
    runLabel: (n: number) => trans.__('Run Selected Cells'),
    runAllLabel: (n: number) => trans.__('Run All Cells'),
    restartAndRunAllLabel: (n: number) =>
      trans.__('Restart Kernel and Run All Cells…'),
    run: current => {
      const { context, content } = current;
      return NotebookActions.runAndAdvance(
        content,
        context.sessionContext
      ).then(() => void 0);
    },
    runAll: current => {
      const { context, content } = current;
      return NotebookActions.runAll(content, context.sessionContext).then(
        () => void 0
      );
    },
    restartAndRunAll: current => {
      const { context, content } = current;
      return sessionDialogs!
        .restart(context.sessionContext, translator)
        .then(restarted => {
          if (restarted) {
            void NotebookActions.runAll(content, context.sessionContext);
          }
          return restarted;
        });
    }
  } as IRunMenu.ICodeRunner<NotebookPanel>);

  // Add kernel information to the application help menu.
  mainMenu.helpMenu.kernelUsers.add({
    // FIXME as unknown
    tracker: tracker as unknown as NotebookTracker,
    getKernel: current => current.sessionContext.session?.kernel
  } as IHelpMenu.IKernelUser<NotebookPanel>);
}

/**
 * A namespace for module private functionality.
 */
namespace Private {
  /**
   * Create a console connected with a notebook kernel
   *
   * @param commands Commands registry
   * @param widget Notebook panel
   * @param activate Should the console be activated
   */
  export function createConsole(
    commands: CommandRegistry,
    widget: NotebookPanel,
    activate?: boolean
  ): Promise<void> {
    const options = {
      path: widget.context.path,
      preferredLanguage: widget.context.model.defaultKernelLanguage,
      activate: activate,
      ref: widget.id,
      insertMode: 'split-bottom'
    };

    return commands.execute('console:create', options);
  }

  /**
   * Whether there is an active notebook.
   */
  export function isEnabled(
    shell: JupyterFrontEnd.IShell,
    tracker: INotebookTracker
  ): boolean {
    return (
      tracker.currentWidget !== null &&
      tracker.currentWidget === shell.currentWidget
    );
  }

  /**
   * Whether there is an notebook active, with a single selected cell.
   */
  export function isEnabledAndSingleSelected(
    shell: JupyterFrontEnd.IShell,
    tracker: INotebookTracker
  ): boolean {
    if (!Private.isEnabled(shell, tracker)) {
      return false;
    }
    const { content } = tracker.currentWidget!;
    const index = content.activeCellIndex;
    // If there are selections that are not the active cell,
    // this command is confusing, so disable it.
    for (let i = 0; i < content.widgets.length; ++i) {
      if (content.isSelected(content.widgets[i]) && i !== index) {
        return false;
      }
    }
    return true;
  }

  /**
   * Whether there is an notebook active, with a single selected cell.
   */
  export function isEnabledAndHeadingSelected(
    shell: JupyterFrontEnd.IShell,
    tracker: INotebookTracker
  ): boolean {
    if (!Private.isEnabled(shell, tracker)) {
      return false;
    }
    const { content } = tracker.currentWidget!;
    const index = content.activeCellIndex;
    if (!(content.activeCell instanceof MarkdownCell)) {
      return false;
    }
    // If there are selections that are not the active cell,
    // this command is confusing, so disable it.
    for (let i = 0; i < content.widgets.length; ++i) {
      if (content.isSelected(content.widgets[i]) && i !== index) {
        return false;
      }
    }
    return true;
  }

  /**
   * The default Export To ... formats and their human readable labels.
   */
  export function getFormatLabels(
    translator: ITranslator
  ): { [k: string]: string } {
    translator = translator || nullTranslator;
    const trans = translator.load('jupyterlab');
    return {
      html: trans.__('HTML'),
      latex: trans.__('LaTeX'),
      markdown: trans.__('Markdown'),
      pdf: trans.__('PDF'),
      rst: trans.__('ReStructured Text'),
      script: trans.__('Executable Script'),
      slides: trans.__('Reveal.js Slides')
    };
  }

  /**
   * A widget hosting a cloned output area.
   */
  export class ClonedOutputArea extends Panel {
    constructor(options: ClonedOutputArea.IOptions) {
      super();
      const trans = (options.translator || nullTranslator).load('jupyterlab');
      this._notebook = options.notebook;
      this._index = options.index !== undefined ? options.index : -1;
      this._cell = options.cell || null;
      this.id = `LinkedOutputView-${UUID.uuid4()}`;
      this.title.label = 'Output View';
      this.title.icon = notebookIcon;
      this.title.caption = this._notebook.title.label
        ? trans.__('For Notebook: %1', this._notebook.title.label)
        : trans.__('For Notebook:');
      this.addClass('jp-LinkedOutputView');

      // Wait for the notebook to be loaded before
      // cloning the output area.
      void this._notebook.context.ready.then(() => {
        if (!this._cell) {
          this._cell = this._notebook.content.widgets[this._index] as CodeCell;
        }
        if (!this._cell || this._cell.model.type !== 'code') {
          this.dispose();
          return;
        }
        const clone = this._cell.cloneOutputArea();
        this.addWidget(clone);
      });
    }

    /**
     * The index of the cell in the notebook.
     */
    get index(): number {
      return this._cell
        ? ArrayExt.findFirstIndex(
            this._notebook.content.widgets,
            c => c === this._cell
          )
        : this._index;
    }

    /**
     * The path of the notebook for the cloned output area.
     */
    get path(): string {
      return this._notebook.context.path;
    }

    private _notebook: NotebookPanel;
    private _index: number;
    private _cell: CodeCell | null = null;
  }

  /**
   * ClonedOutputArea statics.
   */
  export namespace ClonedOutputArea {
    export interface IOptions {
      /**
       * The notebook associated with the cloned output area.
       */
      notebook: NotebookPanel;

      /**
       * The cell for which to clone the output area.
       */
      cell?: CodeCell;

      /**
       * If the cell is not available, provide the index
       * of the cell for when the notebook is loaded.
       */
      index?: number;

      /**
       * If the cell is not available, provide the index
       * of the cell for when the notebook is loaded.
       */
      translator?: ITranslator;
    }
  }

  export let renderSideBySide = false;
}
