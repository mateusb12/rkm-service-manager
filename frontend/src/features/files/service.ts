import { apiRequest } from '../../shared/api/http';

export type FileKind = 'PDF' | 'Imagem' | 'Planilha' | 'Documento';

export type FileRecord = {
  key: string;
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

type BackendFile = {
  key: string;
  name: string;
  size: number;
  contentType: string;
  uploadedBy: string;
  uploadedAt: string;
};

const FILE_COLORS = {
  PDF: 'from-rose-500/30 to-orange-500/20 text-rose-200',
  Imagem: 'from-sky-500/30 to-cyan-500/20 text-sky-200',
  Planilha: 'from-emerald-500/30 to-teal-500/20 text-emerald-200',
  Documento: 'from-blue-500/30 to-indigo-500/20 text-blue-200',
};

function fileKind(file: BackendFile): FileKind {
  if (file.contentType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))
    return 'PDF';
  if (file.contentType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name))
    return 'Imagem';
  if (file.contentType.includes('spreadsheet') || /\.(xls|xlsx|csv)$/i.test(file.name))
    return 'Planilha';
  return 'Documento';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

function relativeTime(date: Date): string {
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  if (minutes < 24 * 60) return `há ${Math.floor(minutes / 60)} h`;
  return 'há mais de 1 dia';
}

function toFileRecord(file: BackendFile): FileRecord {
  const kind = fileKind(file);
  const uploadedAt = new Date(file.uploadedAt);
  const initials = file.uploadedBy
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return {
    key: file.key,
    name: file.name,
    kind,
    size: formatSize(file.size),
    uploadedBy: file.uploadedBy || 'Usuário não identificado',
    initials: initials || '??',
    uploadedAt,
    relativeTime: relativeTime(uploadedAt),
    color: FILE_COLORS[kind],
    preview: file.name.split('.').pop()?.toUpperCase() ?? 'FILE',
  };
}

export async function listFiles(): Promise<FileRecord[]> {
  const response = await apiRequest('/files');
  if (!response.ok) throw new Error('files_query_failed');
  const files = (await response.json()) as BackendFile[];
  return files.map(toFileRecord);
}

export async function uploadFile(file: File): Promise<FileRecord> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiRequest('/files', { method: 'POST', body: formData });
  if (!response.ok) throw new Error('file_upload_failed');
  return toFileRecord((await response.json()) as BackendFile);
}

export function fileUrl(key: string, download = false): string {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `/files/${encodedKey}${download ? '?download=1' : ''}`;
}

export async function fetchFile(key: string, download = false): Promise<Blob> {
  const response = await apiRequest(fileUrl(key, download));
  if (!response.ok) throw new Error('file_download_failed');
  return response.blob();
}

export async function deleteFile(key: string): Promise<void> {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  const response = await apiRequest(`/files/${encodedKey}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('file_delete_failed');
}

export type StorageHealth = {
  status: 'healthy' | 'unhealthy';
  provider?: string;
};

export async function getStorageHealth(): Promise<StorageHealth> {
  const response = await apiRequest('/files/storage-health');
  const body = (await response.json()) as StorageHealth;

  if (!response.ok) throw new Error(body.status || 'object_storage_unavailable');
  return body;
}
