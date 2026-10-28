# Especificação - Document Management System

**Versão:** 1.0  
**Status:** Especificação para orientar a implementação  
**Data:** 2026-10-28

## 1. Objetivo

Disponibilizar uma aplicação web para que usuários enviem, listem e baixem seus documentos, mantendo os arquivos no filesystem local e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de um arquivo por requisição.
- Armazenamento dos arquivos no diretório local `backend/storage`, usando `multer` com `diskStorage`.
- Registro em memória dos metadados de cada documento durante a execução do processo.
- Listagem e download dos documentos associados ao identificador de usuário enviado na requisição.
- Interface web para envio, listagem e download.
- Configurações operacionais via variáveis de ambiente quando aplicável.

### Fora do escopo

- Armazenamento em nuvem ou em qualquer serviço externo.
- Banco de dados ou persistência durável dos metadados.
- Versionamento, compartilhamento, edição ou exclusão de documentos.
- Autenticação real, autorização baseada em identidade verificada ou gestão de contas.
- Busca textual, indexação, antivírus ou análise do conteúdo dos arquivos.

## 3. Requisitos funcionais

| ID | Requisito | Descrição |
| --- | --- | --- |
| RF-01 | Identificação demonstrativa | As operações de documentos recebem um `x-user-id` não vazio. Esse valor identifica o dono para fins funcionais do MVP, mas não comprova a identidade do solicitante. |
| RF-02 | Envio de documento | O usuário pode enviar um arquivo em `multipart/form-data`. O sistema grava o conteúdo localmente e cria os metadados com o dono definido pelo `x-user-id`. |
| RF-03 | Identificador único | Cada documento recebe um identificador opaco e único gerado pelo servidor, independente do nome original. |
| RF-04 | Listagem por dono | O usuário pode listar os metadados dos documentos associados ao seu `x-user-id`. A resposta não expõe caminhos locais nem nomes internos de armazenamento. |
| RF-05 | Download por identificador | O usuário pode baixar o conteúdo binário de um documento associado ao seu `x-user-id`, pelo identificador do documento. |
| RF-06 | Isolamento funcional | A listagem não retorna documentos associados a outro `x-user-id`. Um documento inexistente ou não associado ao solicitante resulta na mesma resposta de não encontrado. |
| RF-07 | Retorno de erros | Entradas inválidas, arquivo ausente, limite excedido e documento indisponível recebem respostas HTTP apropriadas e mensagens sem detalhes internos do filesystem. |
| RF-08 | Interface de documentos | A interface permite selecionar e enviar um arquivo, visualizar a lista retornada pela API e iniciar o download de um documento. |
| RF-09 | Saúde da aplicação | A aplicação disponibiliza uma verificação de saúde sem exigir identificação de usuário. |

## 4. Requisitos não funcionais

| ID | Requisito | Descrição |
| --- | --- | --- |
| RNF-01 | Armazenamento local | Os arquivos são gravados exclusivamente no filesystem local em `backend/storage`, usando `multer` com `diskStorage`. Não usar armazenamento remoto. |
| RNF-02 | Metadados voláteis | Os metadados permanecem em memória durante a execução. Após reiniciar o processo, os metadados são perdidos; arquivos existentes no disco podem ficar sem referência recuperável nesta fase. |
| RNF-03 | Limite de upload | O tamanho máximo padrão é 50 MiB (52.428.800 bytes), configurável por ambiente. Requisições acima do limite são rejeitadas com HTTP 413. |
| RNF-04 | Tipos de arquivo | O MVP não define uma lista fechada de tipos permitidos. O MIME type informado pelo cliente é apenas metadado e não deve ser tratado como verificação de segurança do conteúdo. |
| RNF-05 | Configuração | Porta e limite de upload são configurados por variáveis de ambiente, com defaults documentados; o diretório de armazenamento permanece local em `backend/storage`. |
| RNF-06 | Arquitetura | O backend mantém as responsabilidades separadas nas camadas `routes`, `controllers`, `services` e `repositories`, com dependências no sentido `routes -> controllers -> services -> repositories`. |
| RNF-07 | Segurança do filesystem | O nome original não é usado como caminho de gravação. O nome físico é gerado pelo servidor; caminhos internos não são retornados ao cliente. O nome usado no download deve ser tratado como nome de apresentação, não como caminho. |
| RNF-08 | Limite da identificação | `x-user-id` é uma convenção de demonstração controlada pelo cliente, não um mecanismo de autenticação. O isolamento por esse valor não é suficiente para proteger dados em produção. |
| RNF-09 | Testabilidade | Os testes do backend usam o runner nativo `node:test`, conforme a configuração do projeto. |
| RNF-10 | Respostas previsíveis | Erros da API usam JSON com código e mensagem estáveis; detalhes de exceções, caminhos e conteúdo interno não são enviados ao cliente. |

## 5. Modelo de dados (metadados do documento)

### Documento

| Campo | Tipo | Obrigatório | Exposição | Descrição |
| --- | --- | --- | --- | --- |
| `id` | string | Sim | API e interno | Identificador único opaco, gerado pelo servidor (UUID). |
| `originalName` | string | Sim | API e interno | Nome original enviado pelo cliente, usado apenas para apresentação e download. |
| `size` | number | Sim | API e interno | Tamanho do arquivo em bytes. |
| `mimeType` | string | Sim | API e interno | Tipo MIME recebido no upload; não representa validação do conteúdo. |
| `uploadedAt` | string | Sim | API e interno | Instante do recebimento, em UTC e formato ISO 8601. |
| `owner` | string | Sim | API e interno | Valor do header `x-user-id` associado ao documento. |
| `storageName` | string | Sim | Apenas interno | Nome físico gerado pelo servidor para o arquivo no diretório de armazenamento. |
| `storagePath` | string | Sim | Apenas interno | Localização usada para recuperar o arquivo dentro do armazenamento local. Nunca retornar pela API. |

O repositório de metadados mantém uma coleção em memória indexada por `id` (por exemplo, um `Map`). O armazenamento de arquivos e a coleção de metadados são locais ao processo; não há garantia de recuperação de metadados após reinicialização.

### Representação pública

As respostas de upload e listagem incluem somente `id`, `originalName`, `size`, `mimeType`, `uploadedAt` e `owner`. `storageName` e `storagePath` são dados internos e não fazem parte do contrato HTTP.

## 6. Contratos de API

### Convenções gerais

- Os caminhos abaixo são os caminhos usados pelo frontend, com prefixo `/api`.
- No desenvolvimento, o proxy do Vite encaminha `/api` ao backend e remove esse prefixo. Assim, por exemplo, `/api/upload` chega ao backend como `/upload`.
- Todas as operações de documentos exigem o header `x-user-id` com valor não vazio. Ele é demonstrativo e não substitui autenticação.
- Resposta padrão de erro:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

### `POST /api/upload`

**Descrição:** recebe e armazena um documento.

**Entrada:**

- `Content-Type: multipart/form-data`
- Header `x-user-id`: obrigatório.
- Campo multipart `file`: um arquivo obrigatório.
- Tamanho máximo: 50 MiB por padrão, configurável por ambiente.

**Sucesso — `201 Created`:**

```json
{
  "document": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "relatorio.pdf",
    "size": 102400,
    "mimeType": "application/pdf",
    "uploadedAt": "2026-10-28T10:30:00.000Z",
    "owner": "demo-user-001"
  }
}
```

**Erros:**

- `400 Bad Request` — header ausente/vazio, multipart inválido ou campo `file` ausente.
- `413 Payload Too Large` — arquivo excede o limite configurado.
- `500 Internal Server Error` — falha ao gravar arquivo ou registrar metadados.

### `GET /api/documents`

**Descrição:** lista os documentos associados ao solicitante demonstrativo.

**Entrada:** header `x-user-id` obrigatório.

**Sucesso — `200 OK`:**

```json
{
  "documents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "originalName": "relatorio.pdf",
      "size": 102400,
      "mimeType": "application/pdf",
      "uploadedAt": "2026-10-28T10:30:00.000Z",
      "owner": "demo-user-001"
    }
  ]
}
```

Quando não houver documentos, retorna `200 OK` com `"documents": []`. A resposta não contém documentos de outro `x-user-id` nem caminhos locais.

**Erros:**

- `400 Bad Request` — header `x-user-id` ausente ou vazio.
- `500 Internal Server Error` — falha inesperada ao consultar os metadados.

### `GET /api/documents/:id/download`

**Descrição:** retorna o arquivo associado ao identificador, se pertencer ao `x-user-id` informado.

**Entrada:**

- Parâmetro `id`: identificador do documento.
- Header `x-user-id`: obrigatório.

**Sucesso — `200 OK`:**

- Corpo binário do arquivo.
- `Content-Type`: MIME type registrado, com fallback para `application/octet-stream`.
- `Content-Disposition: attachment`, com o nome original tratado com segurança como nome de arquivo.

**Erros:**

- `400 Bad Request` — header `x-user-id` ausente ou vazio, ou identificador inválido.
- `404 Not Found` — documento inexistente ou não associado ao `x-user-id`; as duas situações têm a mesma resposta.
- `500 Internal Server Error` — falha inesperada ao ler o arquivo. Não expor o caminho local.

### `GET /api/health`

**Descrição:** verificação de saúde da aplicação; no backend o caminho correspondente é `/health`.

**Sucesso — `200 OK`:**

```json
{
  "status": "ok"
}
```

Este endpoint já existe no seed atual. Os endpoints de documento descritos acima são contratos-alvo e ainda não estão implementados.

## 7. Decisões arquiteturais

### Backend

- Node.js e Express, em CommonJS.
- Clean Architecture simples, com fluxo de dependência `routes -> controllers -> services -> repositories`.
- `routes` mapeiam os endpoints e delegam o tratamento HTTP; `controllers` tratam entrada e resposta; `services` concentram regras, incluindo associação e isolamento por `owner`; `repositories` encapsulam acesso aos metadados em memória e aos arquivos locais.
- `multer` com `diskStorage` grava exclusivamente em `backend/storage`. O nome físico do arquivo é gerado no servidor e não depende do nome recebido.
- Metadados em memória; sem banco de dados. Arquivos e metadados não têm ciclo de persistência sincronizado após reinicialização.
- O tratamento de erros HTTP não expõe stack traces nem caminhos locais.

### Frontend

- React com componentes funcionais e Hooks, construído com Vite.
- Organização por componentes, páginas e serviços, conforme as convenções do projeto.
- Comunicação com a API via `fetch` usando os caminhos com prefixo `/api`.
- O identificador demonstrativo deve ser enviado como `x-user-id`; essa convenção não deve ser apresentada como autenticação segura.
- Validação no frontend melhora a experiência, mas o backend continua responsável por validar as requisições e aplicar o limite de upload.

### Configuração e armazenamento

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP do backend. |
| `MAX_FILE_SIZE` | `52428800` | Limite máximo de upload em bytes (50 MiB). |

O diretório de arquivos é `backend/storage`, conforme a restrição do projeto; não usar provedores externos nem configurar um destino remoto. O proxy `/api` para `http://localhost:3000` é uma conveniência de desenvolvimento do Vite, não uma dependência de armazenamento.

## 8. Plano de execução

As etapas abaixo são marcos futuros de trabalho, não execução de arquivos nesta especificação. Cada etapa deve respeitar as decisões arquiteturais e os contratos definidos acima.

1. **Consolidar o contrato:** confirmar os campos, respostas, limites e comportamento de isolamento demonstrativo antes da implementação.
2. **Habilitar o fluxo de documentos no backend:** estabelecer gravação local com `multer`, metadados em memória e regras de negócio de associação por dono, mantendo as responsabilidades nas camadas definidas.
3. **Disponibilizar e validar a API:** atender aos contratos de upload, listagem e download, incluindo erros, limites e testes automatizados para sucesso e falhas.
4. **Construir a experiência web:** permitir envio, consulta e download por meio da API, com estados de carregamento, sucesso e erro.
5. **Integrar e verificar o sistema:** validar o fluxo completo pelo proxy de desenvolvimento e confirmar que os arquivos permanecem locais, que a listagem respeita o dono demonstrativo e que nenhuma rota expõe caminhos internos.
6. **Revisar as limitações do MVP:** documentar a perda de metadados após reinicialização e manter explícito que `x-user-id` não oferece autenticação adequada para produção.