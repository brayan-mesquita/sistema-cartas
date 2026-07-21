# 🚀 Sistema de Envio de Cartas — Servos Legendários

Repositório Oficial do **Sistema de Envio de Cartas Legendários**.

---

## 🛠️ Como Deployar no Easypanel

1. **Criar Nova Aplicação**:
   - No painel do seu **Easypanel**, clique em **+ New App** $\rightarrow$ selecione **App**.
   - Escolha **GitHub** como fonte e selecione o repositório do projeto.

2. **Configuração de Build**:
   - **Build Method**: `Dockerfile`
   - **Port**: `3000`

3. **Configuração de Volume Persistente (SQLite)**:
   - Em **Volumes**, clique em **+ Add Volume**.
   - **Name**: `sqlite_data`
   - **Mount Path**: `/app/prisma/data`

4. **Build Argument obrigatório** ⚠️:
   Em **Build** → **Build Arguments**, adicione:
   ```
   NEXT_PUBLIC_APP_URL=https://seu-dominio.com.br
   ```
   > Isto **não** é opcional e **não** basta como variável de runtime. O metadata
   > da home é estático, ou seja, as tags `og:image` são resolvidas durante o
   > `npm run build`. Se a variável só existir em runtime, o preview de link do
   > WhatsApp aponta para `localhost` e a imagem não aparece.

5. **Variáveis de Ambiente (Environment Variables)**:
   Configure as variáveis conforme seu arquivo `.env`:
   ```env
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://seu-dominio.com.br
   DATABASE_URL="file:./data/legendarios.db"
   ADMIN_PASSWORD=sua_senha_admin
   ADMIN_SESSION_SECRET=string_aleatoria_longa
   GOOGLE_DRIVE_FOLDER_ID=seu_folder_id_google_drive
   GOOGLE_CLIENT_ID=seu_client_id_oauth
   GOOGLE_CLIENT_SECRET=seu_client_secret_oauth
   GOOGLE_REFRESH_TOKEN=seu_refresh_token_oauth
   GHL_API_KEY=sua_api_key_ghl
   GHL_LOCATION_ID=seu_location_id_ghl
   GHL_CARTAS_FIELD_ID=seu_field_id_ghl
   ```

6. Clique em **Deploy**! 🚀

---

## 🔗 Preview de link (WhatsApp / redes sociais)

O WhatsApp guarda previews em cache de forma agressiva. Depois de um deploy que
mude a imagem ou os metadados, valide e limpe o cache no
[Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) —
o WhatsApp usa a mesma infraestrutura de scraping. Clique em **Scrape Again**
antes de testar num chat.
