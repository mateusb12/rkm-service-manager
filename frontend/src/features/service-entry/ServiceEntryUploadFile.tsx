import { useEffect, useRef, useState } from 'react';
import { FileCheck2, Pencil, Trash2, X } from 'lucide-react';

import { getFilePreviewUrl, listFiles, type FileRecord } from '../files/service';

type ServiceEntryUploadFileProps = {
  file?: FileRecord;
  onUpload: (file: File) => Promise<void>;
  onDeselect: () => void;
  onDelete: () => void;
  onSelectExisting: (file: FileRecord) => void;
  label?: string;
  hint?: string;
  selectedBadge?: string;
  addLabel?: string;
  addHint?: string;
  uploadingLabel?: string;
  uploadingHint?: string;
  accept?: string;
  category?: string;
  showLibrary?: boolean;
};

function ServiceEntryFilePreview({ file, previewLabel, documentLabel }) {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!file?.key) {
      setPreviewUrl('');
      return undefined;
    }

    let active = true;
    void getFilePreviewUrl(file.key)
      .then((url) => {
        if (active) setPreviewUrl(url);
      })
      .catch(() => {
        if (active) setPreviewUrl('');
      });

    return () => {
      active = false;
    };
  }, [file?.key]);

  return (
    <button
      type="button"
      className="service-entry-invoice-preview"
      title={`Abrir ${file.name}`}
      onClick={() => previewUrl && window.open(previewUrl, '_blank', 'noopener,noreferrer')}
    >
      {previewUrl && file.contentType?.startsWith('image/') ? (
        <img src={previewUrl} alt={`${previewLabel} ${file.name}`} />
      ) : previewUrl && file.contentType === 'application/pdf' ? (
        <iframe title={`${previewLabel} ${file.name}`} src={previewUrl} />
      ) : (
        <span className="service-entry-invoice-document">{documentLabel}</span>
      )}
    </button>
  );
}

export function ServiceEntryUploadFile({
  file,
  onUpload,
  onDeselect,
  onDelete,
  onSelectExisting,
  label = 'Arquivo',
  hint = 'Opcional — arquivo armazenado no sistema de arquivos.',
  selectedBadge = 'Arquivo selecionado',
  addLabel = 'Adicionar arquivo',
  addHint = 'Clique ou arraste um arquivo',
  uploadingLabel = 'Enviando arquivo...',
  uploadingHint = 'Aguarde enquanto o arquivo é armazenado.',
  accept = '*/*',
  category,
  showLibrary = true,
}: ServiceEntryUploadFileProps) {
  const onSelectExistingRef = useRef(onSelectExisting);
  const fileId = file?.id;
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [existingFiles, setExistingFiles] = useState<FileRecord[]>([]);
  const [autoSelectedFile, setAutoSelectedFile] = useState<FileRecord>();
  const [editingSelection, setEditingSelection] = useState(false);
  const selectedFile = file ?? autoSelectedFile;

  onSelectExistingRef.current = onSelectExisting;

  useEffect(() => {
    if (!showLibrary) return undefined;
    let active = true;
    void listFiles()
      .then((files) => {
        if (!active) return;
        const availableFiles = files.filter(
          (candidate) =>
            candidate.bytes > 0 &&
            (!category ||
              candidate.category?.trim().toLowerCase() === category.trim().toLowerCase()),
        );
        setExistingFiles(availableFiles);
        const matchingFile = availableFiles[0];
        if (category && !fileId && matchingFile) {
          setAutoSelectedFile(matchingFile);
          onSelectExistingRef.current(matchingFile);
        }
      })
      .catch(() => {
        if (active) setExistingFiles([]);
      });

    return () => {
      active = false;
    };
  }, [category, fileId, showLibrary]);

  const uploadSelectedFile = async (selectedFile?: File) => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await onUpload(selectedFile);
    } finally {
      setUploading(false);
    }
  };

  const selectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';
    await uploadSelectedFile(selectedFile);
  };

  const dropFile = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    await uploadSelectedFile(event.dataTransfer.files?.[0]);
  };

  const dragOverFile = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    setDragging(true);
  };

  return (
    <div
      className="service-entry-photo-field"
      onDragOverCapture={dragOverFile}
      onDropCapture={dropFile}
    >
      <label className="service-entry-photo-label">{label}</label>
      <p>{hint}</p>
      {uploading ? (
        <div className="service-entry-invoice-card is-uploading" aria-live="polite">
          <div className="service-entry-invoice-preview service-entry-invoice-uploading-preview">
            <span className="service-entry-invoice-spinner" aria-hidden="true" />
          </div>
          <div className="service-entry-invoice-details">
            <strong>{uploadingLabel}</strong>
            <small>{uploadingHint}</small>
          </div>
        </div>
      ) : selectedFile && !editingSelection ? (
        <div className="service-entry-invoice-card service-entry-invoice-selected-card">
          <div className="service-entry-invoice-lock-badge">{selectedBadge}</div>
          <ServiceEntryFilePreview
            file={selectedFile}
            previewLabel={label}
            documentLabel={selectedFile.kind === 'Imagem' ? 'IMG' : 'FILE'}
          />
          <div className="service-entry-invoice-details">
            <strong title={selectedFile.name}>{selectedFile.name}</strong>
            <small>Arquivo vinculado a esta OS</small>
            <div>
              <button
                type="button"
                className="service-entry-invoice-action service-entry-invoice-edit"
                aria-label={`Trocar ${selectedFile.name}`}
                title="Trocar arquivo"
                onClick={() => setEditingSelection(true)}
              >
                <Pencil size={18} strokeWidth={1.9} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="service-entry-invoice-action service-entry-invoice-deselect"
                aria-label={`Desselecionar ${selectedFile.name}`}
                title="Desselecionar arquivo"
                onClick={() => {
                  setAutoSelectedFile(undefined);
                  onDeselect();
                }}
              >
                <X size={19} strokeWidth={2} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="service-entry-invoice-action service-entry-invoice-delete"
                aria-label={`Apagar ${selectedFile.name}`}
                title="Apagar arquivo"
                onClick={() => {
                  setAutoSelectedFile(undefined);
                  onDelete();
                }}
              >
                <Trash2 size={18} strokeWidth={1.9} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {selectedFile && editingSelection && (
            <button
              type="button"
              className="service-entry-invoice-cancel-edit"
              onClick={() => setEditingSelection(false)}
            >
              Cancelar troca
            </button>
          )}
          <div className="service-entry-invoice-library">
            {existingFiles.map((existingFile) => (
              <div
                className="service-entry-invoice-card service-entry-invoice-existing-card"
                key={existingFile.id}
              >
                <ServiceEntryFilePreview
                  file={existingFile}
                  previewLabel={label}
                  documentLabel={existingFile.kind === 'Imagem' ? 'IMG' : 'FILE'}
                />
                <div className="service-entry-invoice-details">
                  <strong title={existingFile.name}>{existingFile.name}</strong>
                  <small>{existingFile.size}</small>
                  <button
                    type="button"
                    className="service-entry-invoice-select"
                    aria-label={`Selecionar ${existingFile.name}`}
                    title="Selecionar arquivo"
                    onClick={() => {
                      onSelectExisting(existingFile);
                      setEditingSelection(false);
                    }}
                  >
                    <FileCheck2 size={23} strokeWidth={1.9} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
            <label
              className={`service-entry-invoice-card service-entry-invoice-add-card${dragging ? ' is-dragging' : ''}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={dragOverFile}
              onDragLeave={(event) => {
                if (event.currentTarget === event.target) setDragging(false);
              }}
              onDrop={dropFile}
            >
              <input type="file" accept={accept} onChange={selectFile} disabled={uploading} />
              <span className="service-entry-invoice-add-icon" aria-hidden="true">
                ＋
              </span>
              <strong>{addLabel}</strong>
              <small>{addHint}</small>
            </label>
          </div>
        </>
      )}
    </div>
  );
}
