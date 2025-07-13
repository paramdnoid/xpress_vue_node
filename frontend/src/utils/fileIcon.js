export function getFileIcon(file) {
  if (!file || typeof file !== 'object') return 'mdi:file-outline';
  if (file.type === 'folder') return 'material-symbols-light:folder';

  const name = file.name || '';
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';

  const extensionMap = {
    // Images
    jpg: 'mdi:file-image',
    jpeg: 'mdi:file-image',
    png: 'mdi:file-image',
    gif: 'mdi:file-image',
    bmp: 'mdi:file-image',
    svg: 'mdi:file-image',
    webp: 'mdi:file-image',

    // Videos
    mp4: 'mdi:file-video',
    mov: 'mdi:file-video',
    avi: 'mdi:file-video',
    mkv: 'mdi:file-video',
    webm: 'mdi:file-video',

    // Audio
    mp3: 'mdi:file-music',
    wav: 'mdi:file-music',
    ogg: 'mdi:file-music',
    flac: 'mdi:file-music',

    // Documents
    pdf: 'mdi:file-pdf-box',
    doc: 'mdi:file-word-box',
    docx: 'mdi:file-word-box',
    xls: 'mdi:file-excel-box',
    xlsx: 'mdi:file-excel-box',
    ppt: 'mdi:file-powerpoint-box',
    pptx: 'mdi:file-powerpoint-box',
    txt: 'mdi:file-document-outline',
    rtf: 'mdi:file-document-outline',
    md: 'mdi:language-markdown',

    // Archives
    zip: 'mdi:folder-zip',
    rar: 'mdi:folder-zip',
    tar: 'mdi:folder-zip',
    gz: 'mdi:folder-zip',
    '7z': 'mdi:folder-zip',

    // Code
    js: 'mdi:language-javascript',
    ts: 'mdi:language-typescript',
    html: 'mdi:language-html5',
    css: 'mdi:language-css3',
    json: 'mdi:code-json',
    xml: 'mdi:xml',
    php: 'mdi:language-php',
    py: 'mdi:language-python',
    java: 'mdi:language-java',
    c: 'mdi:language-c',
    cpp: 'mdi:language-cpp',
    cs: 'mdi:language-csharp',
    sh: 'mdi:console',
    go: 'mdi:language-go',
    rb: 'mdi:language-ruby',
    sql: 'mdi:database',

    // Fallback
    default: 'mdi:file-outline'
  };

  return extensionMap[ext] || extensionMap.default;
};