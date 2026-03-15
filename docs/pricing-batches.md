# Pricing Batches

## Objetivo

Centralizar remarcaciones masivas con preview, auditoria y rollback.

## UI Admin

- Ruta: `/admin/precios`
- Permite editar `config/business`
- Permite editar `config/pricing`
- Permite simular remarcaciones y aplicar lotes chicos de forma atomica

## Scripts

Los lotes grandes deben ejecutarse desde terminal con credenciales admin.

### Dry run

```bash
node scripts/repriceProducts.js --label="Lista marzo" --mode=percent --value=10
```

### Aplicar

```bash
node scripts/repriceProducts.js --label="Lista marzo" --mode=percent --value=10 --apply=true
```

### Filtrar por categoria o marca

```bash
node scripts/repriceProducts.js --mode=factor --value=1.08 --categorySlug=smartphones --brandQuery=samsung --apply=true
```

### Rollback

```bash
node scripts/rollbackPriceBatch.js --batchId=<ID_DEL_BATCH> --apply=true
```

## Notas

- `products.priceLocked=true` excluye productos de remarcaciones cuando `excludeLocked=true`
- `price_batches/{batchId}` guarda metadata del lote
- `price_batches/{batchId}/items/{productId}` guarda precios viejos y nuevos para rollback
- El checkout muestra aviso si el precio cambio desde que el cliente agrego el producto al carrito
