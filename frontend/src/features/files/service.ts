export type FileKind = 'PDF' | 'Imagem' | 'Planilha' | 'Documento';

export type MockFile = {
  id: number;
  name: string;
  kind: FileKind;
  size: string;
  uploadedBy: string;
  initials: string;
  uploadedAt: Date;
  relativeTime: string;
  color: string;
  preview: string;
};

const MOCK_FILES: MockFile[] = [
  {
    id: 1,
    name: 'Laudo técnico OS-1042.pdf',
    kind: 'PDF',
    size: '2,4 MB',
    uploadedBy: 'Osmar Lamarck',
    initials: 'OL',
    uploadedAt: new Date(2026, 10, 4, 9, 42),
    relativeTime: 'há 18 min',
    color: 'from-rose-500/30 to-orange-500/20 text-rose-200',
    preview: 'LAUDO\nTÉCNICO',
  },
  {
    id: 2,
    name: 'Foto da haste — OS-1042.jpg',
    kind: 'Imagem',
    size: '4,8 MB',
    uploadedBy: 'Carlos Mendes',
    initials: 'CM',
    uploadedAt: new Date(2026, 10, 4, 9, 27),
    relativeTime: 'há 33 min',
    color: 'from-sky-500/30 to-cyan-500/20 text-sky-200',
    preview: 'IMG\nOS-1042',
  },
  {
    id: 3,
    name: 'Checklist de recebimento.xlsx',
    kind: 'Planilha',
    size: '186 KB',
    uploadedBy: 'Marina Costa',
    initials: 'MC',
    uploadedAt: new Date(2026, 10, 4, 8, 56),
    relativeTime: 'há 1 h',
    color: 'from-emerald-500/30 to-teal-500/20 text-emerald-200',
    preview: 'XLSX\nCHECK',
  },
  {
    id: 4,
    name: 'Procedimento de desmontagem.docx',
    kind: 'Documento',
    size: '924 KB',
    uploadedBy: 'Osmar Lamarck',
    initials: 'OL',
    uploadedAt: new Date(2026, 10, 3, 16, 18),
    relativeTime: 'ontem',
    color: 'from-blue-500/30 to-indigo-500/20 text-blue-200',
    preview: 'DOCX\nIT-001',
  },
  {
    id: 5,
    name: 'Evidências fotográficas OS-2018.zip',
    kind: 'Documento',
    size: '18,6 MB',
    uploadedBy: 'Jeferson Nunes',
    initials: 'JN',
    uploadedAt: new Date(2026, 10, 3, 14, 5),
    relativeTime: 'ontem',
    color: 'from-violet-500/30 to-fuchsia-500/20 text-violet-200',
    preview: 'ZIP\n12 ITENS',
  },
];

export async function listFiles(): Promise<MockFile[]> {
  return [...MOCK_FILES];
}
