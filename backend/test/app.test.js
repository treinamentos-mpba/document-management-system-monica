const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('permite enviar, listar e baixar documentos por usuário', async () => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let documentId;

  try {
    const missingOwnerResponse = await fetch(`${baseUrl}/documents`);
    assert.strictEqual(missingOwnerResponse.status, 400);

    const emptyFormData = new FormData();
    const missingFileResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'x-user-id': 'usuario-teste' },
      body: emptyFormData,
    });
    assert.strictEqual(missingFileResponse.status, 400);

    const formData = new FormData();
    formData.append('file', new Blob(['conteudo de teste'], { type: 'text/plain' }), 'teste.txt');

    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: { 'x-user-id': 'usuario-teste' },
      body: formData,
    });

    assert.strictEqual(uploadResponse.status, 201);
    const { document } = await uploadResponse.json();
    documentId = document.id;
    assert.strictEqual(document.originalName, 'teste.txt');
    assert.strictEqual(document.owner, 'usuario-teste');
    assert.strictEqual(document.size, Buffer.byteLength('conteudo de teste'));
    assert.strictEqual(Object.hasOwn(document, 'storagePath'), false);

    const listResponse = await fetch(`${baseUrl}/documents`, {
      headers: { 'x-user-id': 'usuario-teste' },
    });
    assert.strictEqual(listResponse.status, 200);
    assert.deepStrictEqual((await listResponse.json()).documents.map(({ id }) => id), [documentId]);

    const otherUserResponse = await fetch(`${baseUrl}/documents`, {
      headers: { 'x-user-id': 'outro-usuario' },
    });
    assert.deepStrictEqual((await otherUserResponse.json()).documents, []);

    const unauthorizedDownload = await fetch(`${baseUrl}/documents/${documentId}/download`, {
      headers: { 'x-user-id': 'outro-usuario' },
    });
    assert.strictEqual(unauthorizedDownload.status, 404);

    const downloadResponse = await fetch(`${baseUrl}/documents/${documentId}/download`, {
      headers: { 'x-user-id': 'usuario-teste' },
    });
    assert.strictEqual(downloadResponse.status, 200);
    assert.strictEqual(await downloadResponse.text(), 'conteudo de teste');
  } finally {
    if (documentId) {
      await fs.unlink(path.join(__dirname, '..', 'storage', documentId)).catch(() => {});
    }
    await new Promise((resolve) => server.close(resolve));
  }
});
