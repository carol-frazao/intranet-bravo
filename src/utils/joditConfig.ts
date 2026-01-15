export const joditConfig = {
  readonly: false,
  placeholder: "Digite...",
  language: 'pt_br',
  toolbarButtonSize: 'middle',
  minHeight: 300,
  height: 'auto',
  toolbarAdaptive: false,
  enter: 'BR', // Mantém as quebras de linha
  allowHTML: true, // Permite tags HTML sem alteração
  askBeforePasteFromWord: false, // permite colar do word
  pastePlainText: false, // Cola com formatação (para permitir HTML)
  buttons: [
    'bold', 'italic', 'underline', 'strikethrough', '|',
    'ul', 'ol', '|',
    'outdent', 'indent', '|',
    'font', 'fontsize', 'brush', 'paragraph', 'lineHeight', '|',
    'image', 'table', 'link', 'file', '|',
    'align', 'undo', 'redo', 'spellcheck', '|', 
    'cut', 'copy', 'paste', 'selectall', 'copyformat', 'preview'
  ]
};

