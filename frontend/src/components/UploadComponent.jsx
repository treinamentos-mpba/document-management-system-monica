import { useRef, useState } from 'react';

export default function UploadComponent({ onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile || isUploading) {
      return;
    }

    setIsUploading(true);

    try {
      const uploaded = await onUpload(selectedFile);
      if (uploaded) {
        setSelectedFile(null);
        inputRef.current.value = '';
      }
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-panel" aria-labelledby="upload-heading">
      <div className="upload-panel-heading">
        <p className="panel-kicker">NOVO ARQUIVO</p>
        <h2 id="upload-heading">Adicionar documento</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <label className="upload-picker" htmlFor="document-file">
          <span className="upload-symbol" aria-hidden="true">+</span>
          <span className="picker-copy">
            <strong>{selectedFile ? selectedFile.name : 'Escolher arquivo'}</strong>
            <span>{selectedFile ? 'Pronto para envio' : 'Selecione um arquivo do dispositivo'}</span>
          </span>
          <span className="picker-action">Procurar</span>
        </label>
        <input
          ref={inputRef}
          className="visually-hidden"
          id="document-file"
          type="file"
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
        />

        <button className="upload-button" type="submit" disabled={!selectedFile || isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar documento'}
        </button>
      </form>
      <p className="upload-footnote">Os documentos ficam disponíveis nesta biblioteca.</p>
    </section>
  );
}