# Kafka Basics

Toolkit per treballar amb Kafka: productors, consumidors i administració.

## Inici Ràpid

```bash
pnpm install              # Instal·lar dependències
cp .env.example .env      # Crear fitxer de configuració
pnpm kstart               # Mostrar ajuda
```

## Estructura

```text
src/
├── producers/
├── consumers/
├── admin/
└── utils/
```

## Comandes

### Productors

```bash
pnpm kpub              # Enviar JSON/text
pnpm kpub-avro         # Enviar Avro
```

### Consumidors

```bash
pnpm ksub              # Rebre JSON/text
pnpm ksub-avro         # Rebre Avro
pnpm ksub-universal    # Rebre qualsevol (auto-detect)
```

### Administració

```bash
pnpm klist             # Llistar tots els missatges
pnpm ktopic-info       # Info del topic
pnpm ktopic-delete     # Esborrar topic
```

### Utilitats

```bash
pnpm kstart            # Ajuda
pnpm kdiagnose         # Test connexió
```

## Configuració

Crea `.env`:

```env
KAFKA_BROKER=localhost:9092
KAFKA_TOPIC=test-topic
KAFKA_MESSAGE_CONTENT=Hola

KAFKA_CONSUMER_GROUP=my-group
KAFKA_FROM_BEGINNING=false

KAFKA_USERNAME=
KAFKA_PASSWORD=
KAFKA_USE_TLS=false

SCHEMA_REGISTRY_URL=http://localhost:8081
AVRO_SCHEMA_SUBJECT=test-message-value

KAFKA_CONFIRM_DELETE=no
```

## Exemples

```bash
pnpm ktopic-info                           # Veure info del topic
pnpm klist                                 # Llistar tots els missatges
KAFKA_CONFIRM_DELETE=yes pnpm ktopic-delete # Esborrar topic
```
