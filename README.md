# TeachYourself

Sistema de destilação de conhecimento, estruturação de trilhas de estudo e referência técnica em computação a partir de livros canônicos, papers seminais, simuladores visuais em Astro e código verificável em baixo nível.

## 1. Quick Start

### Execução da Suíte de Testes em C
Execute a suíte de testes de baixo nível para validar a representação de dados em memória e a aritmética de ponto flutuante no compilador local:

```bash
# Compilar e executar a suíte de testes da trilha de Hardware e SO
gcc -Wall -Wextra -Werror -pedantic -std=c11 -fsanitize=undefined \
    tracks/01-hardware-and-os/tests/test_integers_floats.c -lm -o test_runner
./test_runner
```

Saída observável:
```text
Executando testes automatizados do modulo de inteiros e floats...
[PASS] Endianness test passed.
[PASS] Two's complement negation test passed.
[PASS] Safe overflow detection test passed.
[PASS] Biased power of 2 division test passed.
[PASS] Floating point non-associativity test passed.
Todos os testes passaram com 100% de sucesso!
```

### Inicialização da Plataforma Visual Interativa (Astro)
Para estudar os módulos com renderização tipográfica de fórmulas KaTeX e micro-simuladores interativos de bits e memória:

```bash
cd web
npm install
npm run dev
```

Acesse o painel local em `http://localhost:4321`.

---

## 2. Limitações e Não-Escopo

> [!IMPORTANT]
> O TeachYourself adota limites estritos de escopo para manter a profundidade do conteúdo:
> * **Não distribuição de livros proprietários:** O repositório não armazena nem distribui cópias em PDF/EPUB de obras protegidas por direitos autorais. Os arquivos brutos residem localmente e são isolados pelo `.gitignore`.
> * **Rejeição a resumos superficiais:** O material rejeita notas telegráficas ou resumos simplificados. Cada módulo cobre a mecânica física e matemática integral dos mecanismos abordados.
> * **Sem dependências externas de terceiros para o núcleo:** O núcleo de estudo utiliza exclusivamente C padrão (C99/C11) e Markdown puro, enquanto a interface web opera de forma desacoplada em `web/`.

---

## 3. Topologia do Repositório

```
.
|-- .gitignore                  # Blindagem de caches, PDFs proprietários e dossiês
|-- CONTEXT.md                  # Vocabulário ontológico e cânone de aprendizado
|-- README.md                   # Porta de entrada e documentação do sistema
|-- research/                   # Fundamentação técnica, estilística e arquitetural
|   |-- analise-estilistica-referencias-tecnicas.md
|   |-- arquitetura-e-engenharia-de-readme.md
|   |-- didatica-e-escrita-tecnica-profunda.md
|   |-- engenharia-de-prosa-fluida-e-natural.md
|   |-- mapeamento-fontes-primarias-e-papers-canonicos.md
|   `-- storytelling-etimologia-e-historia-da-computacao.md
|-- tools/                      # Ferramentas determinísticas de extração
|   `-- extract_chapter.py      # Extrator de capítulos de fontes primárias em PDF
|-- tracks/                     # Trilhas temáticas em Markdown/MDX (Fonte da Verdade)
|   |-- 01-hardware-and-os/     # Arquitetura de computadores e sistemas operacionais
|   |   |-- 00-logica-digital-transistores-circuitos-clock.md
|   |   |-- 01-representacao-informacao-inteiros-ponto-flutuante.md
|   |   |-- 02-representacao-programas-assembly-x86-64.md
|   |   |-- 03-arquitetura-processadores-pipelining-hazards.md
|   |   |-- 04-hierarquia-memoria-caches-localidade.md
|   |   |-- 05-memoria-virtual-mmu-paginacao.md
|   |   |-- 06-processos-threads-kernel-syscalls.md
|   |   |-- 07-concorrencia-silicio-atomicos-sincronizacao.md
|   |   |-- 08-io-page-cache-sistemas-arquivos-durabilidade.md
|   |   `-- tests/              # Suíte de testes em C com verificação bit a bit
|   |       |-- test_assembly_stack.c
|   |       |-- test_concurrency.c
|   |       `-- test_integers_floats.c
|   `-- 02-networks/            # Redes e comunicação de dados
|       |-- README.md           # Roteiro e catálogo da trilha de redes
|       |-- 00-rede-ipv4-dns-requisitos-host.md
|       `-- 01-principio-fim-a-fim-internetworking.md
`-- web/                        # Plataforma visual interativa (Astro + React + KaTeX)
    |-- astro.config.mjs        # Configuração de MDX, Tailwind e renderizador KaTeX
    |-- src/
        |-- components/         # Micro-simuladores interativos (LogicCircuits, ByteInspector, CacheSimulator, VirtualMemory, SyscallContext, MesiCache, IoPageCache)
        |-- layouts/            # Layout responsivo com tema editorial pergaminho
        `-- pages/              # Rotas estáticas e páginas MDX interativas
```

---

## 4. Trilhas de Engenharia

O currículo progride dos fundamentos físicos de circuitos e hardware às abstrações de rede e consenso distribuído:

```
[ 01. Sistemas de Computação ] -> [ 02. Redes ] -> [ 03. Bancos de Dados ] -> [ 04. Distribuídos ]
         |
         +--> [ 05. Algoritmos e Design de Sistemas ]
```

### 01. Sistemas de Computação: Do Bit ao Kernel (`tracks/01-hardware-and-os`)
* **Base Canônica:** *Computer Systems: A Programmer's Perspective (CS:APP)* (Bryant & O'Hallaron), *Operating Systems: Three Easy Pieces (OSTEP)* (Arpaci-Dusseau) e *Computer Organization and Design* (Patterson & Hennessy).
* **Conceitos:** Representação binária, inteiros em complemento de dois, ponto flutuante IEEE 754, ISA e Assembly x86-64, registradores, pilha de execução, pipelining, hazards e especulação, hierarquia de memória, isolamento do kernel, concorrência no silício e durabilidade de I/O.
* **Módulos Concluídos:**
  * `00-logica-digital-transistores-circuitos-clock.md`: A física da matéria e portas lógicas: de MOSFETs ao CMOS, universalidade NAND, somadores e clock.
  * `01-representacao-informacao-inteiros-ponto-flutuante.md`: Da representação inteira e organização de bytes ao padrão IEEE 754.
  * `02-representacao-programas-assembly-x86-64.md`: Conceito universal de ISA, registradores, pilha de chamadas, toolchain ELF, PIC e linking dinâmico via GOT/PLT.
  * `03-arquitetura-processadores-pipelining-hazards.md`: Linha de montagem de instruções, hazards RAW, data forwarding, bolhas de load-use, predição de saltos (Smith 2-bit) e vulnerabilidades Spectre.
  * `04-hierarquia-memoria-caches-localidade.md`: A Barreira da Memória (Memory Wall), física da SRAM vs DRAM, linhas de 64 bytes, partição Tag/Set/Offset, mapeamento associativo em conjunto N-Way, políticas Write-Back e princípios de localidade de Denning.
  * `05-memoria-virtual-mmu-paginacao.md`: Memória virtual e a MMU, espaço canônico de 48 bits, árvore PML4 de 4 níveis, acelerador TLB com PCID, ciclo de vida de Page Faults, alocador dinâmico heap (brk/mmap) e zero-copy via mmap.
  * `06-processos-threads-kernel-syscalls.md`: Fronteira do kernel e anéis de proteção (Ring 3 vs Ring 0), a instrução rápida syscall com IA32_LSTAR, a estrutura task_struct, equivalência ontológica de clone(), taxonomia ECF via IDT e escalonador preemptivo CFS.
  * `07-concorrencia-silicio-atomicos-sincronizacao.md`: Concorrência multi-core, protocolo MESI de coerência de cache, false sharing, modelo TSO, primitivas atômicas (lock cmpxchg), modelo C11, spinlocks, futexes e condições de Coffman.
  * `08-io-page-cache-sistemas-arquivos-durabilidade.md`: Fronteira física de I/O, MMIO, DMA, o Page Cache e dirty pages, o mito do write() persistente, primitivas fsync/fdatasync/O_DIRECT e consistência contra quedas com Journaling (WAL).

### 02. Redes e Comunicação de Dados (`tracks/02-networks`)
* **Base Canônica:** *Computer Networks: A Systems Approach* (Peterson & Davie), *Computer Networking: A Top-Down Approach* (Kurose & Ross) e *TCP/IP Illustrated* (Stevens).
* **Conceitos:** Sockets de baixo nível, controle de congestionamento TCP (RFC 9293), handshake criptográfico TLS 1.3 (RFC 9846) e multiplexação de transporte.
* **Módulos Concluídos:**
  * `00-rede-ipv4-dns-requisitos-host.md`: O envelope comum da internetwork: cabeçalho IPv4 de 20 bytes, TTL e checksum só do cabeçalho, fragmentação com offset em unidades de 8 octetos, mensagem DNS com compressão de nomes e regra de UDP primeiro com retorno em TCP, e requisitos de host das RFCs 1122 e 1123.
  * `01-principio-fim-a-fim-internetworking.md`: O princípio fim a fim e a arquitetura de internetworking: critério de posicionamento de função de Saltzer, Reed e Clark (1984), modelo de referência ARPANET sem burocracia de Padlipsky (RFC 871), arquitetura de internetwork de Cerf e Kahn (1974) com datagramas sem estado nos gateways e confiabilidade nas pontas.

### 03. Bancos de Dados e Armazenamento (`tracks/03-databases`)
* **Base Canônica:** *Database Internals* (Alex Petrov) e *Designing Data-Intensive Applications* (Kleppmann).
* **Conceitos:** Árvores B+ em disco, estruturas LSM-Tree, recuperação de falhas com WAL e algoritmo ARIES (1992), isolamento MVCC e serialização estrita.

### 04. Sistemas Distribuídos (`tracks/04-distributed-systems`)
* **Base Canônica:** *Distributed Systems* (van Steen & Tanenbaum) enriquecido por papers seminais (Lamport 1978, Raft 2014).
* **Conceitos:** Relógios lógicos e vetoriais, algoritmos de consenso (Raft, Paxos), particionamento de rede e modelos de consistência linearizável.

### 05. Algoritmos e Design de Sistemas (`tracks/05-algorithms-and-design`)
* **Base Canônica:** *Introduction to Algorithms (CLRS)* (Cormen et al.) e *A Philosophy of Software Design* (John Ousterhout).
* **Conceitos:** Módulos profundos (*Deep Modules*), estruturas de dados compactas em cache, tabelas hash lock-free e algoritmos em grafos.

---

## 5. Decisões Técnicas e Trade-offs

| Escolha de Engenharia | Benefício Obtido | Custo / Trade-off Aceito |
| :--- | :--- | :--- |
| **Markdown/MDX como fonte da verdade** | Portabilidade total e compatibilidade com leitores de terminal e Git. | Exige camada de compilação web para renderizar interatividade. |
| **Testes de baixo nível em C puro** | Validação real de ponteiros e alinhamento de memória direto na CPU. | Maior verbosidade de código e ausência de assertions de alto nível. |
| **Astro com Ilhas Interativas** | Zero JavaScript por padrão; JS carregado apenas nos simuladores visuais. | Exige Node.js local para rodar o servidor de desenvolvimento. |
| **Isolamento de fontes no Gitignore** | Blindagem legal contra commits acidentais de livros proprietários. | Exige configuração manual do caminho local dos PDFs pelo operador. |
