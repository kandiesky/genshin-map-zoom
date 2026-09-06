# Genshin Map Zoom Extender 🔍🗺️

🌐 **Idiomas / Languages:** [🇺🇸 English](README.md) | **🇧🇷 Português**

Extensão e UserScript para **Waterfox** (e Firefox) que remove o limite de zoom do mapa interativo de Genshin Impact no site [genshin-impact-map.appsample.com](https://genshin-impact-map.appsample.com/).

---

## 🎯 O Problema que Resolve

No site oficial do AppSample:
- O zoom máximo nativo é travado em **15** (e **13** em áreas como Chasm e Enkanomiya).
- Os servidores do mapa não possuem imagens de blocos (tiles) para zoom 16+, o que normalmente causaria tela preta ao tentar forçar o zoom.
- Em áreas com alta densidade de itens (templos, cavernas, vilas), os marcadores de baús, óculos e quests ficam **completamente amontoados e sobrepostos**, sendo impossível distinguir qual é qual.

## 🚀 Como Esta Extensão Resolve

1. **Desbloqueio de Zoom**: Eleva o nível de zoom máximo de 15 para até **20 (32x mais próximo)** ou **22 (128x)**.
2. **Reamostragem e Upscaling Virtual de Tiles**: Quando você dá zoom além do nível nativo (16 a 22), o algoritmo calcula a posição exata no bloco original (zoom 15) que já está em cache e o amplia dinamicamente com aceleração por GPU. Zero telas pretas, zero requisições 404.
3. **Separação Natural dos Marcadores**: Como os marcadores usam coordenadas de latitude/longitude no Google Maps, ao aproximar a câmera eles **se separam perfeitamente na tela**, revelando cada baú e item individualmente.
4. **Controles Nativos e HUD Flutuante**: Funciona diretamente com a **rodinha do mouse (scroll)**, **duplo clique** e com os botões `+` e `−` do próprio site. Além disso, adiciona um painel HUD discreto na tela e um menu popup na barra de ferramentas.

---

## 📦 Opções de Instalação no Waterfox

Você pode instalar de duas formas práticas:

### Método 1: Como Extensão do Waterfox (Recomendado)

#### Opção A — Carregar Temporariamente (Rápido para Testar):
1. Abra o **Waterfox**.
2. Na barra de endereços, digite: `about:debugging` e pressione Enter.
3. No menu à esquerda, clique em **Este Waterfox** (This Waterfox / Runtime).
4. Na seção *Extensões Temporárias*, clique em **Carregar extensão temporária...** (Load Temporary Add-on...).
5. Navegue até a pasta deste projeto e selecione o arquivo:
   ```
   manifest.json  (dentro da pasta extension/)
   OU
   genshin-map-zoom.xpi  (na raiz do projeto)
   ```
6. Pronto! A extensão estará ativa e com o ícone visível na barra de ferramentas.

#### Opção B — Instalação Permanente no Waterfox:
O Waterfox (ao contrário do Firefox padrão) permite instalar extensões não assinadas permanentemente:
1. No Waterfox, abra `about:config` e clique em *Aceitar o risco e continuar*.
2. Pesquise por `xpinstall.signatures.required` e altere seu valor para `false`.
3. Abra `about:addons` (Gerenciador de extensões).
4. Clique no ícone de engrenagem ⚙ no canto superior direito e selecione **Instalar extensão a partir de um arquivo...**.
5. Selecione o arquivo `genshin-map-zoom.xpi` ou arraste-o para a janela do Waterfox.
6. Confirme a instalação.

---

### Método 2: Como UserScript (Violentmonkey / Tampermonkey)

Se você já usa gerenciadores de scripts de usuário (como **Violentmonkey** ou **Tampermonkey**) no Waterfox:
1. Abra o seu gerenciador de UserScripts no Waterfox.
2. Crie um novo script.
3. Copie e cole todo o conteúdo do arquivo [genshin-map-zoom.user.js](./genshin-map-zoom.user.js).
4. Salve o script (`Ctrl+S`).
5. Acesse [genshin-impact-map.appsample.com](https://genshin-impact-map.appsample.com/) e aproveite!

---

## 🎮 Controles e Funcionalidades

### 1. No Mapa
- **Roda do Mouse / Pinch no Touchpad**: Aumente ou diminua o zoom livremente.
- **Botões nativos `+` e `−`**: Continuam funcionando até o novo limite máximo.
- **HUD Flutuante (canto inferior direito)**:
  - Exibe o nível atual em tempo real (ex: `🔍 Zoom: 18 / 20`).
  - Botões rápidos `[−]` e `[+]`.
  - Botão `[⟲]` para resetar rapidamente para o zoom padrão (11).
  - Botão de engrenagem `[⚙]` para abrir as opções rápidas direto na tela.

### 2. No Popup da Extensão (Barra do Navegador)
- **Ativar / Desativar Zoom Estendido**: Ativa ou restaura o limite padrão do site instantaneamente.
- **Slider de Zoom Máximo**: Escolha entre 16 (2x), 18 (8x), 20 (32x) ou até 22 (128x).
- **Filtro de Imagem (Upscaling)**:
  - *Suave (Bilinear)*: Interpolação suave padrão para fotos e mapas.
  - *Nítido (Pixelado)*: Mantém bordas nítidas sem borrar.
- **Exibir Indicador HUD**: Permite ocultar o HUD na tela se preferir uma visão limpa.

---

## 🛠️ Estrutura do Projeto

```
GenshinMapZoom/
├── extension/                   # Código fonte da WebExtension
│   ├── manifest.json            # Manifesto de configuração (Waterfox/Firefox)
│   ├── content.js               # Script de conteúdo (injeção e ponte de mensagens)
│   ├── inject.js                # Motor de interceptação do Google Maps e upscaling
│   ├── popup/                   # Interface de configurações do popup
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   └── icons/                   # Ícones da extensão (16, 48, 128px)
├── genshin-map-zoom.user.js     # Versão completa em arquivo único para Violentmonkey/Tampermonkey
├── genshin-map-zoom.xpi         # Pacote compilado para instalação direta
├── genshin-map-zoom.zip         # Pacote .zip da extensão
├── generate_icons.js            # Gerador de ícones PNG em Node.js puro
├── build.js                     # Script de empacotamento automatizado
├── README.md                    # Versão em inglês
└── README.pt-BR.md              # Este guia em português
```

---

## 💻 Compatibilidade Testada
- **Waterfox**: Totalmente compatível (Current e G-series).
- **Firefox**: Compatível via `about:debugging` e UserScript.
- **Site Alvo**: [genshin-impact-map.appsample.com](https://genshin-impact-map.appsample.com/) (suporta mapa de Teyvat, Enkanomiya, Chasm, subterrâneo e camadas de andares).
