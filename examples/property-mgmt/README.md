# Property Management Portal

A comprehensive real estate portfolio management application with 8 entities, 80+ fields, and 20 state machine transitions. Demonstrates the full breadth of GateHouse UI features including all 5 chart types, transition guards, type-to-confirm, transition forms, stepped wizards, report builders, settings pages, bulk actions, sensitive field masking, star ratings, and more.

## Quick Start

```bash
go run ./cmd/serve --spec examples/property-mgmt/spec.yaml --data examples/property-mgmt/data.json
```

## Entities

| Entity | Records | Fields | Transitions |
|---|---|---|---|
| Property | 8 | 14 | — |
| Unit | 24 | 12 | — |
| Tenant | 15 | 13 | — |
| Lease | 18 | 14 | 5 |
| Payment | 30 | 12 | 4 |
| MaintenanceRequest | 12 | 16 | 5 |
| Vendor | 8 | 13 | 3 |
| Inspection | 10 | 14 | 3 |
| **Total** | **125** | **108** | **20** |

## Theme

Teal primary (`#0D9488`), light mode, bordered surfaces, accent-bar header, medium elevation.
