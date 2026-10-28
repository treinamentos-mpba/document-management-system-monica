const documentRepository = require('../repositories/documentRepository');

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    mimeType: document.mimeType,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

function createDocument(file, owner) {
  const document = {
    id: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype || 'application/octet-stream',
    uploadedAt: new Date().toISOString(),
    owner,
    storageName: file.filename,
    storagePath: file.path,
  };

  return toPublicDocument(documentRepository.save(document));
}

function listDocuments(owner) {
  return documentRepository.findByOwner(owner).map(toPublicDocument);
}

function findDocumentForOwner(id, owner) {
  const document = documentRepository.findById(id);

  if (!document || document.owner !== owner) {
    return null;
  }

  return document;
}

module.exports = {
  createDocument,
  listDocuments,
  findDocumentForOwner,
};