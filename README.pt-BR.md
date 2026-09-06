# Genshin Map Zoom Extender

Idiomas: [English](README.md) | Português

Este projeto fornece uma extensão de navegador e um UserScript para Firefox e navegadores compatíveis (como Waterfox). O software aumenta o limite máximo de zoom no site de mapa interativo [genshin-impact-map.appsample.com](https://genshin-impact-map.appsample.com/).

---

## Finalidade

O site de destino limita o zoom do mapa ao nível 15 no mapa principal e ao nível 13 em mapas secundários (como The Chasm e Enkanomiya). O servidor de blocos não armazena imagens de blocos acima desses níveis. Quando marcadores estão próximos, eles se sobrepõem.

Este software altera o comportamento do mapa:
- Aumenta o nível máximo de zoom para o nível 20 ou 22.
- Calcula as coordenadas do bloco pai e redimensiona os blocos em cache para níveis de zoom mais altos.
- Separa os marcadores sobrepostos na tela.
- Mantém a compatibilidade com a roda do mouse, duplo clique e botões de zoom da tela.

---

## Instalação

Você pode instalar este software como uma extensão de navegador ou como um UserScript.

### Opção 1: Extensão de Navegador (Firefox / Waterfox)

#### Instalação Temporária
1. Inicie o Firefox ou Waterfox.
2. Na barra de endereços, digite `about:debugging`.
3. No menu à esquerda, clique em **Este Firefox** (ou **Este Waterfox**).
4. Na seção **Extensões Temporárias**, clique em **Carregar extensão temporária...**.
5. Selecione o arquivo `extension/manifest.json` ou o arquivo `genshin-map-zoom.xpi`.

#### Instalação Permanente (Waterfox, Firefox Developer Edition ou Nightly)
O Firefox padrão requer assinaturas digitais da Mozilla. O Waterfox, Firefox Developer Edition e Firefox Nightly permitem extensões não assinadas:
1. Na barra de endereços, digite `about:config`.
2. Clique em **Aceitar o risco e continuar**.
3. No campo de pesquisa, digite `xpinstall.signatures.required`.
4. Altere o valor da preferência para `false`.
5. Abra `about:addons`.
6. Clique no ícone de engrenagem e clique em **Instalar extensão a partir de um arquivo...**.
7. Selecione o arquivo `genshin-map-zoom.xpi`.
8. Confirme a solicitação de instalação.

### Opção 2: UserScript (Violentmonkey, Tampermonkey ou FireMonkey)

Este método funciona de forma permanente no Firefox padrão, Waterfox e todos os navegadores derivados, sem restrições de assinatura:
1. Abra o gerenciador de UserScripts no Firefox ou Waterfox.
2. Crie um novo UserScript.
3. Substitua o conteúdo do script pelo código do arquivo `genshin-map-zoom.user.js`.
4. Salve o script (`Ctrl+S`).
5. Abra o site [genshin-impact-map.appsample.com](https://genshin-impact-map.appsample.com/).

---

## Controles do Usuário

### Interface na Tela
- **Roda do Mouse / Touchpad**: Role para alterar o nível de zoom.
- **Botões de Zoom na Tela**: Clique em `+` ou `-` para ajustar o nível de zoom.
- **Painel HUD (Canto Inferior Direito)**:
  - Exibe o nível de zoom atual e o nível máximo.
  - Clique em `+` ou `-` para ajustar o zoom.
  - Clique em `⟲` para redefinir o zoom para o nível 11.
  - Clique no ícone de engrenagem para configurar opções (zoom máximo, filtro de imagem e idioma).

### Menu Popup da Extensão
Clique no ícone da extensão na barra de ferramentas do navegador para alterar opções:
- **Ativar Extensão**: Ativa ou desativa a expansão de zoom.
- **Zoom Máximo**: Selecione um limite de zoom entre 16 e 22.
- **Filtro de Imagem**: Selecione `Suave` (bilinear) ou `Nítido` (pixelado).
- **Idioma**: Selecione `Automático (Navegador)`, `English` ou `Português`.
- **Exibir HUD**: Mostra ou oculta a indicação na tela.

---

## Operação Técnica

1. O script é executado antes dos scripts da página (`document-start`).
2. O script monitora o objeto `window.google.maps`.
3. Quando `google.maps.Map` inicializa, o script define `options.maxZoom` com o valor selecionado pelo usuário.
4. Quando `google.maps.ImageMapType` inicializa, o script substitui `getTile`:
   - Para níveis de zoom iguais ou inferiores ao limite nativo, chama a função de bloco original.
   - Para níveis de zoom acima do limite nativo, calcula:
     - `k = zoom - nativeMax`
     - `scale = 2^k`
     - `parentX = floor(coord.x / scale)`
     - `parentY = floor(coord.y / scale)`
     - `dx = coord.x - parentX * scale`
     - `dy = coord.y - parentY * scale`
   - Cria um elemento que renderiza a imagem do bloco pai com deslocamento CSS correspondente.

---

## Estrutura do Projeto

```
GenshinMapZoom/
├── extension/                   # Arquivos fonte da extensão
│   ├── manifest.json            # Manifesto da extensão
│   ├── content.js               # Script de conteúdo
│   ├── inject.js                # Interceptador do mapa e redimensionador de blocos
│   ├── popup/                   # Interface popup da extensão
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   └── icons/                   # Ícones da extensão
├── genshin-map-zoom.user.js     # UserScript autocontido
├── genshin-map-zoom.xpi         # Pacote de extensão compilado
├── genshin-map-zoom.zip         # Arquivo compactado
├── generate_icons.js            # Script gerador de ícones
├── build.js                     # Script de empacotamento
├── test_engine.js               # Testes de cálculo de coordenadas
├── test_hook_lifecycle.js       # Testes de ciclo de vida assíncrono
├── README.md                    # Documentação em inglês
└── README.pt-BR.md              # Documentação em português
```

---

## Compatibilidade

- **Navegadores**: Firefox, Waterfox, LibreWolf, Floorp.
- **Gerenciadores de UserScript**: Violentmonkey, Tampermonkey, FireMonkey.
- **Site de Destino**: [genshin-impact-map.appsample.com](https://genshin-impact-map.appsample.com/).

---

## Licença

Este projeto é distribuído sob a Licença MIT. Consulte o arquivo [LICENSE](LICENSE) para obter detalhes.
