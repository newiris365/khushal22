# IRIS 365 Code Debt & Feature Roadmap Audit Log

## Executive Summary
A repository-wide code audit was conducted to triage `TODO`, `FIXME`, and `HACK` comments across `src/`. Zero unhandled bug markers or debt comments exist in shipped production logic. All event domain references to "Hackathon" represent standard event category metadata in campus event management.

## Audited Domain Modules
1. **Core Auth & Scoping**: Fully hardened (`JWT_SECRET` fail-closed, role normalization, query-token restriction).
2. **Campus Core & Marksheets**: Fully hardened (IDOR ownership verification, student marksheet endpoints).
3. **Warden & Gate QR Check-in**: Fully hardened (dynamic crypto-random hex secrets stored in database per institution).
4. **Services & Push Notifications**: Fully hardened (FCM fallback logging via Winston logger).

## Deferred Feature Enhancements (Tracked Backlog)
- [ ] **Real Hardware Serial Port Integration**: Optional physical RFID reader serial port connection (currently runs in sandbox emulation when `serialport` binary is omitted).
- [ ] **Multi-region Supabase Replication**: Optional multi-region read replicas configuration for ultra-high throughput institutions.
