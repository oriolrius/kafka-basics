#!/usr/bin/env node

/**
 * Project Structure Overview
 * Shows the organization of the kafka-basics project
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    KAFKA BASICS - PROJECTE                     ║
╚════════════════════════════════════════════════════════════════╝

📁 ESTRUCTURA DEL PROJECTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

kafka-basics/
│
├── 📂 src/                         # Codi font
│   ├── 📂 producers/               # Productors de missatges
│   │   ├── producer.js             # Productor bàsic (JSON/text)
│   │   └── avro-producer.js        # Productor amb Avro
│   │
│   ├── 📂 consumers/               # Consumidors de missatges
│   │   ├── consumer.js             # Consumidor bàsic (JSON/text)
│   │   ├── avro-consumer.js        # Consumidor Avro
│   │   └── universal-consumer.js   # Consumidor universal ⭐
│   │
│   ├── 📂 admin/                   # Eines d'administració
│   │   ├── list-messages.js        # Llistar tots els missatges
│   │   ├── topic-info.js           # Informació del topic
│   │   └── delete-topic.js         # Esborrar topic
│   │
│   └── 📂 utils/                   # Utilitats
│       ├── kafka-config.js         # Configuració compartida
│       └── diagnostic.js           # Test de connexió
│
├── 📂 schemas/                     # Schemas Avro
│   └── test-schema.json
│
├── 📂 examples/                    # Exemples
│   └── sample-message.json
│
├── 📄 .env                         # Configuració (crear-lo!)
├── 📄 package.json                 # Dependències i scripts
│
└── 📚 Documentació
    ├── README.md                   # Guia completa
    ├── QUICK-START.md              # Inici ràpid
    ├── CONSUMERS.md                # Guia de consumidors
    └── ADMIN-TOOLS.md              # Guia d'eines admin

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ COMANDES DISPONIBLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔨 PRODUCTORS (enviar missatges)
  pnpm pub              Productor bàsic (JSON/text)
  pnpm pub-avro         Productor amb Avro

📨 CONSUMIDORS (rebre missatges)
  pnpm sub              Consumidor bàsic (JSON/text)
  pnpm sub-avro         Consumidor Avro
  pnpm sub-universal    Consumidor universal (auto-detect) ⭐

🔧 ADMINISTRACIÓ (gestionar topics)
  pnpm list             Llistar tots els missatges
  pnpm topic-info       Informació del topic
  pnpm topic-delete     Esborrar topic (requereix confirmació)

🩺 DIAGNÒSTIC
  pnpm diagnose         Test de connexió a Kafka

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 INICI RÀPID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Instal·la dependències:
   $ pnpm install

2. Configura .env:
   $ cp .env.example .env
   $ nano .env

3. Prova la connexió:
   $ pnpm diagnose

4. Veure què hi ha al topic:
   $ pnpm topic-info
   $ pnpm list

5. Enviar un missatge:
   $ pnpm pub

6. Consumir missatges:
   $ pnpm sub-universal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 MÉS INFORMACIÓ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Consulta la documentació detallada:
  • README.md       → Guia completa del projecte
  • QUICK-START.md  → Inici ràpid i casos d'ús
  • CONSUMERS.md    → Tot sobre els consumidors
  • ADMIN-TOOLS.md  → Tot sobre les eines admin

╚════════════════════════════════════════════════════════════════╝
`);
