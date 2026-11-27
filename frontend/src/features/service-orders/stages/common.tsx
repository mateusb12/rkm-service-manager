import { forwardRef, useEffect, useRef, useState } from 'react';

import { getFilePreviewUrl } from '../../files/service';
import { ServiceOrderFileUpload } from '../ServiceOrderFileUpload';

export const ServiceEntrySection = ({ title, description, children, className = '' }) => (
  <section className={`service-entry-section ${className}`}>
    <div className="service-entry-section-header">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </div>
    <div className="service-entry-grid">{children}</div>
  </section>
);

export const ServiceEntryPhotoField = ({ label, photos = [], onFiles, onRemove, onSelectExisting, hint }) => {
  const [previews, setPreviews] = useState({});
  const [loadingPreviews, setLoadingPreviews] = useState({});
  const [failedPreviews, setFailedPreviews] = useState({});
  const previewUrls = useRef([]);

  useEffect(() => () => previewUrls.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl)), []);

  useEffect(() => {
    let active = true;
    const pendingPhotos = photos.filter((photo) => {
      if (!photo.key) return false;
      const previewKey = `${photo.name}-${photo.lastModified || ''}-${photo.size || ''}`;
      return !previews[previewKey];
    });

    if (!pendingPhotos.length) return undefined;

    setLoadingPreviews((previous) => ({
      ...previous,
      ...Object.fromEntries(pendingPhotos.map((photo) => [`${photo.name}-${photo.lastModified || ''}-${photo.size || ''}`, true])),
    }));

    void Promise.all(
      pendingPhotos.map(async (photo) => {
        const previewKey = `${photo.name}-${photo.lastModified || ''}-${photo.size || ''}`;
        try {
          const previewUrl = await getFilePreviewUrl(photo.key);
          return [previewKey, previewUrl];
        } catch {
          return [previewKey, null];
        }
      }),
    ).then((loadedPreviews) => {
      if (!active) return;
      const loadedEntries = loadedPreviews.filter(Boolean);
      setPreviews((previous) => ({
        ...previous,
        ...Object.fromEntries(loadedEntries.filter(([, url]) => url)),
      }));
      setLoadingPreviews((previous) => ({
        ...previous,
        ...Object.fromEntries(loadedEntries.map(([key]) => [key, false])),
      }));
      setFailedPreviews((previous) => ({
        ...previous,
        ...Object.fromEntries(loadedEntries.filter(([, url]) => !url).map(([key]) => [key, true])),
      }));
    });

    return () => {
      active = false;
    };
  }, [photos, previews]);

  const registerLocalPreviews = (files) => {
    const nextPreviews = {};
    files.forEach((file) => {
      const key = `${file.name}-${file.lastModified}-${file.size}`;
      nextPreviews[key] = URL.createObjectURL(file);
      previewUrls.current.push(nextPreviews[key]);
    });
    setPreviews((previous) => ({ ...previous, ...nextPreviews }));
  };

  const selectFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    registerLocalPreviews(files);
    await onFiles(files);
    event.target.value = '';
  };

  return (
    <div className="service-entry-photo-field">
      <label className="service-entry-photo-label">{label}</label>
      {hint && <p>{hint}</p>}
      {onSelectExisting && (
        <ServiceOrderFileUpload
          onUpload={(selectedFile) => {
            registerLocalPreviews([selectedFile]);
            return onFiles([selectedFile]);
          }}
          onDeselect={() => undefined}
          onDelete={() => undefined}
          onSelectExisting={onSelectExisting}
          label="Origem das fotos"
          hint="Selecione um arquivo já armazenado ou envie uma nova foto."
          selectedBadge="Foto selecionada"
          addLabel="Adicionar foto"
          addHint="Clique ou arraste uma imagem por vez"
          uploadingLabel="Preparando fotos..."
          uploadingHint="Aguarde enquanto as fotos são preparadas."
          accept="image/*"
          category="recebimento"
          showLibrary
        />
      )}
      {!onSelectExisting && (
        <label className="service-entry-photo-picker">
          <input type="file" accept="image/*" capture="environment" multiple onChange={selectFiles} />
          <span aria-hidden="true">＋</span>
          <strong>Adicionar foto{photos.length > 0 ? 's' : ''}</strong>
          <small>JPG, PNG ou HEIC · armazenada no sistema</small>
        </label>
      )}
      {photos.length > 0 && (
        <div className="service-entry-photo-list">
          {photos.map((photo) => {
            const previewKey = `${photo.name}-${photo.lastModified || ''}-${photo.size || ''}`;
            return (
              <div className="service-entry-photo-item" key={photo.id}>
                {previews[previewKey] ? (
                  <img
                    src={previews[previewKey]}
                    alt={`Foto: ${photo.name}`}
                    onError={() => {
                      setFailedPreviews((previous) => ({ ...previous, [previewKey]: true }));
                      setPreviews((previous) => {
                        const next = { ...previous };
                        delete next[previewKey];
                        return next;
                      });
                    }}
                  />
                ) : loadingPreviews[previewKey] ? (
                  <span className="service-entry-photo-skeleton" aria-label="Carregando prévia" />
                ) : (
                  <span className="service-entry-photo-placeholder">
                    {failedPreviews[previewKey] ? 'Prévia indisponível' : photo.demo ? 'DEMO' : 'IMG'}
                  </span>
                )}
                <span title={photo.name}>{photo.name}</span>
                <button type="button" onClick={() => onRemove(photo)}>
                  Remover
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ServiceEntryChecklistFileField = ({ label, files = [], onFiles, onRemove, onSelectExisting, category }) => {
  const file = files[0];

  return (
    <ServiceOrderFileUpload
      file={file}
      onUpload={(selectedFile) => onFiles([selectedFile])}
      onDeselect={() => file && onRemove(file)}
      onDelete={() => file && onRemove(file)}
      label={label}
      hint=""
      selectedBadge="Foto selecionada"
      addLabel="Adicionar foto"
      addHint="Clique ou arraste uma imagem"
      uploadingLabel="Enviando foto..."
      uploadingHint="Aguarde enquanto a foto é armazenada."
      accept="image/*"
      onSelectExisting={onSelectExisting}
      category={category}
      showLibrary
      variant="checklist"
    />
  );
};

export const ReadOnlyDatePickerInput = forwardRef(({ value, onClick, placeholder, className }, ref) => (
  <input
    ref={ref}
    type="text"
    value={value || ''}
    placeholder={placeholder}
    className={className || 'rkm-input zenit-field'}
    onClick={onClick}
    onMouseDown={(event) => event.preventDefault()}
    readOnly
  />
));

export const ServiceOrderInvoiceFileField = (props) => (
  <ServiceOrderFileUpload {...props} uploadingLabel="Enviando nota fiscal..." uploadingHint="Aguarde enquanto o arquivo é armazenado." />
);
